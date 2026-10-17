import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth/admin";

export type SubmissionRow = Database["public"]["Tables"]["prompt_submissions"]["Row"];

export interface SubmissionItem {
  id: string;
  authorId: string;
  revision: number;
  title: string;
  shortDescription: string;
  prompt: string;
  negativePrompt: string | null;
  generationParameters: Record<string, string | number> | null;
  category: string;
  model: string;
  compatibleModels: string[];
  tags: string[];
  stagedImagePath: string;
  stagedImageBucket: string;
  previewUrl?: string;
  imageAlt: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioValue: string;
  dominantColor: string;
  status: "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
  reviewFeedback: string | null;
  internalNotes?: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedPromptId: string | null;
  publishedSlug?: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export async function mapSubmissionRow(
  row: SubmissionRow,
  supabase: SupabaseClient<Database>,
  includeInternalNotes = false
): Promise<SubmissionItem> {
  let previewUrl = "";
  try {
    const { data } = await supabase.storage
      .from(row.staged_image_bucket || "prompt-staging")
      .createSignedUrl(row.staged_image_path, 3600);
    previewUrl = data?.signedUrl || "";
  } catch {
    // Graceful fallback
  }

  return {
    id: row.id,
    authorId: row.author_id,
    revision: row.revision,
    title: row.title,
    shortDescription: row.short_description,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt,
    generationParameters: row.generation_parameters as Record<string, string | number> | null,
    category: row.category,
    model: row.model,
    compatibleModels: row.compatible_models || [],
    tags: row.tags || [],
    stagedImagePath: row.staged_image_path,
    stagedImageBucket: row.staged_image_bucket,
    previewUrl,
    imageAlt: row.image_alt,
    width: row.width,
    height: row.height,
    aspectRatio: row.aspect_ratio,
    aspectRatioValue: row.aspect_ratio_value,
    dominantColor: row.dominant_color,
    status: row.status,
    reviewFeedback: row.review_feedback,
    internalNotes: includeInternalNotes ? row.internal_notes : null,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    publishedPromptId: row.published_prompt_id,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Retrieves submissions authored by a specific creator.
 */
export async function getCreatorSubmissions(
  authorId: string,
  options: { status?: string; page?: number; pageSize?: number } = {}
): Promise<{ submissions: SubmissionItem[]; total: number }> {
  const { status = "all", page = 1, pageSize = 12 } = options;
  const supabase = await createClient();
  if (!supabase) return { submissions: [], total: 0 };

  let query = supabase
    .from("prompt_submissions")
    .select("*", { count: "exact" })
    .eq("author_id", authorId);

  if (status && status !== "all") {
    query = query.eq("status", status as NonNullable<SubmissionRow["status"]>);
  }

  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error || !data) {
    console.error("getCreatorSubmissions error:", error);
    return { submissions: [], total: 0 };
  }

  const items = await Promise.all(
    data.map((row) => mapSubmissionRow(row, supabase, false))
  );

  return { submissions: items, total: count || 0 };
}

/**
 * Retrieves a single submission by ID, verifying authorization.
 */
export async function getSubmissionById(
  id: string,
  requestingUserId: string
): Promise<SubmissionItem | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const userIsAdmin = await isAdmin(requestingUserId);

  let query = supabase.from("prompt_submissions").select("*").eq("id", id);
  if (!userIsAdmin) {
    query = query.eq("author_id", requestingUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const item = await mapSubmissionRow(data, supabase, userIsAdmin);

  // If approved and published, fetch published prompt slug
  if (data.published_prompt_id) {
    const { data: promptData } = await supabase
      .from("prompts")
      .select("slug")
      .eq("id", data.published_prompt_id)
      .maybeSingle();

    if (promptData?.slug) {
      item.publishedSlug = promptData.slug;
    }
  }

  // Fetch author profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", data.author_id)
    .maybeSingle();

  if (profile) {
    item.creator = {
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    };
  }

  return item;
}

/**
 * Retrieves moderation queue submissions for administrators.
 */
export async function getAdminSubmissions(options: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ submissions: SubmissionItem[]; total: number }> {
  const { status = "PENDING_REVIEW", page = 1, pageSize = 15 } = options;
  const supabase = await createClient();
  if (!supabase) return { submissions: [], total: 0 };

  let query = supabase
    .from("prompt_submissions")
    .select("*", { count: "exact" });

  if (status && status !== "all") {
    query = query.eq("status", status as NonNullable<SubmissionRow["status"]>);
  }

  query = query.order("submitted_at", { ascending: true, nullsFirst: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error || !data) {
    console.error("getAdminSubmissions error:", error);
    return { submissions: [], total: 0 };
  }

  // Fetch creators for submissions
  const authorIds = Array.from(new Set(data.map((d) => d.author_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", authorIds);

  const profileMap = new Map<string, { username: string | null; displayName: string | null; avatarUrl: string | null }>();
  for (const p of profiles || []) {
    profileMap.set(p.id, {
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
    });
  }

  const items = await Promise.all(
    data.map(async (row) => {
      const mapped = await mapSubmissionRow(row, supabase, true);
      mapped.creator = profileMap.get(row.author_id);
      return mapped;
    })
  );

  return { submissions: items, total: count || 0 };
}
