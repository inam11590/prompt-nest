"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  validateAndProcessImage,
  generateStorageKey,
  uploadToStorage,
} from "@/lib/storage/image";
import type { AIModel, PromptCategory } from "@/data/prompts";
import type { Database, Json } from "@/types/database.types";

type PromptInsert = Database["public"]["Tables"]["prompts"]["Insert"];
type PromptUpdate = Database["public"]["Tables"]["prompts"]["Update"];

export const VALID_OCCASIONS = ["professional", "casual", "sports", "fashion", "cinematic"] as const;
export const VALID_SETTINGS = ["studio", "outdoor", "urban", "stadium", "indoor"] as const;
export const VALID_LIGHTINGS = ["natural", "soft_studio", "dramatic", "neon", "golden_hour"] as const;
export const VALID_FRAMINGS = ["close_up", "upper_body", "full_body"] as const;
export const VALID_WORKFLOWS = ["personal_photo_only", "personal_photo_plus_example"] as const;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sanitizes and generates a URL-safe slug from a title string.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * Server action to directly upload and process an image file.
 */
export async function uploadImageAction(formData: FormData): Promise<
  ActionResult<{
    imageUrl: string;
    width: number;
    height: number;
    aspectRatio: "portrait" | "landscape" | "square";
    aspectRatioValue: string;
    dominantColor: string;
  }>
> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No image file provided." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const processed = await validateAndProcessImage(buffer, {
      maxSizeBytes: 10 * 1024 * 1024,
      minDimension: 512,
      maxMegapixels: 40_000_000,
      maxEdge: 2560,
    });

    const objectKey = generateStorageKey(file.name.replace(/\.[^/.]+$/, ""));
    const { publicUrl } = await uploadToStorage(
      processed.buffer,
      objectKey,
      "prompt-images",
      processed.contentType
    );

    return {
      success: true,
      data: {
        imageUrl: publicUrl,
        width: processed.width,
        height: processed.height,
        aspectRatio: processed.aspectRatio,
        aspectRatioValue: processed.aspectRatioValue,
        dominantColor: processed.dominantColor,
      },
    };
  } catch (err) {
    console.error("uploadImageAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Image processing failed.",
    };
  }
}

/**
 * Creates a new prompt in the database with admin authorization and audit logging.
 */
