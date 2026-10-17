import { createClient, createPublicClient } from "@/lib/supabase/server";
import { mapDatabaseRowToPromptItem, type PromptRow } from "@/lib/data/prompts";
import type {
  Collection,
  CollectionItem,
  CollectionWithItems,
  PublicCollection,
  PublicCollectionOwner,
} from "@/types/collections";
import type { Database } from "@/types/database.types";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

function mapCollectionRow(row: CollectionRow, itemCount = 0): Collection {
  return {
    id: row.id,
    publicId: row.public_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    concurrencyVersion: row.concurrency_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount,
  };
}

/**
 * Returns paginated collections owned by the authenticated user.
 * Item count strictly reflects accessible (currently published) prompts only.
 */
export async function getOwnerCollections(
  userId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ collections: Collection[]; total: number }> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize || 12));

  const supabase = await createClient();
  if (!supabase) {
    return { collections: [], total: 0 };
  }

  // 1. Fetch paginated collections
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const { data: collectionsData, count, error } = await supabase
    .from("collections")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(fromIndex, toIndex);

  if (error || !collectionsData) {
    console.error("Error fetching owner collections:", error);
    return { collections: [], total: 0 };
  }

  const collectionIds = collectionsData.map((c) => c.id);
  const countsMap = new Map<string, number>();

  if (collectionIds.length > 0) {
    // 2. Fetch accessible items count (only currently published prompts)
    const { data: itemsData, error: itemsError } = await supabase
      .from("collection_items")
      .select("collection_id, prompt_id, prompts!inner(published)")
      .in("collection_id", collectionIds)
      .eq("prompts.published", true);

    if (!itemsError && itemsData) {
      for (const item of itemsData) {
        countsMap.set(item.collection_id, (countsMap.get(item.collection_id) || 0) + 1);
      }
    }
  }

  const collections = collectionsData.map((c) =>
    mapCollectionRow(c, countsMap.get(c.id) || 0)
  );

  return {
    collections,
    total: count || 0,
  };
}

/**
 * Returns a specific owner collection by ID, including its accessible items in deterministic order.
 */
export async function getOwnerCollectionById(
  collectionId: string,
  userId: string
): Promise<CollectionWithItems | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: collectionRow, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !collectionRow) {
    return null;
  }

  // Fetch collection items with published prompts
  const { data: itemsData, error: itemsError } = await supabase
    .from("collection_items")
    .select("*, prompts!inner(*)")
    .eq("collection_id", collectionId)
    .eq("prompts.published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error fetching collection items:", itemsError);
  }

  const items: CollectionItem[] = (itemsData || []).map((row) => ({
    id: row.id,
    collectionId: row.collection_id,
    promptId: row.prompt_id,
    position: row.position,
    createdAt: row.created_at,
    prompt: row.prompts
      ? mapDatabaseRowToPromptItem(row.prompts as unknown as PromptRow)
      : undefined,
  }));

  return {
    ...mapCollectionRow(collectionRow, items.length),
    items,
  };
}

/**
 * Returns a public collection by its public identifier.
 * Returns null if the collection is private or missing.
 * Owner attribution is only attached if creator profile is active and public.
 */
export async function getPublicCollectionByPublicId(
  publicId: string
): Promise<PublicCollection | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  // 1. Fetch public collection
  const { data: collectionRow, error } = await supabase
    .from("collections")
    .select("*")
    .eq("public_id", publicId)
    .eq("visibility", "PUBLIC")
    .maybeSingle();

  if (error || !collectionRow) {
    return null;
  }

  // 2. Fetch owner profile for attribution (only if public profile is active)
  let owner: PublicCollectionOwner | null = null;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, is_public")
    .eq("id", collectionRow.user_id)
    .maybeSingle();

  if (profileRow?.is_public && profileRow.username) {
    owner = {
      username: profileRow.username,
      displayName: profileRow.display_name,
      avatarUrl: profileRow.avatar_url,
    };
  }

  // 3. Fetch items in owner-defined order (only currently published prompts)
  const { data: itemsData, error: itemsError } = await supabase
    .from("collection_items")
    .select("*, prompts!inner(*)")
    .eq("collection_id", collectionRow.id)
    .eq("prompts.published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error fetching public collection items:", itemsError);
  }

  const items: CollectionItem[] = (itemsData || []).map((row) => ({
    id: row.id,
    collectionId: row.collection_id,
    promptId: row.prompt_id,
    position: row.position,
    createdAt: row.created_at,
    prompt: row.prompts
      ? mapDatabaseRowToPromptItem(row.prompts as unknown as PromptRow)
      : undefined,
  }));

  return {
    id: collectionRow.id,
    publicId: collectionRow.public_id,
    title: collectionRow.title,
    description: collectionRow.description,
    visibility: "PUBLIC",
    createdAt: collectionRow.created_at,
    updatedAt: collectionRow.updated_at,
    owner,
    items,
  };
}

/**
 * Returns user collections along with membership indicator for a specific prompt.
 */
export async function getUserCollectionsWithPromptState(
  userId: string,
  promptId: string
): Promise<{ id: string; title: string; visibility: string; hasPrompt: boolean }[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: collections, error } = await supabase
    .from("collections")
    .select("id, title, visibility")
    .eq("user_id", userId)
    .order("title", { ascending: true });

  if (error || !collections) {
    return [];
  }

  const { data: memberships } = await supabase
    .from("collection_items")
    .select("collection_id")
    .eq("prompt_id", promptId)
    .in("collection_id", collections.map((c) => c.id));

  const memberCollectionIds = new Set((memberships || []).map((m) => m.collection_id));

  return collections.map((c) => ({
    id: c.id,
    title: c.title,
    visibility: c.visibility,
    hasPrompt: memberCollectionIds.has(c.id),
  }));
}
