#!/usr/bin/env node

/**
 * scripts/import-cricket.mjs
 *
 * Repeatable, idempotent import and validation script for PromptNest Step 10
 * Cricket Prompt Collection (50 complete image-and-prompt posts).
 *
 * Usage:
 *   node scripts/import-cricket.mjs --dry-run
 *   node scripts/import-cricket.mjs --publish
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isDryRun = process.argv.includes("--dry-run");
const isPublish = process.argv.includes("--publish");

console.log("=================================================");
console.log("   PromptNest Step 10: Cricket Prompts Importer  ");
console.log("=================================================");
console.log(`Execution Mode: ${isDryRun ? "DRY-RUN (No database writes)" : isPublish ? "PUBLISH (Insert / Upsert with published status)" : "STANDARD (Insert / Upsert)"}`);

// 1. Load Dataset
const datasetPath = path.join(rootDir, "src", "data", "cricketPrompts.json");
if (!fs.existsSync(datasetPath)) {
  console.error(`[ERROR] Dataset not found at: ${datasetPath}`);
  process.exit(1);
}

let dataset;
try {
  dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
} catch (err) {
  console.error(`[ERROR] Failed to parse JSON dataset: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(dataset) || dataset.length !== 50) {
  console.error(`[ERROR] Dataset must contain exactly 50 records. Found: ${dataset?.length}`);
  process.exit(1);
}

// 2. Validate Prompt Contracts
const starBreakdown = {
  "Virat Kohli": 0,
  "Hardik Pandya": 0,
  "Babar Azam": 0,
  "Shoaib Akhtar": 0,
  "MS Dhoni": 0,
  "Cricket Lover": 0,
};

const slugs = new Set();
const contentKeys = new Set();
let validContractsCount = 0;
let pendingAssetsCount = 0;
let readyAssetsCount = 0;

for (let i = 0; i < dataset.length; i++) {
  const item = dataset[i];
  const { contentKey, slug, prompt, promptMatchExample, styleInspiration, assetStatus } = item;

  // Uniqueness
  if (!contentKey || contentKeys.has(contentKey)) {
    console.error(`[CONTRACT FAIL] Duplicate or missing contentKey at index ${i}: ${contentKey}`);
    process.exit(1);
  }
  contentKeys.add(contentKey);

  if (!slug || slugs.has(slug)) {
    console.error(`[CONTRACT FAIL] Duplicate or missing slug in ${contentKey}: ${slug}`);
    process.exit(1);
  }
  slugs.add(slug);

  // Star inspiration breakdown
  const insp = styleInspiration || "";
  if (insp.includes("Kohli")) starBreakdown["Virat Kohli"]++;
  else if (insp.includes("Pandya")) starBreakdown["Hardik Pandya"]++;
  else if (insp.includes("Babar")) starBreakdown["Babar Azam"]++;
  else if (insp.includes("Akhtar")) starBreakdown["Shoaib Akhtar"]++;
  else if (insp.includes("Dhoni")) starBreakdown["MS Dhoni"]++;
  else starBreakdown["Cricket Lover"]++;

  // Mode A Contract Validation
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 50) {
    console.error(`[CONTRACT FAIL] Incomplete Mode A prompt in ${contentKey}`);
    process.exit(1);
  }
  if (!prompt.includes("The uploaded personal photo is the sole facial identity reference")) {
    console.error(`[CONTRACT FAIL] Mode A missing sole facial identity reference clause in ${contentKey}`);
    process.exit(1);
  }
  if (!prompt.includes("Preserve the uploaded person's natural facial proportions")) {
    console.error(`[CONTRACT FAIL] Mode A missing natural facial proportions clause in ${contentKey}`);
    process.exit(1);
  }
  if (!prompt.includes("Do not reproduce the example cricketer's facial features")) {
    console.error(`[CONTRACT FAIL] Mode A missing negative celebrity facial reproduction clause in ${contentKey}`);
    process.exit(1);
  }

  // Mode B Contract Validation
  if (!promptMatchExample || typeof promptMatchExample !== "string" || promptMatchExample.trim().length < 50) {
    console.error(`[CONTRACT FAIL] Incomplete Mode B prompt in ${contentKey}`);
    process.exit(1);
  }
  if (!promptMatchExample.includes("Reference A is the user's uploaded personal photo (sole facial identity authority)")) {
    console.error(`[CONTRACT FAIL] Mode B missing Reference A authority clause in ${contentKey}`);
    process.exit(1);
  }
  if (!promptMatchExample.includes("Reference B is")) {
    console.error(`[CONTRACT FAIL] Mode B missing Reference B clause in ${contentKey}`);
    process.exit(1);
  }

  // Negative celebrity swap check
  if (prompt.toLowerCase().includes("replace your face with") || promptMatchExample.toLowerCase().includes("replace your face with")) {
    console.error(`[CONTRACT FAIL] Negative constraint breached (face substitution instruction) in ${contentKey}`);
    process.exit(1);
  }

  // Asset status check
  if (assetStatus === "DRAFT_PENDING_ASSET") {
    pendingAssetsCount++;
  } else {
    readyAssetsCount++;
  }

  validContractsCount++;
}

// Ensure exact distribution: 5 each for 5 named stars, 25 cricket lover
if (
  starBreakdown["Virat Kohli"] !== 5 ||
  starBreakdown["Hardik Pandya"] !== 5 ||
  starBreakdown["Babar Azam"] !== 5 ||
  starBreakdown["Shoaib Akhtar"] !== 5 ||
  starBreakdown["MS Dhoni"] !== 5 ||
  starBreakdown["Cricket Lover"] !== 25
) {
  console.error("[CONTRACT FAIL] Invalid star breakdown distribution:", starBreakdown);
  process.exit(1);
}

console.log("-------------------------------------------------");
console.log("Validation Summary:");
console.log(`- Total Posts in Dataset: ${dataset.length}`);
console.log(`- Valid Prompt Contracts: ${validContractsCount} / 50 (100%)`);
console.log(`- Ready Image Assets:     ${readyAssetsCount}`);
console.log(`- Pending Custom Media:   ${pendingAssetsCount}`);
console.log("Star Breakdown:");
console.log(`  * Virat Kohli:          ${starBreakdown["Virat Kohli"]} posts`);
console.log(`  * Hardik Pandya:        ${starBreakdown["Hardik Pandya"]} posts`);
console.log(`  * Babar Azam:           ${starBreakdown["Babar Azam"]} posts`);
console.log(`  * Shoaib Akhtar:        ${starBreakdown["Shoaib Akhtar"]} posts`);
console.log(`  * MS Dhoni:             ${starBreakdown["MS Dhoni"]} posts`);
console.log(`  * Cricket Lovers:       ${starBreakdown["Cricket Lover"]} posts`);
console.log("-------------------------------------------------");

// 3. Database Execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (isDryRun || !supabaseUrl || !serviceRoleKey) {
  if (isDryRun) {
    console.log("[DRY-RUN] Pre-flight contract validation passed. Zero database writes performed.");
  } else {
    console.log("[INFO] Supabase credentials not found in current environment. Validated all 50 contracts with zero remote database writes.");
    console.log("To persist to remote Supabase, set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and re-run with --publish.");
  }
  process.exit(0);
}

// Remote DB Upsert
async function executeRemoteUpsert() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  let insertedCount = 0;

  for (const item of dataset) {
    const isPublished = isPublish || item.status === "published";
    const row = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      short_description: item.shortDescription,
      prompt: item.prompt,
      prompt_match_example: item.promptMatchExample,
      style_inspiration: item.styleInspiration,
      is_cricket_identity: item.isCricketIdentity !== false,
      category: "cricket",
      model: item.model,
      compatible_models: item.compatibleModels || [],
      tags: item.tags || [],
      image_url: item.imageUrl,
      image_alt: item.imageAlt,
      width: item.width || 900,
      height: item.height || 1200,
      aspect_ratio: item.aspectRatio || "portrait",
      aspect_ratio_value: item.aspectRatioValue || "3/4",
      dominant_color: item.dominantColor || "#0f172a",
      negative_prompt: item.negativePrompt || null,
      generation_parameters: item.generationParameters || null,
      source_attribution: item.sourceAttribution || {
        source: "PromptNest Cricket Collection",
        author: "PromptNest Studio",
        authorUrl: "https://prompt-nest-pi.vercel.app/",
        license: "Custom Prompt License",
      },
      image_provenance: item.imageProvenance || null,
      published: isPublished,
      status: isPublished ? "published" : "draft",
      published_at: item.publishedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("prompts")
      .upsert(row, { onConflict: "slug" });

    if (error) {
      console.error(`[DB ERROR] Failed to upsert ${item.slug}:`, error.message);
      process.exit(1);
    }
    insertedCount++;
  }

  console.log(`[SUCCESS] Remote upsert complete: ${insertedCount} prompts written.`);
}

executeRemoteUpsert().catch((err) => {
  console.error("[FATAL ERROR] Remote upsert failed:", err);
  process.exit(1);
});
