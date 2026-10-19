import { createClient, createPublicClient } from "@/lib/supabase/server";
import { STARTER_PROMPTS } from "@/data/prompts";
import {
  calculateTrendingScore,
  getFallbackEngagement,
  type PromptEngagementMetrics,
} from "./engagement-scoring";

export { calculateTrendingScore, getFallbackEngagement, type PromptEngagementMetrics };

/**
 * Fetches full engagement metrics for a given prompt, including whether the authenticated
 * user has liked or saved it.
 */
export async function getPromptEngagement(
  promptId: string,
  userId?: string
): Promise<PromptEngagementMetrics> {
  const starter = STARTER_PROMPTS.find((p) => p.id === promptId || p.slug === promptId);
  const fallback = starter
    ? getFallbackEngagement(starter)
    : { views: 120, copies: 14, likes: 9, saves: 5 };

  const supabase = createPublicClient();
  if (!supabase) {
    return {
      ...fallback,
      isLiked: false,
      isSaved: false,
    };
  }

  try {
    const { data: promptRow } = await supabase
      .from("prompts")
      .select("views_count, copies_count, likes_count, saves_count")
      .eq("id", promptId)
      .maybeSingle();

    const views = (promptRow as Record<string, unknown>)?.views_count as number ?? fallback.views;
    const copies = (promptRow as Record<string, unknown>)?.copies_count as number ?? fallback.copies;
    const likes = (promptRow as Record<string, unknown>)?.likes_count as number ?? fallback.likes;
    const saves = (promptRow as Record<string, unknown>)?.saves_count as number ?? fallback.saves;

    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const [{ data: likeRow }, { data: saveRow }] = await Promise.all([
        supabase
          .from("prompt_likes")
          .select("prompt_id")
          .eq("prompt_id", promptId)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("bookmarks")
          .select("prompt_id")
          .eq("prompt_id", promptId)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      isLiked = !!likeRow;
      isSaved = !!saveRow;
    }

    return {
      views,
      copies,
      likes,
      saves,
      isLiked,
      isSaved,
    };
  } catch {
    return {
      ...fallback,
      isLiked: false,
      isSaved: false,
    };
  }
}

/**
 * Atomically increments prompt view counter via Supabase RPC or graceful fallback
 */
export async function recordPromptView(
  promptId: string
): Promise<{ success: boolean; viewsCount?: number }> {
  const supabase = await createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("increment_prompt_view", {
        p_prompt_id: promptId,
      });
      if (!error && typeof data === "number") {
        return { success: true, viewsCount: data };
      }
    } catch {
      // Fallback
    }
  }
  return { success: true };
}

/**
 * Atomically increments prompt copy counter via Supabase RPC or graceful fallback
 */
export async function recordPromptCopy(
  promptId: string
): Promise<{ success: boolean; copiesCount?: number }> {
  const supabase = await createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("increment_prompt_copy", {
        p_prompt_id: promptId,
      });
      if (!error && typeof data === "number") {
        return { success: true, copiesCount: data };
      }
    } catch {
      // Fallback
    }
  }
  return { success: true };
}