export async function createPromptAction(formData: FormData): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: "Database client is not available." };
    }

    const title = (formData.get("title") as string)?.trim();
    let slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const shortDescription = (formData.get("shortDescription") as string)?.trim();
    const promptText = (formData.get("prompt") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() as PromptCategory;
    const model = (formData.get("model") as string)?.trim() as AIModel;
    const compatibleModelsRaw = formData.getAll("compatibleModels") as string[];
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const imageAlt = (formData.get("imageAlt") as string)?.trim() || title;
    const status = ((formData.get("status") as string)?.trim() || "draft") as "draft" | "published" | "archived";
    const negativePrompt = (formData.get("negativePrompt") as string)?.trim() || null;
    const generationParamsRaw = (formData.get("generationParameters") as string)?.trim();
    const sourceAttributionRaw = (formData.get("sourceAttribution") as string)?.trim();

    // Image data (from pre-uploaded result or direct inputs)
    let imageUrl = (formData.get("imageUrl") as string)?.trim();
    let width = parseInt((formData.get("width") as string) || "1200", 10);
    let height = parseInt((formData.get("height") as string) || "800", 10);
    let aspectRatio = ((formData.get("aspectRatio") as string) || "landscape") as "portrait" | "landscape" | "square";
    let aspectRatioValue = (formData.get("aspectRatioValue") as string) || "3/2";
    let dominantColor = (formData.get("dominantColor") as string) || "#18181c";

    // Handle direct file upload in form if provided
    const imageFile = formData.get("imageFile");
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const processed = await validateAndProcessImage(buffer);
      const objectKey = generateStorageKey(slug || slugify(title));
      const uploadRes = await uploadToStorage(processed.buffer, objectKey, "prompt-images", processed.contentType);
      imageUrl = uploadRes.publicUrl;
      width = processed.width;
      height = processed.height;
      aspectRatio = processed.aspectRatio;
      aspectRatioValue = processed.aspectRatioValue;
      dominantColor = processed.dominantColor;
    }

    // Required fields validation
    if (!title) return { success: false, error: "Title is required." };
    if (!shortDescription) return { success: false, error: "Short description is required." };
    if (!promptText) return { success: false, error: "Prompt text is required." };
    if (!category) return { success: false, error: "Category is required." };
    if (!model) return { success: false, error: "AI model is required." };
    if (!imageUrl) return { success: false, error: "Image is required." };

    // Format & validate slug
    if (!slug) {
      slug = slugify(title);
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { success: false, error: "Slug must contain only lowercase letters, numbers, and hyphens." };
    }

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("prompts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Parse taxonomy & metadata
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const compatibleModels = (compatibleModelsRaw.length > 0 ? compatibleModelsRaw : [model]) as AIModel[];

    const occasionRaw = (formData.get("occasion") as string)?.trim();
    const settingRaw = (formData.get("setting") as string)?.trim();
    const lightingRaw = (formData.get("lighting") as string)?.trim();
    const framingRaw = (formData.get("framing") as string)?.trim();
    const workflowRaw = (formData.get("workflow") as string)?.trim();
    const promptDual = (formData.get("promptDual") as string)?.trim() || null;

    const occasion = occasionRaw && (VALID_OCCASIONS as readonly string[]).includes(occasionRaw) ? occasionRaw : null;
    const setting = settingRaw && (VALID_SETTINGS as readonly string[]).includes(settingRaw) ? settingRaw : null;
    const lighting = lightingRaw && (VALID_LIGHTINGS as readonly string[]).includes(lightingRaw) ? lightingRaw : null;
    const framing = framingRaw && (VALID_FRAMINGS as readonly string[]).includes(framingRaw) ? framingRaw : null;
    const workflow = workflowRaw && (VALID_WORKFLOWS as readonly string[]).includes(workflowRaw) ? workflowRaw : null;

    let generationParameters: Record<string, unknown> = {};
    if (generationParamsRaw) {
      try {
        generationParameters = JSON.parse(generationParamsRaw);
      } catch {
        // Ignore invalid json or treat as text
      }
    }
    if (occasion) generationParameters.occasion = occasion;
    if (setting) generationParameters.setting = setting;
    if (lighting) generationParameters.lighting = lighting;
    if (framing) generationParameters.framing = framing;
    if (workflow) generationParameters.workflow = workflow;
    if (promptDual) generationParameters.prompt_dual = promptDual;

    let sourceAttribution = {
      source: "PromptNest Administrator",
      author: user.email || "Admin",
      authorUrl: "https://prompt-nest-pi.vercel.app",
      license: "PromptNest Curated License",
    };
    if (sourceAttributionRaw) {
      try {
        sourceAttribution = JSON.parse(sourceAttributionRaw);
      } catch {
        // Fallback default
      }
    }

    const promptId = `prompt-${Date.now()}`;
    const isPublished = status === "published";
    const nowIso = new Date().toISOString();

    const insertPayload: PromptInsert = {
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
      source_attribution: sourceAttribution as Json,
      status,
      published: isPublished,
      published_at: isPublished ? nowIso : nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      occasion,
      setting,
      lighting,
      framing,
      workflow,
      prompt_dual: promptDual,
    };

    let { error: insertError } = await supabase
      .from("prompts")
      .insert(insertPayload);

    if (insertError && insertError.message.includes("column")) {
      const fallbackPayload: PromptInsert = { ...insertPayload };
      delete fallbackPayload.occasion;
      delete fallbackPayload.setting;
      delete fallbackPayload.lighting;
      delete fallbackPayload.framing;
      delete fallbackPayload.workflow;
      delete fallbackPayload.prompt_dual;

      const fallbackRes = await supabase.from("prompts").insert(fallbackPayload);
      insertError = fallbackRes.error;
    }

    if (insertError) {
      console.error("createPromptAction insert error:", insertError);
      return { success: false, error: `Failed to create prompt: ${insertError.message}` };
    }

    // Audit log (sanitized, no passwords or large prompt bodies)
    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: user.id,
        prompt_id: promptId,
        action: "prompt.create",
        previous_state: null,
        new_state: {
          id: promptId,
          slug,
          title,
          status,
          category,
          model,
          occasion,
          setting,
          lighting,
          framing,
          workflow,
        },
        changed_fields: Object.keys(insertPayload).filter((k) => k !== "prompt"),
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/prompts");
    if (isPublished) {
      revalidatePath(`/prompts/${slug}`);
    }

    return {
      success: true,
      data: { id: promptId, slug },
    };
  } catch (err) {
    console.error("createPromptAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Updates an existing prompt with concurrency protection and slug immutability.
 */
export async function updatePromptAction(
  promptId: string,
  formData: FormData,
  expectedUpdatedAt?: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: "Database client is not available." };
    }

    // 1. Fetch current database state
    const { data: current, error: fetchError } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", promptId)
      .maybeSingle();

    if (fetchError || !current) {
      return { success: false, error: "Prompt not found." };
    }

    // 2. Concurrency check
    if (expectedUpdatedAt && current.updated_at !== expectedUpdatedAt) {
      return {
        success: false,
        error:
          "Concurrency Conflict: This prompt was updated by another administrator. Please refresh the page and review the changes before saving.",
      };
    }

    const title = (formData.get("title") as string)?.trim();
    const requestedSlug = (formData.get("slug") as string)?.trim().toLowerCase();
    const shortDescription = (formData.get("shortDescription") as string)?.trim();
    const promptText = (formData.get("prompt") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() as PromptCategory;
    const model = (formData.get("model") as string)?.trim() as AIModel;
    const compatibleModelsRaw = formData.getAll("compatibleModels") as string[];
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const imageAlt = (formData.get("imageAlt") as string)?.trim() || title;
    const status = ((formData.get("status") as string)?.trim() || current.status || "draft") as
      | "draft"
      | "published"
      | "archived";
    const negativePrompt = (formData.get("negativePrompt") as string)?.trim() || null;
    const generationParamsRaw = (formData.get("generationParameters") as string)?.trim();

    // 3. Slug immutability rule: Once published, the slug cannot be changed
    let finalSlug = current.slug;
    const wasPublished = current.published || current.status === "published";
    if (requestedSlug && requestedSlug !== current.slug) {
      if (wasPublished) {
        return {
          success: false,
          error:
            "Slug Immutability: This prompt has already been published. Changing the slug of a published prompt is prohibited to preserve live URLs, bookmarks, and search indexing.",
        };
      }
      if (!/^[a-z0-9-]+$/.test(requestedSlug)) {
        return {
          success: false,
          error: "Slug must contain only lowercase letters, numbers, and hyphens.",
        };
      }
      finalSlug = requestedSlug;
    }

    // Image details
    let imageUrl = (formData.get("imageUrl") as string)?.trim() || current.image_url;
    let width = parseInt((formData.get("width") as string) || String(current.width), 10);
    let height = parseInt((formData.get("height") as string) || String(current.height), 10);
    let aspectRatio = ((formData.get("aspectRatio") as string) || current.aspect_ratio) as
      | "portrait"
      | "landscape"
      | "square";
    let aspectRatioValue = (formData.get("aspectRatioValue") as string) || current.aspect_ratio_value;
    let dominantColor = (formData.get("dominantColor") as string) || current.dominant_color;

    // Handle uploaded file if present
    const imageFile = formData.get("imageFile");
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const processed = await validateAndProcessImage(buffer);
      const objectKey = generateStorageKey(finalSlug);
      const uploadRes = await uploadToStorage(processed.buffer, objectKey, "prompt-images", processed.contentType);
      imageUrl = uploadRes.publicUrl;
      width = processed.width;
      height = processed.height;
      aspectRatio = processed.aspectRatio;
      aspectRatioValue = processed.aspectRatioValue;
      dominantColor = processed.dominantColor;
    }

    if (!title) return { success: false, error: "Title is required." };
    if (!shortDescription) return { success: false, error: "Short description is required." };
    if (!promptText) return { success: false, error: "Prompt text is required." };

    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : current.tags;

    const compatibleModels = (compatibleModelsRaw.length > 0
      ? compatibleModelsRaw
      : current.compatible_models) as AIModel[];

    const occasionRaw = (formData.get("occasion") as string)?.trim();
    const settingRaw = (formData.get("setting") as string)?.trim();
    const lightingRaw = (formData.get("lighting") as string)?.trim();
    const framingRaw = (formData.get("framing") as string)?.trim();
    const workflowRaw = (formData.get("workflow") as string)?.trim();
    const promptDual = (formData.get("promptDual") as string)?.trim() || null;

    const occasion = occasionRaw && (VALID_OCCASIONS as readonly string[]).includes(occasionRaw)
      ? occasionRaw
      : occasionRaw === "unset" ? null : current.occasion || null;
    const setting = settingRaw && (VALID_SETTINGS as readonly string[]).includes(settingRaw)
      ? settingRaw
      : settingRaw === "unset" ? null : current.setting || null;
    const lighting = lightingRaw && (VALID_LIGHTINGS as readonly string[]).includes(lightingRaw)
      ? lightingRaw
      : lightingRaw === "unset" ? null : current.lighting || null;
    const framing = framingRaw && (VALID_FRAMINGS as readonly string[]).includes(framingRaw)
      ? framingRaw
      : framingRaw === "unset" ? null : current.framing || null;
    const workflow = workflowRaw && (VALID_WORKFLOWS as readonly string[]).includes(workflowRaw)
      ? workflowRaw
      : workflowRaw === "unset" ? null : current.workflow || null;

    let generationParameters: Record<string, unknown> =
      current.generation_parameters && typeof current.generation_parameters === "object" && !Array.isArray(current.generation_parameters)
        ? (current.generation_parameters as Record<string, unknown>)
        : {};
    if (generationParamsRaw) {
      try {
        generationParameters = JSON.parse(generationParamsRaw);
      } catch {
        // Keep existing if unparseable
      }
    }
    if (occasion) generationParameters.occasion = occasion;
    if (setting) generationParameters.setting = setting;
    if (lighting) generationParameters.lighting = lighting;
    if (framing) generationParameters.framing = framing;
    if (workflow) generationParameters.workflow = workflow;
    if (promptDual) generationParameters.prompt_dual = promptDual;

    const isPublished = status === "published";
    const nowIso = new Date().toISOString();

    const updatePayload: PromptUpdate = {
      title,
      slug: finalSlug,
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
      published_at: isPublished && !current.published ? nowIso : current.published_at,
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
      .update(updatePayload)
      .eq("id", promptId);

    if (updateError && updateError.message.includes("column")) {
      const fallbackPayload: PromptUpdate = { ...updatePayload };
      delete fallbackPayload.occasion;
      delete fallbackPayload.setting;
      delete fallbackPayload.lighting;
      delete fallbackPayload.framing;
      delete fallbackPayload.workflow;
      delete fallbackPayload.prompt_dual;

      const fallbackRes = await supabase.from("prompts").update(fallbackPayload).eq("id", promptId);
      updateError = fallbackRes.error;
    }

    if (updateError) {
      console.error("updatePromptAction error:", updateError);
      return { success: false, error: `Failed to update prompt: ${updateError.message}` };
    }

    // Determine changed fields for audit log
    const changedFields: string[] = [];
    for (const [key, val] of Object.entries(updatePayload)) {
      if (key !== "prompt" && key !== "updated_at") {
        const curVal = (current as Record<string, unknown>)[key];
        if (JSON.stringify(val) !== JSON.stringify(curVal)) {
          changedFields.push(key);
        }
      }
    }

    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: user.id,
        prompt_id: promptId,
        action: "prompt.update",
        previous_state: {
          id: promptId,
          slug: current.slug,
          title: current.title,
          status: current.status,
          occasion: current.occasion,
          setting: current.setting,
          lighting: current.lighting,
          framing: current.framing,
          workflow: current.workflow,
        },
        new_state: {
          id: promptId,
          slug: finalSlug,
          title,
          status,
          occasion,
          setting,
          lighting,
          framing,
          workflow,
        },
        changed_fields: changedFields,
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/prompts");
    revalidatePath(`/prompts/${finalSlug}`);
    if (current.slug !== finalSlug) {
      revalidatePath(`/prompts/${current.slug}`);
    }

    return {
      success: true,
      data: { id: promptId, slug: finalSlug },
    };
  } catch (err) {
    console.error("updatePromptAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Changes prompt publication status (publish, unpublish, archive, restore).
 */
export async function setPromptStatusAction(
  promptId: string,
  newStatus: "draft" | "published" | "archived"
): Promise<ActionResult> {
  try {
    const { user } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: "Database client is not available." };
    }

    const { data: current, error: fetchError } = await supabase
      .from("prompts")
      .select("id, slug, status, published, published_at")
      .eq("id", promptId)
      .maybeSingle();

    if (fetchError || !current) {
      return { success: false, error: "Prompt not found." };
    }

    const isPublished = newStatus === "published";
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("prompts")
      .update({
        status: newStatus,
        published: isPublished,
        published_at: isPublished && !current.published ? nowIso : current.published_at,
        updated_at: nowIso,
      })
      .eq("id", promptId);

    if (updateError) {
      return { success: false, error: `Failed to update status: ${updateError.message}` };
    }

    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: user.id,
        prompt_id: promptId,
        action: `prompt.status_${newStatus}`,
        previous_state: { status: current.status, published: current.published },
        new_state: { status: newStatus, published: isPublished },
        changed_fields: ["status", "published"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/prompts");
    revalidatePath(`/prompts/${current.slug}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to change prompt status.",
    };
  }
}
