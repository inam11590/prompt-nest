import type { PromptItem } from "@/data/prompts";
import rawData from "./personalTransformationPrompts.json";

export interface PersonalTransformationPromptItem extends PromptItem {
  importKey: string;
  sourceType: "midjourney";
  promptType: "recreation";
  assetStatus: "READY" | "DRAFT_PENDING_ASSET";
  promptDual: string;
}

export const PERSONAL_TRANSFORMATION_PROMPTS: PersonalTransformationPromptItem[] = rawData as PersonalTransformationPromptItem[];
