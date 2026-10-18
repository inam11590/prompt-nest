#!/usr/bin/env node

/**
 * scripts/classify-style-facets.mjs
 *
 * Controlled style metadata classifier and synchronizer for PromptNest:
 * - Occasion: professional, casual, sports, fashion, cinematic
 * - Setting: studio, outdoor, urban, stadium, indoor
 * - Lighting: natural, soft_studio, dramatic, neon, golden_hour
 * - Framing: close_up, upper_body, full_body
 * - Workflow: personal_photo_only, personal_photo_plus_example
 *
 * Usage:
 *   node scripts/classify-style-facets.mjs --dry-run
 *   node scripts/classify-style-facets.mjs --apply
 *   node scripts/classify-style-facets.mjs --sync-db
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isDryRun = process.argv.includes("--dry-run");
const isApply = process.argv.includes("--apply");
const isSyncDb = process.argv.includes("--sync-db");

// Load datasets
const revisedPath = path.join(rootDir, "src", "data", "revisedStep10Prompts.json");
const transformPath = path.join(rootDir, "src", "data", "personalTransformationPrompts.json");

const revisedData = JSON.parse(fs.readFileSync(revisedPath, "utf-8"));
const transformData = JSON.parse(fs.readFileSync(transformPath, "utf-8"));

/**
 * Infer facet values from prompt content, title, tags, and category.
 */
