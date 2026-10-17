"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface BookmarkActionResult {
  success: boolean;
  isBookmarked: boolean;
  error?: string;
}

/**
 * Toggles a bookmark for the current authenticated user on a prompt.
 * Strictly derives the user_id from verified session (never client input).
 * Ensures idempotency and safe error rollback.
 */
export async function toggleBookmark(promptId: string): Promise<BookmarkActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      success: false,
      isBookmarked: false,
      error: "Supabase connection is not configured.",
    };
  }

  // 1. Verify user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      isBookmarked: false,
      error: "Authentication required to bookmark prompts.",
    };
  }

  // 2. Check if already bookmarked
  const { data: existing, error: fetchError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error checking bookmark status:", fetchError);
    return {
      success: false,
      isBookmarked: false,
      error: "Failed to read bookmark state.",
    };
  }

  if (existing) {
    // 3. Remove bookmark (Unsave)
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("prompt_id", promptId);

    if (deleteError) {
      console.error("Error removing bookmark:", deleteError);
      return {
        success: false,
        isBookmarked: true,
        error: "Failed to remove bookmark.",
      };
    }

    revalidatePath("/saved");
    revalidatePath(`/prompts`);
    return {
      success: true,
      isBookmarked: false,
    };
  } else {
    // 4. Create bookmark (Save) - restricted by RLS to published prompts
    const { error: insertError } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      prompt_id: promptId,
    });

    if (insertError) {
      console.error("Error creating bookmark:", insertError);
      return {
        success: false,
        isBookmarked: false,
        error: "Failed to save bookmark. Please try again.",
      };
    }

    revalidatePath("/saved");
    revalidatePath(`/prompts`);
    return {
      success: true,
      isBookmarked: true,
    };
  }
}

/**
 * Returns a Set of prompt IDs bookmarked by the currently authenticated user.
 */
export async function getUserBookmarkedPromptIds(): Promise<string[]> {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("prompt_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("getUserBookmarkedPromptIds error:", error);
    return [];
  }

  return (data || []).map((row) => row.prompt_id);
}
