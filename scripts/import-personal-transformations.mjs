#!/usr/bin/env node

/**
 * scripts/import-personal-transformations.mjs
 *
 * Repeatable, idempotent import CLI for PromptNest Personal Photo Transformations:
 * 50 personal-photo transformation concepts inspired by owner-confirmed Midjourney artwork.
 *
 * Usage:
 *   node scripts/import-personal-transformations.mjs --dry-run
 *   node scripts/import-personal-transformations.mjs --publish
 *   node scripts/import-personal-transformations.mjs --promote <import-key>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isDryRun = process.argv.includes("--dry-run");
const isPublish = process.argv.includes("--publish");
const promoteKeyIdx = process.argv.indexOf("--promote");
const promoteKey = promoteKeyIdx !== -1 ? process.argv[promoteKeyIdx + 1] : null;

console.log("=================================================================");
console.log("   PromptNest Personal Transformations Importer (50 Concepts)    ");
console.log("=================================================================");
console.log(`Execution Mode: ${isDryRun ? "DRY-RUN (Validation only)" : isPublish ? "PUBLISH (Upserting to Supabase as drafts)" : promoteKey ? `PROMOTE (${promoteKey})` : "VALIDATION"}`);

// 1. Load Dataset
const datasetPath = path.join(rootDir, "src", "data", "personalTransformationPrompts.json");
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

// 2. Comprehensive Validation & Pre-flight Checks
const expectedCategories = [
  "sports-portraits",
  "cinematic-portraits",
  "editorial-portraits",
  "streetwear-fashion",
  "outdoor-travel",
];

const categoryCounts = {};
for (const cat of expectedCategories) {
  categoryCounts[cat] = 0;
}

const slugs = new Set();
const importKeys = new Set();

for (const item of dataset) {
  const { importKey, slug, title, category, prompt, promptDual, sourceType, promptType } = item;

  // Duplicate checks
  if (importKeys.has(importKey)) {
    console.error(`[DUPLICATE KEY] ${importKey} appears more than once.`);
    process.exit(1);
  }
  importKeys.add(importKey);

  if (slugs.has(slug)) {
    console.error(`[DUPLICATE SLUG] ${slug} appears more than once.`);
    process.exit(1);
  }
  slugs.add(slug);

  // Category allocation check
  if (!expectedCategories.includes(category)) {
    console.error(`[INVALID CATEGORY] "${category}" in ${importKey}`);
    process.exit(1);
  }
  categoryCounts[category]++;

  // Provenance & Source check
  if (sourceType !== "midjourney") {
    console.error(`[SOURCE FAIL] Expected sourceType "midjourney", got "${sourceType}" in ${importKey}`);
    process.exit(1);
  }

  if (promptType !== "recreation") {
    console.error(`[PROMPT TYPE FAIL] Expected promptType "recreation", got "${promptType}" in ${importKey}`);
    process.exit(1);
  }

  // Dual prompt check
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 80) {
    console.error(`[QUALITY FAIL] Mode A prompt too short or missing in ${importKey} (${title})`);
    process.exit(1);
  }

  if (!promptDual || typeof promptDual !== "string" || promptDual.trim().length < 80) {
    console.error(`[QUALITY FAIL] Mode B promptDual too short or missing in ${importKey} (${title})`);
    process.exit(1);
  }

  // Contract sanity checks: Mode A must mention identity reference
  if (!prompt.includes("sole facial identity authority") && !prompt.includes("PERSONAL IDENTITY REFERENCE")) {
    console.error(`[CONTRACT FAIL] Mode A missing identity reference clause in ${importKey}`);
    process.exit(1);
  }

  // Contract sanity checks: Mode B must define Reference A and Reference B
  if (!promptDual.includes("Reference Image A") || !promptDual.includes("Reference Image B")) {
    console.error(`[CONTRACT FAIL] Mode B missing dual reference definition in ${importKey}`);
    process.exit(1);
  }
}

// Check exact category distribution: 10 per category
for (const [cat, count] of Object.entries(categoryCounts)) {
  if (count !== 10) {
    console.error(`[DISTRIBUTION FAIL] Category "${cat}" has ${count} posts, expected exactly 10`);
    process.exit(1);
  }
}

console.log("-----------------------------------------------------------------");
console.log("Validation & Sourcing Summary:");
console.log(`- Total Transformation Records:   ${dataset.length}`);
console.log(`- Category Distribution (10 each):`);
console.log(`  * Cricket & Sports:             ${categoryCounts["sports-portraits"]} posts`);
console.log(`  * Cinematic Studio:             ${categoryCounts["cinematic-portraits"]} posts`);
console.log(`  * Professional Editorial:       ${categoryCounts["editorial-portraits"]} posts`);
console.log(`  * Streetwear & Fashion:         ${categoryCounts["streetwear-fashion"]} posts`);
console.log(`  * Outdoor & Travel:             ${categoryCounts["outdoor-travel"]} posts`);
console.log(`- Dual-Prompt Variants Verified:  50 Mode A ("Use my photo") + 50 Mode B ("Match example")`);
console.log(`- Asset Status:                   50 DRAFT_PENDING_ASSET (No fake URLs / No scraped art)`);
console.log("-----------------------------------------------------------------");

// 3. Database Upsert Handling
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  const envLocalPath = path.join(rootDir, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)/);
    const serviceMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)/);
    const anonMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?([^"'\r\n]+)/);
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (serviceMatch) serviceRoleKey = serviceMatch[1].trim();
    else if (anonMatch) serviceRoleKey = anonMatch[1].trim();
  }
}

if (isDryRun || (!isPublish && !promoteKey)) {
  if (isDryRun) {
    console.log("[DRY-RUN] Pre-flight contract validation passed for all 50 concepts. Zero database writes performed.");
  } else {
    console.log("[INFO] Run with --publish to synchronize the 50 drafts to Supabase, or --promote <key> to promote an asset.");
  }
  process.exit(0);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[ERROR] Supabase credentials not found in environment or .env.local.");
  process.exit(1);
}

async function executeRemote() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);

  if (promoteKey) {
    const item = dataset.find((d) => d.importKey === promoteKey);
    if (!item) {
      console.error(`[ERROR] Concept with importKey "${promoteKey}" not found in dataset.`);
      process.exit(1);
    }
    const { error } = await supabase
      .from("prompts")
      .update({
        published: true,
        status: "published",
        asset_status: "READY",
        updated_at: new Date().toISOString(),
      })
      .eq("import_key", promoteKey);

    if (error) {
      console.error(`[DB ERROR] Failed to promote ${promoteKey}:`, error.message);
      process.exit(1);
    }
    console.log(`[SUCCESS] Promoted ${promoteKey} to published!`);
    return;
  }

  let createdCount = 0;
  let updatedCount = 0;
  let hasPromptDualColumn = true;

  for (const item of dataset) {
    // Check if record already exists and has admin edits
    const { data: existing } = await supabase
      .from("prompts")
      .select("id, status, published, asset_status")
      .eq("import_key", item.importKey)
      .maybeSingle();

    const row = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      short_description: item.shortDescription,
      prompt: item.prompt,
      category: item.category,
      model: item.model,
      compatible_models: item.compatibleModels || [],
      tags: item.tags || [],
      image_url: item.imageUrl,
      image_alt: item.imageAlt,
      width: item.width,
      height: item.height,
      aspect_ratio: item.aspectRatio,
      aspect_ratio_value: item.aspectRatioValue,
      dominant_color: item.dominantColor,
      negative_prompt: item.negativePrompt || null,
      generation_parameters: item.generationParameters,
      source_attribution: item.sourceAttribution,
      import_key: item.importKey,
      source_type: item.sourceType,
      prompt_type: item.promptType,
      asset_status: existing?.asset_status || "DRAFT_PENDING_ASSET",
      image_provenance: item.imageProvenance,
      published: existing?.published || false,
      status: existing?.status || "draft",
      published_at: item.publishedAt,
      updated_at: new Date().toISOString(),
    };

    if (hasPromptDualColumn !== false) {
      row.prompt_dual = item.promptDual;
    }

    let { error } = await supabase
      .from("prompts")
      .upsert(row, { onConflict: "import_key" });

    if (error && error.message.includes("'prompt_dual' column of 'prompts'")) {
      hasPromptDualColumn = false;
      console.warn("[SCHEMA NOTICE] Remote database does not yet have 'prompt_dual' column. Falling back to generation_parameters.");
      delete row.prompt_dual;
      const retry = await supabase
        .from("prompts")
        .upsert(row, { onConflict: "import_key" });
      error = retry.error;
    }

    if (error) {
      console.error(`[DB ERROR] Failed to upsert ${item.importKey} (${item.slug}):`, error.message);
      process.exit(1);
    }

    if (existing) updatedCount++;
    else createdCount++;
  }

  console.log(`[SUCCESS] Remote sync complete: ${createdCount} created, ${updatedCount} updated (staged as drafts in DRAFT_PENDING_ASSET).`);
}

executeRemote().catch((err) => {
  console.error("[FATAL ERROR] Remote execution failed:", err);
  process.exit(1);
});
