import type { PromptItem } from "@/data/prompts";
import cricketPromptsRaw from "./cricketPrompts.json";

export interface CricketPromptRecord extends PromptItem {
  contentKey: string;
  styleInspiration: string;
  promptMatchExample: string;
  isCricketIdentity: boolean;
  assetStatus: "READY" | "DRAFT_PENDING_ASSET";
}

/**
 * PRODUCTION CRICKET PROMPT DATASET — EXACTLY 50 COMPLETE POSTS
 * Covers:
 * - 5 Virat Kohli-inspired designs (cricket-01 to cricket-05)
 * - 5 Hardik Pandya-inspired designs (cricket-06 to cricket-10)
 * - 5 Babar Azam-inspired designs (cricket-11 to cricket-15)
 * - 5 Shoaib Akhtar-inspired designs (cricket-16 to cricket-20)
 * - 5 MS Dhoni-inspired designs (cricket-21 to cricket-25)
 * - 25 additional cricket-lover designs (cricket-26 to cricket-50)
 *
 * Each record implements both:
 * Mode A: "Use my photo" (Sole facial identity authority from user photo)
 * Mode B: "Match this example" (Dual-reference composition, Ref A=identity, Ref B=styling)
 */
export const CRICKET_PROMPTS_DATASET: CricketPromptRecord[] = cricketPromptsRaw as CricketPromptRecord[];
