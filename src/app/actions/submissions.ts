"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndProcessImage,
  generateStorageKey,
} from "@/lib/storage/image";
import type { AIModel, PromptCategory } from "@/data/prompts";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const MAX_ACTIVE_SUBMISSIONS_QUOTA = 10;

/**
 * Uploads an image to the creator's private staging namespace: `${auth.uid()}/*`
 * Generates a short-lived signed URL for previewing.
 */
export async function uploadCreatorStagingImageAction(formData: FormData): Promise<
  ActionResult<{
    stagedPath: string;
    previewUrl: string;
    width: number;
    height: number;
    aspectRatio: "portrait" | "landscape" | "square";
    aspectRatioValue: string;
    dominantColor: string;
  }>
> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: "Database client is not available." };
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "Authentication required to upload staging media." };
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No image file provided." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate and process with sharp (max 10 MiB, dimensions >= 512, max 40 MP, strips metadata)
    const processed = await validateAndProcessImage(buffer);

    // Dedicated private staging path: {userId}/{objectKey}
    const filename = generateStorageKey(file.name.replace(/\.[^/.]+$/, ""));
    const stagedPath = `${user.id}/${filename}`;

    const { error: uploadErr } = await supabase.storage
      .from("prompt-staging")
      .upload(stagedPath, processed.buffer, {
        contentType: processed.contentType,
        upsert: true,
      });

    if (uploadErr) {
      console.error("Creator staging upload error:", uploadErr);
      return { success: false, error: `Staging upload failed: ${uploadErr.message}` };
    }

    // Generate short-lived signed preview URL (1 hour)
    const { data: signedData, error: signErr } = await supabase.storage
      .from("prompt-staging")
      .createSignedUrl(stagedPath, 3600);

    if (signErr || !signedData?.signedUrl) {
      return { success: false, error: "Failed to generate private preview URL." };
    }

    return {
      success: true,
      data: {
        stagedPath,
        previewUrl: signedData.signedUrl,
        width: processed.width,
        height: processed.height,
        aspectRatio: processed.aspectRatio,
        aspectRatioValue: processed.aspectRatioValue,
        dominantColor: processed.dominantColor,
      },
    };
  } catch (err) {
    console.error("uploadCreatorStagingImageAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to process image.",
    };
  }
}

/**
 * Creates a new prompt submission (as DRAFT or PENDING_REVIEW).
 */
