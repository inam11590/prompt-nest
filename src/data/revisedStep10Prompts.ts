import type { PromptItem } from "@/data/prompts";
import rawData from "./revisedStep10Prompts.json";

export interface RevisedStep10PromptItem extends PromptItem {
  importKey: string;
  sourceType: "midjourney" | "unsplash";
  promptType: "original" | "recreation";
  assetStatus: "READY" | "DRAFT_PENDING_ASSET";
}

/**
 * REVISED STEP 10 DATASET — EXACTLY 50 PLANNED POSTS
 * Sourced under compliance guidelines:
 * - 25 Unsplash photographs (published, assets ready, photographer attribution, Unsplash Free License)
 * - 25 Midjourney images (staged in Missing-Asset Manifest awaiting owner file supply)
 *
 * Content distribution:
 * - Portraits: 10 (5 Unsplash, 5 Midjourney)
 * - Nature and landscapes: 10 (5 Unsplash, 5 Midjourney)
 * - Architecture and interiors: 10 (5 Unsplash, 5 Midjourney)
 * - Food and product photography: 10 (5 Unsplash, 5 Midjourney)
 * - Fashion and cinematic scenes: 10 (5 Unsplash, 5 Midjourney)
 */
export const REVISED_STEP10_PROMPTS: RevisedStep10PromptItem[] = rawData as RevisedStep10PromptItem[];

/**
 * Returns the published subset of the revised Step 10 dataset (the 25 Unsplash photographs).
 */
export const PUBLISHED_STEP10_PROMPTS: RevisedStep10PromptItem[] = REVISED_STEP10_PROMPTS.filter(
  (item) => item.status === "published" && item.assetStatus === "READY"
);

/**
 * Returns the draft subset of the revised Step 10 dataset (the 25 Midjourney posts tracked in the manifest).
 */
export const DRAFT_STEP10_PROMPTS: RevisedStep10PromptItem[] = REVISED_STEP10_PROMPTS.filter(
  (item) => item.status === "draft" || item.assetStatus === "DRAFT_PENDING_ASSET"
);
