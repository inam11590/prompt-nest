"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { generateStorageKey, uploadToStorage } from "@/lib/storage/image";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

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
 * Approves a pending submission: copies image to public bucket, creates published prompt, and marks submission approved.
 */
export async function approveSubmissionAction(
  submissionId: string,
  expectedRevision: number,
  internalNotes?: string
): Promise<ActionResult<{ promptId: string; slug: string }>> {
  try {
    const { user: admin } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is not available." };

    // 1. Concurrency check: Fetch exact pending submission revision
    const { data: submission, error: fetchErr } = await supabase
      .from("prompt_submissions")
      .select("*")
      .eq("id", submissionId)
      .eq("revision", expectedRevision)
      .eq("status", "PENDING_REVIEW")
      .maybeSingle();

    if (fetchErr || !submission) {
      return {
        success: false,
        error:
          "Concurrency Conflict: This submission is no longer pending or its revision was updated by the creator or another reviewer. Please refresh and review.",
      };
    }

    // 2. Resolve a unique public slug
    let slug = slugify(submission.title);
    const { data: existingSlug } = await supabase
      .from("prompts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 3. Prepare public image derivative from private staging
    let publicImageUrl = "";
    try {
      const { data: fileData, error: downloadErr } = await supabase.storage
        .from(submission.staged_image_bucket || "prompt-staging")
        .download(submission.staged_image_path);

      if (downloadErr || !fileData) {
        return {
          success: false,
          error: `Media preparation failed: Could not retrieve staged image (${downloadErr?.message || "File missing"}).`,
        };
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const objectKey = generateStorageKey(slug);
      const uploadRes = await uploadToStorage(buffer, objectKey, "prompt-images", "image/webp");
      publicImageUrl = uploadRes.publicUrl;
    } catch (mediaErr) {
      console.error("Failed to copy staged image to public storage:", mediaErr);
      return {
        success: false,
        error: `Storage derivative creation failed: ${mediaErr instanceof Error ? mediaErr.message : String(mediaErr)}`,
      };
    }

    const now = new Date().toISOString();
    const promptId = `prompt-${Date.now()}`;

    // 4. Atomically create published prompt and mark submission approved
    const insertPayload = {
      id: promptId,
      slug,
      title: submission.title,
      short_description: submission.short_description,
      prompt: submission.prompt,
      category: submission.category,
      model: submission.model,
      compatible_models: submission.compatible_models,
      tags: submission.tags,
      image_url: publicImageUrl,
      image_alt: submission.image_alt,
      width: submission.width,
      height: submission.height,
      aspect_ratio: submission.aspect_ratio,
      aspect_ratio_value: submission.aspect_ratio_value,
      dominant_color: submission.dominant_color,
      negative_prompt: submission.negative_prompt,
      generation_parameters: submission.generation_parameters,
      source_attribution: {
        source: "PromptNest Community Creator",
        author: "Creator",
        authorUrl: "https://prompt-nest-pi.vercel.app",
        license: "PromptNest Community License",
      },
      status: "published" as const,
      published: true,
      published_at: now,
      author_id: submission.author_id,
      submission_id: submission.id,
      created_at: now,
      updated_at: now,
    };

    const { error: promptInsertErr } = await supabase
      .from("prompts")
      .insert(insertPayload);

    if (promptInsertErr) {
      console.error("approveSubmissionAction prompts insert error:", promptInsertErr);
      return { success: false, error: `Failed to create published prompt: ${promptInsertErr.message}` };
    }

    const { error: subUpdateErr } = await supabase
      .from("prompt_submissions")
      .update({
        status: "APPROVED",
        published_prompt_id: promptId,
        reviewed_by: admin.id,
        reviewed_at: now,
        internal_notes: internalNotes?.trim() || null,
        updated_at: now,
      })
      .eq("id", submissionId)
      .eq("revision", expectedRevision)
      .eq("status", "PENDING_REVIEW");

    if (subUpdateErr) {
      console.error("approveSubmissionAction status update error:", subUpdateErr);
      return { success: false, error: `Prompt published but submission status failed: ${subUpdateErr.message}` };
    }

    // 5. Audit log
    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: admin.id,
        prompt_id: promptId,
        action: "submission.approve",
        previous_state: { submissionId, status: "PENDING_REVIEW", revision: expectedRevision },
        new_state: { submissionId, status: "APPROVED", promptId, slug },
        changed_fields: ["status", "published_prompt_id", "reviewed_at"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    revalidatePath("/");
    revalidatePath("/prompts");
    revalidatePath(`/prompts/${slug}`);
    revalidatePath("/creators");

    return { success: true, data: { promptId, slug } };
  } catch (err) {
    console.error("approveSubmissionAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected moderation error occurred.",
    };
  }
}

/**
 * Requests changes from creator with mandatory visible feedback.
 */
export async function requestChangesSubmissionAction(
  submissionId: string,
  expectedRevision: number,
  feedback: string,
  internalNotes?: string
): Promise<ActionResult> {
  try {
    const { user: admin } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is not available." };

    if (!feedback || feedback.trim().length === 0) {
      return { success: false, error: "Feedback explanation is required when requesting changes." };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("prompt_submissions")
      .update({
        status: "CHANGES_REQUESTED",
        review_feedback: feedback.trim(),
        internal_notes: internalNotes?.trim() || null,
        reviewed_by: admin.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", submissionId)
      .eq("revision", expectedRevision)
      .eq("status", "PENDING_REVIEW")
      .select("id");

    if (error || !data || data.length === 0) {
      return {
        success: false,
        error: "Conflict: Submission is no longer in PENDING_REVIEW or its revision was modified.",
      };
    }

    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: admin.id,
        action: "submission.request_changes",
        previous_state: { submissionId, status: "PENDING_REVIEW", revision: expectedRevision },
        new_state: { submissionId, status: "CHANGES_REQUESTED", feedback: feedback.slice(0, 100) },
        changed_fields: ["status", "review_feedback", "reviewed_at"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to request changes.",
    };
  }
}

/**
 * Rejects a submission with mandatory creator feedback.
 */
export async function rejectSubmissionAction(
  submissionId: string,
  expectedRevision: number,
  feedback: string,
  internalNotes?: string
): Promise<ActionResult> {
  try {
    const { user: admin } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is not available." };

    if (!feedback || feedback.trim().length === 0) {
      return { success: false, error: "Rejection reason is required when rejecting a submission." };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("prompt_submissions")
      .update({
        status: "REJECTED",
        review_feedback: feedback.trim(),
        internal_notes: internalNotes?.trim() || null,
        reviewed_by: admin.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", submissionId)
      .eq("revision", expectedRevision)
      .eq("status", "PENDING_REVIEW")
      .select("id");

    if (error || !data || data.length === 0) {
      return {
        success: false,
        error: "Conflict: Submission is no longer in PENDING_REVIEW or its revision was modified.",
      };
    }

    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: admin.id,
        action: "submission.reject",
        previous_state: { submissionId, status: "PENDING_REVIEW", revision: expectedRevision },
        new_state: { submissionId, status: "REJECTED", reason: feedback.slice(0, 100) },
        changed_fields: ["status", "review_feedback", "reviewed_at"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reject submission.",
    };
  }
}
