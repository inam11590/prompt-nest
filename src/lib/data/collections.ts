import { createClient, createPublicClient } from "@/lib/supabase/server";
import { mapDatabaseRowToPromptItem, type PromptRow } from "@/lib/data/prompts";
import { STARTER_PROMPTS } from "@/data/prompts";
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

export const STARTER_PUBLIC_COLLECTIONS: PublicCollection[] = [
  {
    id: "col-editorial-portraits",
    publicId: "editorial-luxury-portraits",
    slug: "editorial-luxury-portraits",
    title: "Editorial Luxury Portraits",
    name: "Editorial Luxury Portraits",
    description: "Haute couture fashion, dramatic chiaroscuro lighting, and high-impact editorial character studies curated for Midjourney and Flux creators.",
    visibility: "PUBLIC",
    isPublic: true,
    createdAt: "2024-09-01T12:00:00Z",
    updatedAt: "2024-10-18T10:00:00Z",
    itemsCount: 4,
    tags: ["fashion", "editorial", "studio", "portraits"],
    coverImageUrls: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
    ],
    owner: {
      username: "elena_creative",
      displayName: "Elena Vance",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    items: [
      {
        id: "item-elp-1",
        collectionId: "col-editorial-portraits",
        promptId: "prompt-7",
        position: 0,
        createdAt: "2024-09-01T12:00:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-7"),
      },
      {
        id: "item-elp-2",
        collectionId: "col-editorial-portraits",
        promptId: "prompt-1",
        position: 1,
        createdAt: "2024-09-01T12:05:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-1"),
      },
      {
        id: "item-elp-3",
        collectionId: "col-editorial-portraits",
        promptId: "prompt-9",
        position: 2,
        createdAt: "2024-09-01T12:10:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-9"),
      },
      {
        id: "item-elp-4",
        collectionId: "col-editorial-portraits",
        promptId: "prompt-3",
        position: 3,
        createdAt: "2024-09-01T12:15:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-3"),
      },
    ],
  },
  {
    id: "col-automotive-shots",
    publicId: "automotive-commercial-shots",
    slug: "automotive-commercial-shots",
    title: "Automotive Commercial Shots",
    name: "Automotive Commercial Shots",
    description: "Sleek automotive aesthetics, industrial brutalism, dynamic reflections, and commercial architectural backdrops.",
    visibility: "PUBLIC",
    isPublic: true,
    createdAt: "2024-09-05T14:30:00Z",
    updatedAt: "2024-10-17T16:00:00Z",
    itemsCount: 4,
    tags: ["automotive", "architecture", "commercial", "cinematic"],
    coverImageUrls: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=600&q=80",
    ],
    owner: {
      username: "marcus_design",
      displayName: "Marcus Ray",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    items: [
      {
        id: "item-acs-1",
        collectionId: "col-automotive-shots",
        promptId: "prompt-2",
        position: 0,
        createdAt: "2024-09-05T14:30:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-2"),
      },
      {
        id: "item-acs-2",
        collectionId: "col-automotive-shots",
        promptId: "prompt-8",
        position: 1,
        createdAt: "2024-09-05T14:35:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-8"),
      },
      {
        id: "item-acs-3",
        collectionId: "col-automotive-shots",
        promptId: "prompt-1",
        position: 2,
        createdAt: "2024-09-05T14:40:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-1"),
      },
      {
        id: "item-acs-4",
        collectionId: "col-automotive-shots",
        promptId: "prompt-5",
        position: 3,
        createdAt: "2024-09-05T14:45:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-5"),
      },
    ],
  },
  {
    id: "col-anamorphic-posters",
    publicId: "anamorphic-3d-posters",
    slug: "anamorphic-3d-posters",
    title: "Anamorphic 3D & Posters",
    name: "Anamorphic 3D & Posters",
    description: "Cutting-edge liquid chrome typography, isometric glassmorphism renders, and Swiss design layout compositions.",
    visibility: "PUBLIC",
    isPublic: true,
    createdAt: "2024-09-10T09:15:00Z",
    updatedAt: "2024-10-18T11:20:00Z",
    itemsCount: 4,
    tags: ["3d-render", "typography", "graphic-design", "poster"],
    coverImageUrls: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    ],
    owner: {
      username: "sophia_art",
      displayName: "Sophia Chen",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    },
    items: [
      {
        id: "item-a3p-1",
        collectionId: "col-anamorphic-posters",
        promptId: "prompt-11",
        position: 0,
        createdAt: "2024-09-10T09:15:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-11"),
      },
      {
        id: "item-a3p-2",
        collectionId: "col-anamorphic-posters",
        promptId: "prompt-5",
        position: 1,
        createdAt: "2024-09-10T09:20:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-5"),
      },
      {
        id: "item-a3p-3",
        collectionId: "col-anamorphic-posters",
        promptId: "prompt-3",
        position: 2,
        createdAt: "2024-09-10T09:25:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-3"),
      },
      {
        id: "item-a3p-4",
        collectionId: "col-anamorphic-posters",
        promptId: "prompt-12",
        position: 3,
        createdAt: "2024-09-10T09:30:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-12"),
      },
    ],
  },
  {
    id: "col-cinematic-golden",
    publicId: "cinematic-golden-hour",
    slug: "cinematic-golden-hour",
    title: "Cinematic Golden Hour",
    name: "Cinematic Golden Hour",
    description: "Warm volumetric sunbeams, majestic alpine vistas, tranquil fjords, and ethereal atmospheric landscapes.",
    visibility: "PUBLIC",
    isPublic: true,
    createdAt: "2024-09-15T18:00:00Z",
    updatedAt: "2024-10-19T08:30:00Z",
    itemsCount: 4,
    tags: ["golden-hour", "landscape", "nature", "cinematic"],
    coverImageUrls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    ],
    owner: {
      username: "kai_cinematic",
      displayName: "Kai Sterling",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    },
    items: [
      {
        id: "item-cgh-1",
        collectionId: "col-cinematic-golden",
        promptId: "prompt-10",
        position: 0,
        createdAt: "2024-09-15T18:00:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-10"),
      },
      {
        id: "item-cgh-2",
        collectionId: "col-cinematic-golden",
        promptId: "prompt-4",
        position: 1,
        createdAt: "2024-09-15T18:05:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-4"),
      },
      {
        id: "item-cgh-3",
        collectionId: "col-cinematic-golden",
        promptId: "prompt-6",
        position: 2,
        createdAt: "2024-09-15T18:10:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-6"),
      },
      {
        id: "item-cgh-4",
        collectionId: "col-cinematic-golden",
        promptId: "prompt-1",
        position: 3,
        createdAt: "2024-09-15T18:15:00Z",
        prompt: STARTER_PROMPTS.find((p) => p.id === "prompt-1"),
      },
    ],
  },
];

