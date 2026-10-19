import type { PromptItem } from "@/data/prompts";

export interface PromptEngagementMetrics {
  views: number;
  copies: number;
  likes: number;
  saves: number;
  isLiked: boolean;
  isSaved: boolean;
}

/**
 * Calculates a prompt's weighted trending score according to the formula:
 * score = (copies * 3) + (likes * 4) + (saves * 5) + (views * 0.1)
 */
export function calculateTrendingScore(metrics: {
  views: number;
  copies: number;
  likes: number;
  saves: number;
}): number {
  return (
    metrics.copies * 3 +
    metrics.likes * 4 +
    metrics.saves * 5 +
    metrics.views * 0.1
  );
}

/**
 * Deterministic fallback engagement metrics for prompts when live DB row is unavailable
 */
export function getFallbackEngagement(prompt: PromptItem): {
  views: number;
  copies: number;
  likes: number;
  saves: number;
} {
  if (
    typeof prompt.viewsCount === "number" &&
    typeof prompt.copiesCount === "number" &&
    typeof prompt.likesCount === "number" &&
    typeof prompt.savesCount === "number"
  ) {
    return {
      views: prompt.viewsCount,
      copies: prompt.copiesCount,
      likes: prompt.likesCount,
      saves: prompt.savesCount,
    };
  }

  // Consistent deterministic hashing
  const hash = prompt.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const views = Math.floor((((hash * 13) % 40) + 12) * 100);
  const likes = ((hash * 7) % 160) + 24;
  const copies = ((hash * 5) % 85) + 18;
  const saves = Math.floor(likes * 0.65);

  return { views, copies, likes, saves };
}