export function inferFacets(item) {
  const p = (item.prompt || "").toLowerCase();
  const title = (item.title || "").toLowerCase();
  const cat = item.category || "";
  const tags = (item.tags || []).map((t) => t.toLowerCase());

  let occasion = item.occasion || null;
  let setting = item.setting || null;
  let lighting = item.lighting || null;
  let framing = item.framing || null;
  let workflow = item.workflow || null;

  // 1. Workflow
  if (!workflow) {
    if (item.promptDual || (item.generationParameters && item.generationParameters.prompt_dual)) {
      workflow = "personal_photo_plus_example";
    } else {
      workflow = "personal_photo_only";
    }
  }

  // 2. Occasion: professional, casual, sports, fashion, cinematic
  if (!occasion) {
    if (
      cat === "sports-portraits" ||
      tags.includes("cricket") ||
      tags.includes("sports") ||
      tags.includes("athletic") ||
      p.includes("cricket") ||
      p.includes("batsman") ||
      p.includes("bowler") ||
      p.includes("fielder") ||
      p.includes("athlete") ||
      p.includes("athletic")
    ) {
      occasion = "sports";
    } else if (
      cat === "cinematic-portraits" ||
      tags.includes("cinematic") ||
      tags.includes("noir") ||
      tags.includes("film-noir") ||
      title.includes("noir") ||
      title.includes("cyberpunk") ||
      title.includes("cinematic") ||
      p.includes("film noir") ||
      p.includes("blade runner") ||
      p.includes("cyberpunk") ||
      p.includes("neo-noir") ||
      p.includes("cinematic still")
    ) {
      occasion = "cinematic";
    } else if (
      cat === "streetwear-fashion" ||
      cat === "fashion-cinematic" ||
      title.includes("couture") ||
      title.includes("runway") ||
      title.includes("streetwear") ||
      tags.includes("fashion") ||
      tags.includes("streetwear") ||
      tags.includes("couture") ||
      p.includes("couture") ||
      p.includes("runway") ||
      p.includes("organza") ||
      p.includes("streetwear") ||
      p.includes("high-fashion")
    ) {
      occasion = "fashion";
    } else if (
      cat === "editorial-portraits" ||
      title.includes("executive") ||
      title.includes("forbes") ||
      title.includes("architect") ||
      title.includes("director") ||
      title.includes("horologist") ||
      title.includes("chef") ||
      title.includes("cellist") ||
      title.includes("scientist") ||
      title.includes("monochrome male portrait") ||
      p.includes("executive") ||
      p.includes("corporate") ||
      p.includes("boardroom") ||
      p.includes("fine art ceramicist")
    ) {
      occasion = "professional";
    } else if (
      cat === "outdoor-travel" ||
      tags.includes("travel") ||
      tags.includes("lifestyle") ||
      tags.includes("candid") ||
      title.includes("freckled") ||
      title.includes("trek") ||
      title.includes("wanderer") ||
      title.includes("stroll") ||
      title.includes("walk") ||
      p.includes("travel") ||
      p.includes("casual") ||
      p.includes("freckles") ||
      p.includes("candid")
    ) {
      occasion = "casual";
    } else if (cat === "portraits") {
      occasion = "professional";
    }
  }

  // 3. Setting: studio, outdoor, urban, stadium, indoor
  if (!setting) {
    if (
      p.includes("stadium") ||
      p.includes("floodlight") ||
      tags.includes("stadium") ||
      title.includes("stadium") ||
      title.includes("t20 night match") ||
      title.includes("wicketkeeper") ||
      title.includes("boundary dive") ||
      title.includes("express pacer")
    ) {
      setting = "stadium";
    } else if (
      p.includes("studio") ||
      p.includes("backdrop") ||
      p.includes("cyclorama") ||
      p.includes("seamless paper") ||
      p.includes("seamless background") ||
      title.includes("studio") ||
      tags.includes("studio")
    ) {
      setting = "studio";
    } else if (
      p.includes("crosswalk") ||
      p.includes("shibuya") ||
      p.includes("street") ||
      p.includes("urban") ||
      p.includes("avenue") ||
      p.includes("tokyo") ||
      p.includes("harajuku") ||
      p.includes("parisian terrace") ||
      tags.includes("urban") ||
      tags.includes("street") ||
      title.includes("crosswalk") ||
      title.includes("street") ||
      title.includes("urban")
    ) {
      setting = "urban";
    } else if (
      p.includes("indoor") ||
      p.includes("dressing room") ||
      p.includes("boardroom") ||
      p.includes("kitchen") ||
      p.includes("loft") ||
      p.includes("workshop") ||
      p.includes("workbench") ||
      p.includes("stage") ||
      p.includes("conservatory") ||
      p.includes("warehouse") ||
      p.includes("riad") ||
      p.includes("courtyard") ||
      p.includes("interior") ||
      title.includes("dressing room") ||
      title.includes("net practice") ||
      title.includes("kitchen") ||
      title.includes("loft") ||
      title.includes("riad")
    ) {
      setting = "indoor";
    } else if (
      p.includes("beach") ||
      p.includes("desert") ||
      p.includes("glacier") ||
      p.includes("mountain") ||
      p.includes("forest") ||
      p.includes("highlands") ||
      p.includes("coastline") ||
      p.includes("cricket ground") ||
      p.includes("pavilion veranda") ||
      p.includes("bamboo grove") ||
      p.includes("arctic") ||
      p.includes("outdoor") ||
      p.includes("park") ||
      tags.includes("outdoor") ||
      tags.includes("nature")
    ) {
      setting = "outdoor";
    } else {
      setting = "outdoor";
    }
  }

  // 4. Lighting: natural, soft_studio, dramatic, neon, golden_hour
  if (!lighting) {
    if (
      p.includes("neon") ||
      p.includes("cyan and magenta") ||
      p.includes("cyberpunk") ||
      title.includes("neon") ||
      title.includes("cyberpunk")
    ) {
      lighting = "neon";
    } else if (
      p.includes("golden hour") ||
      p.includes("sunset") ||
      p.includes("sunrise") ||
      p.includes("warm sunlight") ||
      title.includes("golden hour") ||
      title.includes("sunset")
    ) {
      lighting = "golden_hour";
    } else if (
      p.includes("soft studio") ||
      p.includes("softbox") ||
      p.includes("octabox") ||
      p.includes("diffused studio") ||
      p.includes("high-key") ||
      title.includes("high-key")
    ) {
      lighting = "soft_studio";
    } else if (
      p.includes("chiaroscuro") ||
      p.includes("rembrandt") ||
      p.includes("venetian blind") ||
      p.includes("film noir") ||
      p.includes("dramatic rim") ||
      p.includes("high-contrast") ||
      p.includes("shadow pattern") ||
      title.includes("rembrandt") ||
      title.includes("shadow") ||
      title.includes("monochrome")
    ) {
      lighting = "dramatic";
    } else if (
      p.includes("overcast") ||
      p.includes("daylight") ||
      p.includes("sunlight") ||
      p.includes("natural light") ||
      p.includes("ambient daylight") ||
      p.includes("natural")
    ) {
      lighting = "natural";
    } else {
      lighting = "natural";
    }
  }

  // 5. Framing: close_up, upper_body, full_body
  if (!framing) {
    if (
      p.includes("close-up") ||
      p.includes("headshot") ||
      p.includes("facial details") ||
      p.includes("tight framing") ||
      title.includes("headshot") ||
      title.includes("close-up")
    ) {
      framing = "close_up";
    } else if (
      p.includes("full body") ||
      p.includes("full-length") ||
      p.includes("head to toe") ||
      p.includes("stride") ||
      p.includes("gown") ||
      p.includes("coat") ||
      p.includes("outfit") ||
      title.includes("stride") ||
      title.includes("dive") ||
      title.includes("gown") ||
      title.includes("coat") ||
      title.includes("trek")
    ) {
      framing = "full_body";
    } else {
      framing = "upper_body";
    }
  }

  return { occasion, setting, lighting, framing, workflow };
}

