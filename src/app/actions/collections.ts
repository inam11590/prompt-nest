"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserCollectionsWithPromptState } from "@/lib/data/collections";
import type { Collection, CollectionVisibility } from "@/types/collections";
import type { Database } from "@/types/database.types";
import crypto from "node:crypto";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  conflict?: boolean;
}

function generatePublicId(): string {
  const randomPart = crypto.randomBytes(6).toString("hex"); // 12 characters
  return `col_${randomPart}`;
}

/**
 * Creates a new collection for the verified authenticated session.
 * Always PRIVATE by default.
 */
export async function createCollectionAction(input: {
  title: string;
  description?: string;
}): Promise<ActionResult<Collection>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const title = input.title.trim();
  if (!title || title.length > 120) {
    return { success: false, error: "Title must be between 1 and 120 characters." };
  }

  const description = input.description?.trim() || null;
  if (description && description.length > 500) {
    return { success: false, error: "Description must not exceed 500 characters." };
  }

  const publicId = generatePublicId();

  const { data, error } = await supabase
    .from("collections")
    .insert({
      public_id: publicId,
      user_id: user.id,
      title,
      description,
      visibility: "PRIVATE",
      concurrency_version: 1,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating collection:", error);
    return { success: false, error: error?.message || "Failed to create collection." };
  }

  revalidatePath("/dashboard/collections");

  return {
    success: true,
    data: {
      id: data.id,
      publicId: data.public_id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      visibility: data.visibility,
      concurrencyVersion: data.concurrency_version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      itemCount: 0,
    },
  };
}

/**
 * Updates collection metadata (title, description, visibility) with optimistic concurrency.
 */
export async function updateCollectionAction(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    visibility?: CollectionVisibility;
    expectedVersion: number;
  }
): Promise<ActionResult<{ newVersion: number }>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  // 1. Fetch current collection to verify ownership & version
  const { data: current, error: fetchError } = await supabase
    .from("collections")
    .select("concurrency_version, user_id, public_id, visibility")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: "Collection not found." };
  }

  if (current.user_id !== user.id) {
    return { success: false, error: "Not authorized to update this collection." };
  }

  if (current.concurrency_version !== input.expectedVersion) {
    return {
      success: false,
      conflict: true,
      error: "This collection was modified in another session. Please refresh and try again.",
    };
  }

  const updates: Database["public"]["Tables"]["collections"]["Update"] = {
    concurrency_version: input.expectedVersion + 1,
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title || title.length > 120) {
      return { success: false, error: "Title must be between 1 and 120 characters." };
    }
    updates.title = title;
  }

  if (input.description !== undefined) {
    const description = input.description ? input.description.trim() : null;
    if (description && description.length > 500) {
      return { success: false, error: "Description must not exceed 500 characters." };
    }
    updates.description = description;
  }

  if (input.visibility !== undefined) {
    if (input.visibility !== "PRIVATE" && input.visibility !== "PUBLIC") {
      return { success: false, error: "Invalid visibility state." };
    }
    updates.visibility = input.visibility;
  }

  const { error: updateError } = await supabase
    .from("collections")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("concurrency_version", input.expectedVersion);

  if (updateError) {
    console.error("Error updating collection:", updateError);
    return { success: false, error: updateError.message };
  }

  revalidatePath("/dashboard/collections");
  revalidatePath(`/dashboard/collections/${id}`);
  revalidatePath(`/collections/${current.public_id}`);

  return { success: true, data: { newVersion: input.expectedVersion + 1 } };
}

/**
 * Deletes an owned collection after explicit confirmation.
 * Cascades to collection_items, never touches prompts or bookmarks.
 */
export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: current } = await supabase
    .from("collections")
    .select("public_id, user_id")
    .eq("id", id)
    .single();

  if (!current || current.user_id !== user.id) {
    return { success: false, error: "Collection not found or unauthorized." };
  }

  const { error: deleteError } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting collection:", deleteError);
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/dashboard/collections");
  revalidatePath(`/collections/${current.public_id}`);

  return { success: true };
}

/**
 * Adds a published prompt to an owned collection.
 * Idempotent: returns success if already present.
 * Rejects missing or unpublished prompts.
 */
export async function addPromptToCollectionAction(
  collectionId: string,
  promptId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  // 1. Verify user owns collection
  const { data: collection, error: colError } = await supabase
    .from("collections")
    .select("id, user_id, public_id")
    .eq("id", collectionId)
    .single();

  if (colError || !collection || collection.user_id !== user.id) {
    return { success: false, error: "Collection not found or access denied." };
  }

  // 2. Verify prompt exists and is currently published
  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("id, published")
    .eq("id", promptId)
    .single();

  if (promptError || !prompt || !prompt.published) {
    return { success: false, error: "Cannot add missing or unpublished prompts." };
  }

  // 3. Check if already present (idempotent)
  const { data: existing } = await supabase
    .from("collection_items")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (existing) {
    return { success: true };
  }

  // 4. Calculate next position
  const { data: lastItem } = await supabase
    .from("collection_items")
    .select("position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = lastItem ? lastItem.position + 1 : 0;

  const { error: insertError } = await supabase.from("collection_items").insert({
    collection_id: collectionId,
    prompt_id: promptId,
    position: nextPos,
  });

  if (insertError) {
    console.error("Error adding prompt to collection:", insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/dashboard/collections/${collectionId}`);
  revalidatePath(`/collections/${collection.public_id}`);

  return { success: true };
}

/**
 * Removes a prompt from an owned collection.
 * Idempotent: returns success even if prompt was not in collection.
 */
export async function removePromptFromCollectionAction(
  collectionId: string,
  promptId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("user_id, public_id")
    .eq("id", collectionId)
    .single();

  if (!collection || collection.user_id !== user.id) {
    return { success: false, error: "Collection not found or access denied." };
  }

  const { error: deleteError } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("prompt_id", promptId);

  if (deleteError) {
    console.error("Error removing prompt from collection:", deleteError);
    return { success: false, error: deleteError.message };
  }

  revalidatePath(`/dashboard/collections/${collectionId}`);
  revalidatePath(`/collections/${collection.public_id}`);

  return { success: true };
}

/**
 * Reorders collection items atomically with optimistic concurrency validation.
 */
export async function reorderCollectionItemsAction(
  collectionId: string,
  expectedVersion: number,
  itemIds: string[]
): Promise<ActionResult<{ newVersion: number }>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  // Execute database stored procedure for atomic transaction and concurrency verification
  const { data: newVersion, error: rpcError } = await supabase.rpc(
    "reorder_collection_items",
    {
      p_collection_id: collectionId,
      p_expected_version: expectedVersion,
      p_item_ids: itemIds,
    }
  );

  if (rpcError) {
    console.error("Reorder RPC error:", rpcError);
    const isConflict = rpcError.message.includes("CONFLICT");
    return {
      success: false,
      conflict: isConflict,
      error: isConflict
        ? "This collection was modified concurrently. Please refresh the page."
        : rpcError.message,
    };
  }

  revalidatePath(`/dashboard/collections/${collectionId}`);

  return { success: true, data: { newVersion: Number(newVersion) } };
}

/**
 * Returns owned collections with indicator of whether promptId is contained.
 */
export async function getUserCollectionsForPromptAction(promptId: string) {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getUserCollectionsWithPromptState(user.id, promptId);
}
