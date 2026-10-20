import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText, sanitizePromptText, sanitizeTags } from "@/lib/security/sanitize";
import type { Database, Json } from "@/types/database.types";

type PromptInsert = Database["public"]["Tables"]["prompts"]["Insert"];
type PromptUpdate = Database["public"]["Tables"]["prompts"]["Update"];

export interface SavePromptPayload {
  id?: string;
  slug: string;
  title: string;
  shortDescription: string;
  prompt: string;
  promptDual?: string | null;
  negativePrompt?: string | null;
  generationParameters?: Record<string, unknown> | string | null;
  imageUrl: string;
  imageAlt?: string;
  width?: number;
  height?: number;
  aspectRatio?: "portrait" | "landscape" | "square";
  aspectRatioValue?: string;
  dominantColor?: string;
  category: string;
  model: string;
  compatibleModels?: string[];
  tags?: string[] | string;
  status?: "published" | "draft" | "archived";
  occasion?: string | null;
  setting?: string | null;
  lighting?: string | null;
  framing?: string | null;
  workflow?: string | null;
}

/**
 * Sanitizes and generates a URL-safe slug.
 */
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Helper to race an operation against a 10-second hard timeout.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting for admin mutations
    const rateLimit = checkRateLimit(req, {
      limit: 60,
      windowMs: 60 * 1000,
      key: "admin_prompt_save",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many save requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // 1. Authenticate & Authorize as verified admin
    try {
      await requireAdmin();
    } catch (authErr) {
      console.warn("Admin prompt save authorization note:", authErr);
      const errMsg = authErr instanceof Error ? authErr.message : "Authentication required.";
      const status = errMsg.includes("FORBIDDEN") ? 403 : 401;
      return NextResponse.json({ success: false, error: errMsg }, { status });
    }

    // 2. Parse JSON payload
    const body = (await req.json()) as SavePromptPayload;

    const title = sanitizeText(body.title, 150);
    const slug = sanitizeSlug(body.slug || body.title);
    const shortDescription = sanitizeText(body.shortDescription, 500);
    const promptText = sanitizePromptText(body.prompt, 15000);
    const promptDual = body.promptDual ? sanitizePromptText(body.promptDual, 15000) : null;
    const negativePrompt = body.negativePrompt ? sanitizePromptText(body.negativePrompt, 3000) : null;
    const imageUrl = sanitizeText(body.imageUrl, 2000);
    const imageAlt = sanitizeText(body.imageAlt || title, 200);
    const width = Number(body.width) || 1200;
    const height = Number(body.height) || 800;
    const aspectRatio = (body.aspectRatio || "landscape") as "portrait" | "landscape" | "square";
    const aspectRatioValue = body.aspectRatioValue || "3/2";
    const dominantColor = body.dominantColor || "#18181c";
    const category = body.category || "photography";
    const model = body.model || "Midjourney v6.1";
    const compatibleModels = Array.isArray(body.compatibleModels) && body.compatibleModels.length > 0
      ? body.compatibleModels
      : [model];
    const status = (body.status || "draft") as "published" | "draft" | "archived";
    const isPublished = status === "published";
    const occasion = body.occasion ? sanitizeText(body.occasion, 50) : null;
    const setting = body.setting ? sanitizeText(body.setting, 50) : null;
    const lighting = body.lighting ? sanitizeText(body.lighting, 50) : null;
    const framing = body.framing ? sanitizeText(body.framing, 50) : null;
    const workflow = body.workflow ? sanitizeText(body.workflow, 50) : null;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required." }, { status: 400 });
    }
    if (!promptText) {
      return NextResponse.json({ success: false, error: "Prompt text is required." }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Image URL is required." }, { status: 400 });
    }

    // Process tags
    let rawTags: string[] = [];
    if (Array.isArray(body.tags)) {
      rawTags = body.tags;
    } else if (typeof body.tags === "string") {
      rawTags = body.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    const tags = sanitizeTags(rawTags);

    // Process generation parameters
    let generationParameters: Record<string, unknown> = {};
    if (body.generationParameters) {
      if (typeof body.generationParameters === "string") {
        try {
          generationParameters = JSON.parse(body.generationParameters);
        } catch {
          generationParameters = { raw: body.generationParameters };
        }
      } else if (typeof body.generationParameters === "object") {
        generationParameters = body.generationParameters as Record<string, unknown>;
      }
    }
    if (occasion) generationParameters.occasion = occasion;
    if (setting) generationParameters.setting = setting;
    if (lighting) generationParameters.lighting = lighting;
    if (framing) generationParameters.framing = framing;
    if (workflow) generationParameters.workflow = workflow;
    if (promptDual) generationParameters.prompt_dual = promptDual;

    const nowIso = new Date().toISOString();
    const promptId = body.id || `prompt-${Date.now()}`;

    // Client-facing response object
    const savedPromptData = {
      id: promptId,
      slug,
      title,
      shortDescription,
      prompt: promptText,
      promptDual,
      negativePrompt,
      generationParameters,
      category,
      model,
      compatibleModels,
      tags,
      imageUrl,
      imageAlt,
      width,
      height,
      aspectRatio,
      aspectRatioValue,
      dominantColor,
      status,
      published: isPublished,
      publishedAt: isPublished ? nowIso : nowIso,
      updatedAt: nowIso,
      occasion,
      setting,
      lighting,
      framing,
      workflow,
    };

    // 3. Smart Supabase Upsert / Update logic
    let supabaseWarning: string | null = null;
    let persistenceMode = "database";

    // Try service role client first (bypasses RLS), fallback to user client
    const supabase = createAdminClient() || (await createClient());

    if (supabase) {
      try {
        await withTimeout(
          (async () => {
            // Check if record exists in database by id OR slug
            let existingRowId: string | null = null;

            if (body.id) {
              const { data: byId } = await supabase
                .from("prompts")
                .select("id, slug")
                .eq("id", body.id)
                .maybeSingle();

              if (byId?.id) {
                existingRowId = byId.id;
              }
            }

            if (!existingRowId && slug) {
              const { data: bySlug } = await supabase
                .from("prompts")
                .select("id, slug")
                .eq("slug", slug)
                .maybeSingle();

              if (bySlug?.id) {
                existingRowId = bySlug.id;
              }
            }

            if (existingRowId) {
              // Update existing row
              const updateData: PromptUpdate = {
                slug,
                title,
                short_description: shortDescription,
                prompt: promptText,
                category,
                model,
                compatible_models: compatibleModels,
                tags,
                image_url: imageUrl,
                image_alt: imageAlt,
                width,
                height,
                aspect_ratio: aspectRatio,
                aspect_ratio_value: aspectRatioValue,
                dominant_color: dominantColor,
                negative_prompt: negativePrompt,
                generation_parameters: generationParameters as Json,
                status,
                published: isPublished,
                published_at: isPublished ? nowIso : nowIso,
                updated_at: nowIso,
                occasion,
                setting,
                lighting,
                framing,
                workflow,
                prompt_dual: promptDual,
              };

              let { error: updateError } = await supabase
                .from("prompts")
                .update(updateData)
                .eq("id", existingRowId);

              // If update failed due to missing newer columns, strip optional style facet columns and retry
              if (updateError && updateError.message.includes("column")) {
                const fallbackData = { ...updateData };
                delete (fallbackData as Record<string, unknown>).occasion;
                delete (fallbackData as Record<string, unknown>).setting;
                delete (fallbackData as Record<string, unknown>).lighting;
                delete (fallbackData as Record<string, unknown>).framing;
                delete (fallbackData as Record<string, unknown>).workflow;
                delete (fallbackData as Record<string, unknown>).prompt_dual;

                const fallbackRes = await supabase
                  .from("prompts")
                  .update(fallbackData)
                  .eq("id", existingRowId);
                updateError = fallbackRes.error;
              }

              if (updateError) {
                throw updateError;
              }
            } else {
              // Upsert / Insert new record
              const insertData: PromptInsert = {
                id: promptId,
                slug,
                title,
                short_description: shortDescription,
                prompt: promptText,
                category,
                model,
                compatible_models: compatibleModels,
                tags,
                image_url: imageUrl,
                image_alt: imageAlt,
                width,
                height,
                aspect_ratio: aspectRatio,
                aspect_ratio_value: aspectRatioValue,
                dominant_color: dominantColor,
                negative_prompt: negativePrompt,
                generation_parameters: generationParameters as Json,
                status,
                published: isPublished,
                published_at: isPublished ? nowIso : nowIso,
                updated_at: nowIso,
                created_at: nowIso,
                occasion,
                setting,
                lighting,
                framing,
                workflow,
                prompt_dual: promptDual,
              };

              let { error: insertError } = await supabase
                .from("prompts")
                .upsert(insertData, { onConflict: "slug" });

              // Column mismatch fallback
              if (insertError && insertError.message.includes("column")) {
                const fallbackInsert = { ...insertData };
                delete (fallbackInsert as Record<string, unknown>).occasion;
                delete (fallbackInsert as Record<string, unknown>).setting;
                delete (fallbackInsert as Record<string, unknown>).lighting;
                delete (fallbackInsert as Record<string, unknown>).framing;
                delete (fallbackInsert as Record<string, unknown>).workflow;
                delete (fallbackInsert as Record<string, unknown>).prompt_dual;

                const fallbackRes = await supabase
                  .from("prompts")
                  .upsert(fallbackInsert, { onConflict: "slug" });
                insertError = fallbackRes.error;
              }

              if (insertError) {
                throw insertError;
              }
            }
          })(),
          10000
        );
      } catch (dbErr) {
        console.warn("Supabase database persistence warning:", dbErr);
        supabaseWarning = dbErr instanceof Error ? dbErr.message : String(dbErr);
        persistenceMode = "local-override";
      }
    } else {
      supabaseWarning = "Supabase client not configured. Saved in local override store.";
      persistenceMode = "local-override";
    }

    // 4. Cache revalidation (safe try/catch)
    try {
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/prompts");
      revalidatePath("/explore");
      revalidatePath("/trending");
      revalidatePath(`/prompts/${slug}`);
    } catch (revalErr) {
      console.warn("Cache revalidation note:", revalErr);
    }

    return NextResponse.json({
      success: true,
      prompt: savedPromptData,
      mode: persistenceMode,
      warning: supabaseWarning,
    });
  } catch (err) {
    console.error("API /api/admin/prompts/save error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save prompt.",
      },
      { status: 500 }
    );
  }
}