export async function createSubmissionAction(
  formData: FormData,
  targetStatus: "DRAFT" | "PENDING_REVIEW" = "DRAFT"
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is not available." };

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "Authentication required to submit prompts." };
    }

    // 1. Check user profile activation if submitting for review
    if (targetStatus === "PENDING_REVIEW") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, is_public")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.username || !profile?.is_public) {
        return {
          success: false,
          error:
            "Creator Profile Required: You must activate a public creator profile with a unique username in Settings before submitting prompts for review.",
        };
      }
    }

    // 2. Enforce quota: Count active draft and pending submissions
    const { count: activeCount, error: countErr } = await supabase
      .from("prompt_submissions")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .in("status", ["DRAFT", "PENDING_REVIEW"]);

    if (!countErr && typeof activeCount === "number" && activeCount >= MAX_ACTIVE_SUBMISSIONS_QUOTA) {
      return {
        success: false,
        error: `Submission Quota Exceeded: You have reached the maximum limit of ${MAX_ACTIVE_SUBMISSIONS_QUOTA} active draft or pending submissions.`,
      };
    }

    // 3. Extract and validate submission fields
    const title = (formData.get("title") as string)?.trim();
    const shortDescription = (formData.get("shortDescription") as string)?.trim();
    const promptText = (formData.get("prompt") as string)?.trim();
    const negativePrompt = (formData.get("negativePrompt") as string)?.trim() || null;
    const category = (formData.get("category") as string)?.trim() as PromptCategory;
    const model = (formData.get("model") as string)?.trim() as AIModel;
    const compatibleModels = formData.getAll("compatibleModels") as string[];
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const stagedImagePath = (formData.get("stagedImagePath") as string)?.trim();
    const imageAlt = (formData.get("imageAlt") as string)?.trim() || title;
    const width = parseInt((formData.get("width") as string) || "1200", 10);
    const height = parseInt((formData.get("height") as string) || "800", 10);
    const aspectRatio = ((formData.get("aspectRatio") as string) || "landscape") as "portrait" | "landscape" | "square";
    const aspectRatioValue = (formData.get("aspectRatioValue") as string) || "3/2";
    const dominantColor = (formData.get("dominantColor") as string) || "#18181c";
    const genParamsRaw = (formData.get("generationParameters") as string)?.trim();

    if (!title) return { success: false, error: "Title is required." };
    if (!shortDescription) return { success: false, error: "Short description is required." };
    if (!promptText) return { success: false, error: "Prompt text is required." };
    if (!category) return { success: false, error: "Category is required." };
    if (!model) return { success: false, error: "AI model is required." };
    if (!stagedImagePath) return { success: false, error: "Please upload an image for the prompt." };

    let generationParameters = null;
    if (genParamsRaw) {
      try {
        generationParameters = JSON.parse(genParamsRaw);
      } catch {
        // Fallback null
      }
    }

    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const now = new Date().toISOString();
    const isSubmitting = targetStatus === "PENDING_REVIEW";

    // 4. Insert submission
    const { data: newSubmission, error: insertErr } = await supabase
      .from("prompt_submissions")
      .insert({
        author_id: user.id,
        revision: 1,
        title,
        short_description: shortDescription,
        prompt: promptText,
        negative_prompt: negativePrompt,
        generation_parameters: generationParameters,
        category,
        model,
        compatible_models: compatibleModels.length > 0 ? compatibleModels : [model],
        tags,
        staged_image_path: stagedImagePath,
        staged_image_bucket: "prompt-staging",
        image_alt: imageAlt,
        width,
        height,
        aspect_ratio: aspectRatio,
        aspect_ratio_value: aspectRatioValue,
        dominant_color: dominantColor,
        status: targetStatus,
        submitted_at: isSubmitting ? now : null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (insertErr || !newSubmission) {
      console.error("createSubmissionAction insert error:", insertErr);
      return { success: false, error: `Failed to create submission: ${insertErr?.message}` };
    }

    // 5. If submitting immediately for review, create immutable snapshot revision
    if (isSubmitting) {
      const snapshot = {
        title,
        short_description: shortDescription,
        prompt: promptText,
        negative_prompt: negativePrompt,
        generation_parameters: generationParameters,
        category,
        model,
        compatible_models: compatibleModels,
        tags,
        staged_image_path: stagedImagePath,
        image_alt: imageAlt,
        width,
        height,
        aspect_ratio: aspectRatio,
        aspect_ratio_value: aspectRatioValue,
        dominant_color: dominantColor,
      };

      await supabase.from("submission_revisions").insert({
        submission_id: newSubmission.id,
        revision: 1,
        snapshot,
        submitted_at: now,
        created_at: now,
      });
    }

    revalidatePath("/dashboard/submissions");
    return { success: true, data: { id: newSubmission.id } };
  } catch (err) {
    console.error("createSubmissionAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Updates an editable submission (DRAFT or CHANGES_REQUESTED) or resubmits it for review.
 */
export async function updateSubmissionAction(
  submissionId: string,
  formData: FormData,
  targetStatus?: "DRAFT" | "PENDING_REVIEW"
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is not available." };

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "Authentication required." };
    }

    // 1. Fetch current submission
    const { data: current, error: fetchErr } = await supabase
      .from("prompt_submissions")
      .select("*")
      .eq("id", submissionId)
      .eq("author_id", user.id)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Submission not found or access denied." };
    }

    // Content lock rule: Only DRAFT or CHANGES_REQUESTED can be edited
    if (current.status !== "DRAFT" && current.status !== "CHANGES_REQUESTED") {
      return {
        success: false,
        error: `Submission cannot be edited while in status "${current.status}". Withdraw it to DRAFT to make changes.`,
      };
    }

    const title = (formData.get("title") as string)?.trim() || current.title;
    const shortDescription = (formData.get("shortDescription") as string)?.trim() || current.short_description;
    const promptText = (formData.get("prompt") as string)?.trim() || current.prompt;
    const negativePrompt = (formData.get("negativePrompt") as string)?.trim() || current.negative_prompt;
    const category = ((formData.get("category") as string)?.trim() || current.category) as PromptCategory;
    const model = ((formData.get("model") as string)?.trim() || current.model) as AIModel;
    const compatibleModels = formData.getAll("compatibleModels") as string[];
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const stagedImagePath = (formData.get("stagedImagePath") as string)?.trim() || current.staged_image_path;
    const imageAlt = (formData.get("imageAlt") as string)?.trim() || current.image_alt;
    const width = parseInt((formData.get("width") as string) || String(current.width), 10);
    const height = parseInt((formData.get("height") as string) || String(current.height), 10);
    const aspectRatio = ((formData.get("aspectRatio") as string) || current.aspect_ratio) as "portrait" | "landscape" | "square";
    const aspectRatioValue = (formData.get("aspectRatioValue") as string) || current.aspect_ratio_value;
    const dominantColor = (formData.get("dominantColor") as string) || current.dominant_color;

    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : current.tags;

    const finalStatus = targetStatus || current.status;
    const isTransitioningToReview = finalStatus === "PENDING_REVIEW";
    const nextRevision = isTransitioningToReview ? current.revision + 1 : current.revision;
    const now = new Date().toISOString();

    const updatePayload = {
      title,
      short_description: shortDescription,
      prompt: promptText,
      negative_prompt: negativePrompt,
      category,
      model,
      compatible_models: compatibleModels.length > 0 ? compatibleModels : current.compatible_models,
      tags,
      staged_image_path: stagedImagePath,
      image_alt: imageAlt,
      width,
      height,
      aspect_ratio: aspectRatio,
      aspect_ratio_value: aspectRatioValue,
      dominant_color: dominantColor,
      status: finalStatus,
      revision: nextRevision,
      submitted_at: isTransitioningToReview ? now : current.submitted_at,
      updated_at: now,
    };

    const { error: updateErr } = await supabase
      .from("prompt_submissions")
      .update(updatePayload)
      .eq("id", submissionId)
      .eq("author_id", user.id);

    if (updateErr) {
      return { success: false, error: `Failed to update submission: ${updateErr.message}` };
    }

    // If submitted for review, create immutable revision snapshot
    if (isTransitioningToReview) {
      const snapshot = {
        title,
        short_description: shortDescription,
        prompt: promptText,
        negative_prompt: negativePrompt,
        category,
        model,
        compatible_models: updatePayload.compatible_models,
        tags,
        staged_image_path: stagedImagePath,
        image_alt: imageAlt,
        width,
        height,
        aspect_ratio: aspectRatio,
        aspect_ratio_value: aspectRatioValue,
        dominant_color: dominantColor,
      };

      await supabase.from("submission_revisions").insert({
        submission_id: submissionId,
        revision: nextRevision,
        snapshot,
        submitted_at: now,
        created_at: now,
      });
    }

    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return { success: true, data: { id: submissionId } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update submission.",
    };
  }
}

/**
 * Withdraws a pending submission back to DRAFT state.
 */
export async function withdrawSubmissionAction(submissionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is not available." };

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) return { success: false, error: "Authentication required." };

    // Conditional update: only succeeds if currently PENDING_REVIEW
    const { data, error } = await supabase
      .from("prompt_submissions")
      .update({
        status: "DRAFT",
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("author_id", user.id)
      .eq("status", "PENDING_REVIEW")
      .select("id");

    if (error || !data || data.length === 0) {
      return {
        success: false,
        error:
          "Withdrawal failed: Submission is no longer in PENDING_REVIEW status (it may have already been reviewed).",
      };
    }

    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to withdraw submission.",
    };
  }
}
