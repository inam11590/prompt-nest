import { createClient } from "@supabase/supabase-js";
import { STARTER_PROMPTS } from "../src/data/prompts";

async function runSeed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.");
    console.log("To seed your database, set these variables in .env.local and run again.");
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Upserting ${STARTER_PROMPTS.length} starter prompts...`);

  for (const p of STARTER_PROMPTS) {
    const row = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      short_description: p.shortDescription,
      prompt: p.prompt,
      category: p.category,
      model: p.model,
      compatible_models: p.compatibleModels || [],
      tags: p.tags || [],
      image_url: p.imageUrl,
      image_alt: p.imageAlt,
      width: p.width,
      height: p.height,
      aspect_ratio: p.aspectRatio,
      aspect_ratio_value: p.aspectRatioValue,
      dominant_color: p.dominantColor,
      negative_prompt: p.negativePrompt || null,
      generation_parameters: p.generationParameters || null,
      source_attribution: p.sourceAttribution,
      published: true,
      published_at: p.publishedAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("prompts")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error(`Failed to upsert prompt ${p.id} (${p.slug}):`, error.message);
    } else {
      console.log(`✓ Upserted ${p.id}: "${p.title}"`);
    }
  }

  console.log("Seeding process completed.");
}

runSeed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