async function run() {
  console.log("=================================================================");
  console.log("     PromptNest Controlled Style Metadata Classifier             ");
  console.log("=================================================================");
  console.log(
    `Execution Mode: ${
      isDryRun
        ? "DRY-RUN (Inspection only)"
        : isApply
        ? "APPLY (Local datasets)"
        : isSyncDb
        ? "SYNC-DB (Supabase update)"
        : "REPORT"
    }`
  );

  let classifiedRevised = 0;
  let classifiedTransforms = 0;

  for (const item of revisedData) {
    if (item.category === "portraits" || item.category === "fashion-cinematic") {
      const facets = inferFacets(item);
      item.occasion = facets.occasion;
      item.setting = facets.setting;
      item.lighting = facets.lighting;
      item.framing = facets.framing;
      item.workflow = facets.workflow;
      if (!item.generationParameters) item.generationParameters = {};
      item.generationParameters.occasion = facets.occasion;
      item.generationParameters.setting = facets.setting;
      item.generationParameters.lighting = facets.lighting;
      item.generationParameters.framing = facets.framing;
      item.generationParameters.workflow = facets.workflow;
      classifiedRevised++;
    }
  }

  for (const item of transformData) {
    const facets = inferFacets(item);
    item.occasion = facets.occasion;
    item.setting = facets.setting;
    item.lighting = facets.lighting;
    item.framing = facets.framing;
    item.workflow = facets.workflow;
    if (!item.generationParameters) item.generationParameters = {};
    item.generationParameters.occasion = facets.occasion;
    item.generationParameters.setting = facets.setting;
    item.generationParameters.lighting = facets.lighting;
    item.generationParameters.framing = facets.framing;
    item.generationParameters.workflow = facets.workflow;
    classifiedTransforms++;
  }

  console.log(
    `Classified: ${classifiedRevised} revised portrait items, ${classifiedTransforms} personal transformation items.`
  );

  if (isDryRun || (!isApply && !isSyncDb)) {
    console.log("\nSample classification result (First 5 transformations):");
    for (const item of transformData.slice(0, 5)) {
      console.log(`- [${item.importKey}] ${item.title}`);
      console.log(
        `    Occasion: ${item.occasion} | Setting: ${item.setting} | Lighting: ${item.lighting} | Framing: ${item.framing} | Workflow: ${item.workflow}`
      );
    }
    console.log("\nSample classification result (Revised portrait sample):");
    for (const item of revisedData.filter((x) => x.occasion).slice(0, 3)) {
      console.log(`- [${item.importKey}] ${item.title}`);
      console.log(
        `    Occasion: ${item.occasion} | Setting: ${item.setting} | Lighting: ${item.lighting} | Framing: ${item.framing} | Workflow: ${item.workflow}`
      );
    }
    console.log("\n[DRY-RUN] Facet analysis complete. Zero files modified.");
    return;
  }

  if (isApply) {
    fs.writeFileSync(revisedPath, JSON.stringify(revisedData, null, 2) + "\n", "utf-8");
    fs.writeFileSync(transformPath, JSON.stringify(transformData, null, 2) + "\n", "utf-8");

    // Also regenerate TS module for personalTransformationPrompts
    const tsContent = `import type { PromptItem } from "@/data/prompts";
import rawData from "./personalTransformationPrompts.json";

export interface PersonalTransformationPromptItem extends PromptItem {
  importKey: string;
  sourceType: "midjourney";
  promptType: "recreation";
  assetStatus: "READY" | "DRAFT_PENDING_ASSET";
  promptDual: string;
}

export const PERSONAL_TRANSFORMATION_PROMPTS: PersonalTransformationPromptItem[] = rawData as PersonalTransformationPromptItem[];
`;
    fs.writeFileSync(path.join(rootDir, "src", "data", "personalTransformationPrompts.ts"), tsContent, "utf-8");
    console.log("[SUCCESS] Saved classified metadata to JSON and TS modules.");
  }

  if (isSyncDb) {
    const envLocalPath = path.join(rootDir, ".env.local");
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jugnobaqtnbvencfaumk.supabase.co";
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Z25vYmFxdG5idmVuY2ZhdW1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjIwNTM0NCwiZXhwIjoyMTA3NzgxMzQ0fQ.c4ZcFp6nJL4JfKGH8z9xpWTiiom2LFUm4Xzl8BYw3nY";

    if (fs.existsSync(envLocalPath)) {
      const envLines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
          supabaseUrl = trimmed.split("=")[1].replace(/["']/g, "");
        } else if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
          serviceRoleKey = trimmed.split("=")[1].replace(/["']/g, "");
        }
      }
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log(`Connecting to Supabase at: ${supabaseUrl}`);

    const allItems = [...revisedData.filter((x) => x.occasion), ...transformData];
    let synced = 0;
    let failed = 0;

    for (const item of allItems) {
      const updatePayload = {
        generation_parameters: {
          ...(item.generationParameters || {}),
          occasion: item.occasion,
          setting: item.setting,
          lighting: item.lighting,
          framing: item.framing,
          workflow: item.workflow,
        },
        updated_at: new Date().toISOString(),
      };

      // Try updating direct columns first
      let { error } = await supabase
        .from("prompts")
        .update({
          ...updatePayload,
          occasion: item.occasion,
          setting: item.setting,
          lighting: item.lighting,
          framing: item.framing,
          workflow: item.workflow,
        })
        .eq("import_key", item.importKey);

      if (error && error.message.includes("column")) {
        // Direct columns not in schema cache, fallback to generation_parameters
        const res = await supabase
          .from("prompts")
          .update(updatePayload)
          .eq("import_key", item.importKey);
        error = res.error;
      }

      if (error) {
        console.warn(`[WARN] Failed to sync facets for ${item.importKey}:`, error.message);
        failed++;
      } else {
        synced++;
      }
    }

    console.log(`[SUCCESS] Database sync completed. Synced facets for ${synced} items (failed/skipped: ${failed}).`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("classify-style-facets.mjs")) {
  run().catch((err) => {
    console.error("Classification error:", err);
    process.exit(1);
  });
}