/**
 * Returns all public collections for discovery page.
 * Uses live Supabase if available; falls back cleanly to deterministic starter boards.
 */
export async function getAllPublicCollections(): Promise<PublicCollection[]> {
  const supabase = createPublicClient();
  if (supabase) {
    try {
      const { data: collectionsData, error } = await supabase
        .from("collections")
        .select("*")
        .eq("visibility", "PUBLIC")
        .order("updated_at", { ascending: false });

      if (!error && collectionsData && collectionsData.length > 0) {
        const publicCollections: PublicCollection[] = [];
        for (const row of collectionsData) {
          const col = await getPublicCollectionByPublicId(row.public_id);
          if (col) publicCollections.push(col);
        }
        if (publicCollections.length > 0) {
          return publicCollections;
        }
      }
    } catch {
      // Fall through to starter boards
    }
  }
  return STARTER_PUBLIC_COLLECTIONS;
}

/**
 * Returns a public collection by its public identifier or slug.
 * Returns null if the collection is private or missing.
 * Falls back seamlessly to starter collections if not in live database.
 */
export async function getPublicCollectionByPublicId(
  publicIdOrSlug: string
): Promise<PublicCollection | null> {
  const supabase = createPublicClient();
  if (supabase) {
    try {
      // 1. Fetch public collection by public_id or slug
      const { data: collectionRow, error } = await supabase
        .from("collections")
        .select("*")
        .or(`public_id.eq."${publicIdOrSlug}",slug.eq."${publicIdOrSlug}"`)
        .eq("visibility", "PUBLIC")
        .maybeSingle();

      if (!error && collectionRow) {
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

        const coverImageUrls = items
          .map((i) => i.prompt?.imageUrl)
          .filter((url): url is string => !!url)
          .slice(0, 4);

        return {
          id: collectionRow.id,
          publicId: collectionRow.public_id,
          slug: (collectionRow as Record<string, unknown>).slug as string || collectionRow.public_id,
          title: collectionRow.title,
          name: (collectionRow as Record<string, unknown>).name as string || collectionRow.title,
          description: collectionRow.description,
          visibility: "PUBLIC",
          isPublic: true,
          createdAt: collectionRow.created_at,
          updatedAt: collectionRow.updated_at,
          owner,
          items,
          itemsCount: items.length,
          coverImageUrls,
        };
      }
    } catch {
      // Fallback to starter collections
    }
  }

  // Fallback to starter public collections by publicId or slug
  const matchedStarter = STARTER_PUBLIC_COLLECTIONS.find(
    (c) => c.publicId === publicIdOrSlug || c.slug === publicIdOrSlug
  );
  if (matchedStarter) {
    return matchedStarter;
  }

  return null;
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
