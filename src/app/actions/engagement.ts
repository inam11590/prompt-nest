"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { recordPromptView, recordPromptCopy } from "@/lib/data/engagement";
import { mapDatabaseRowToPromptItem, type PromptRow } from "@/lib/data/prompts";
import { STARTER_PROMPTS, type PromptItem } from "@/data/prompts";

export async function incrementPromptViewAction(
  promptId: string
): Promise<{ success: boolean; viewsCount?: number }> {
  try {
    return await recordPromptView(promptId);
  } catch (err) {
    console.error("incrementPromptViewAction error:", err);
    return { success: true };
  }
}

export async function incrementPromptCopyAction(
  promptId: string
): Promise<{ success: boolean; copiesCount?: number }> {
  try {
    return await recordPromptCopy(promptId);
  } catch (err) {
    console.error("incrementPromptCopyAction error:", err);
    return { success: true };
  }
}

export async function togglePromptLikeAction(
  promptId: string,
  currentState: boolean
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    // Guest or offline mode - return success so client optimistic state holds
    return { success: true, isLiked: !currentState };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Unauthenticated user - client handles guest local storage
    return { success: true, isLiked: !currentState };
  }

  try {
    if (currentState) {
      // Remove like
      const { error } = await supabase
        .from("prompt_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("prompt_id", promptId);

      if (error) {
        console.error("Error unliking prompt:", error);
        return { success: false, isLiked: true, error: error.message };
      }

      revalidatePath(`/prompts/${promptId}`);
      revalidatePath("/saved");
      revalidatePath("/trending");
      return { success: true, isLiked: false };
    } else {
      // Add like
      const { error } = await supabase
        .from("prompt_likes")
        .insert({
          user_id: user.id,
          prompt_id: promptId,
        });

      if (error) {
        // If unique constraint or already exists, still return isLiked = true
        if (error.code === "23505") {
          return { success: true, isLiked: true };
        }
        console.error("Error liking prompt:", error);
        return { success: false, isLiked: false, error: error.message };
      }

      revalidatePath(`/prompts/${promptId}`);
      revalidatePath("/saved");
      revalidatePath("/trending");
      return { success: true, isLiked: true };
    }
  } catch (err) {
    console.error("togglePromptLikeAction error:", err);
    return { success: false, isLiked: currentState, error: String(err) };
  }
}

export async function getUserLikedPromptsAction(): Promise<PromptItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("prompt_likes")
      .select("prompt_id, prompts(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const items: PromptItem[] = [];
    for (const row of data) {
      if (row.prompts) {
        items.push(mapDatabaseRowToPromptItem(row.prompts as unknown as PromptRow));
      } else {
        const starter = STARTER_PROMPTS.find((p) => p.id === row.prompt_id);
        if (starter) items.push(starter);
      }
    }

    return items;
  } catch (err) {
    console.error("getUserLikedPromptsAction error:", err);
    return [];
  }
}
