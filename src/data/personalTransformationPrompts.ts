// src/data/personalTransformationPrompts.ts
// 50 Personal Photo Transformation Prompts (Owner-Confirmed Midjourney Provenance)
// Distributed across 5 categories (10 posts each) with dual prompt variants

import { PromptItem } from "./prompts";
import dataset from "./personalTransformationPrompts.json";

export const PERSONAL_TRANSFORMATION_PROMPTS: PromptItem[] = dataset as unknown as PromptItem[];

export const PERSONAL_TRANSFORMATION_BY_KEY: Record<string, PromptItem> = dataset.reduce(
  (acc, item) => {
    acc[item.importKey] = item as unknown as PromptItem;
    return acc;
  },
  {} as Record<string, PromptItem>
);
