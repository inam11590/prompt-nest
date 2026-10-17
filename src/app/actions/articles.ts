"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  validateAndProcessImage,
  uploadToStorage,
  generateStorageKey,
} from "@/lib/storage/image";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Uploads an article cover image to the public storage bucket.
 * Strictly requires verified administrator authorization.
 */
export async function uploadArticleCoverImageAction(formData: FormData): Promise<
  ActionResult<{
    imageUrl: string;
    width: number;
    height: number;
    aspectRatio: string;
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

    // Validate and process using sharp pipeline
    const processed = await validateAndProcessImage(buffer);
    const storageKey = generateStorageKey("guide-cover");

    const uploadRes = await uploadToStorage(
      processed.buffer,
      `articles/${storageKey}`,
      "prompt-images",
      "image/webp"
    );

    if (!uploadRes.publicUrl) {
      return { success: false, error: "Failed to upload cover image." };
    }

    return {
      success: true,
      data: {
        imageUrl: uploadRes.publicUrl,
        width: processed.width,
        height: processed.height,
        aspectRatio: processed.aspectRatio,
        dominantColor: processed.dominantColor,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cover upload failed.",
    };
  }
}

/**
 * Creates a new article in DRAFT or PUBLISHED status.
 */
export async function createArticleAction(
  formData: FormData,
  targetStatus: "DRAFT" | "PUBLISHED" = "DRAFT"
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user: admin } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is unavailable." };

    const title = (formData.get("title") as string)?.trim();
    let slug = (formData.get("slug") as string)?.trim();
    const excerpt = (formData.get("excerpt") as string)?.trim();
    const content = (formData.get("content") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() || "guide";
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const coverImageUrl = (formData.get("coverImageUrl") as string)?.trim() || null;
    const coverImageAlt = (formData.get("coverImageAlt") as string)?.trim() || null;
    const coverImageWidth = parseInt(formData.get("coverImageWidth") as string, 10) || 1200;
    const coverImageHeight = parseInt(formData.get("coverImageHeight") as string, 10) || 630;
    const coverImageDominantColor = (formData.get("coverImageDominantColor") as string)?.trim() || "#18181c";
    const authorId = (formData.get("authorId") as string)?.trim() || null;
    const associatedPromptIds = formData.getAll("promptIds") as string[];

    // 1. Validation
    if (!title || title.length < 3 || title.length > 150) {
      return { success: false, error: "Title must be between 3 and 150 characters." };
    }

    if (!slug) {
      slug = slugify(title);
    } else {
      slug = slugify(slug);
    }

    if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      return { success: false, error: "Slug must contain only lowercase alphanumeric characters and hyphens." };
    }

    if (!excerpt || excerpt.length < 10 || excerpt.length > 300) {
      return { success: false, error: "Excerpt must be between 10 and 300 characters." };
    }

    if (!content || content.length < 10) {
      return { success: false, error: "Article content must have at least 10 characters." };
    }

    if (coverImageUrl && (!coverImageAlt || coverImageAlt.length === 0)) {
      return { success: false, error: "Alt text is required when a cover image is specified." };
    }

    // 2. Uniqueness check on slug
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `An article with the slug "${slug}" already exists. Please choose a unique slug.` };
    }

    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const now = new Date().toISOString();
    const isPublishing = targetStatus === "PUBLISHED";

    // 3. Insert article
    const { data: newArticle, error: insertError } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        excerpt,
        content,
        category,
        tags,
        cover_image_url: coverImageUrl,
        cover_image_alt: coverImageAlt,
        cover_image_width: coverImageWidth,
        cover_image_height: coverImageHeight,
        cover_image_dominant_color: coverImageDominantColor,
        author_id: authorId,
        status: targetStatus,
        published_at: isPublishing ? now : null,
        last_edited_at: isPublishing ? now : null,
        concurrency_version: 1,
        created_at: now,
        updated_at: now,
      })
      .select("id, slug")
      .single();

    if (insertError || !newArticle) {
      return { success: false, error: `Failed to create article: ${insertError?.message}` };
    }

    // 4. Insert associated prompt links
    if (associatedPromptIds.length > 0) {
      const promptRows = associatedPromptIds.map((pId, idx) => ({
        article_id: newArticle.id,
        prompt_id: pId,
        sort_order: idx + 1,
      }));

      await supabase.from("article_prompts").insert(promptRows);
    }

    // 5. Audit log
    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: admin.id,
        action: isPublishing ? "article.publish" : "article.create",
        new_state: { id: newArticle.id, slug: newArticle.slug, status: targetStatus, title },
        changed_fields: ["title", "slug", "status", "content"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin/articles");
    revalidatePath("/blog");
    if (isPublishing) {
      revalidatePath(`/blog/${newArticle.slug}`);
    }

    return { success: true, data: { id: newArticle.id, slug: newArticle.slug } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Updates an article with optimistic concurrency protection and slug immutability.
 */
export async function updateArticleAction(
  articleId: string,
  expectedVersion: number,
  formData: FormData,
  targetStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user: admin } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is unavailable." };

    // 1. Fetch current article state
    const { data: current, error: fetchErr } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Article not found." };
    }

    // 2. Concurrency check
    if (current.concurrency_version !== expectedVersion) {
      return {
        success: false,
        error: "Concurrency Conflict: This article was modified by another editor. Please refresh to load the latest revisions.",
      };
    }

    const title = (formData.get("title") as string)?.trim();
    const requestedSlug = (formData.get("slug") as string)?.trim();
    const excerpt = (formData.get("excerpt") as string)?.trim();
    const content = (formData.get("content") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() || "guide";
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const coverImageUrl = (formData.get("coverImageUrl") as string)?.trim() || null;
    const coverImageAlt = (formData.get("coverImageAlt") as string)?.trim() || null;
    const coverImageWidth = parseInt(formData.get("coverImageWidth") as string, 10) || 1200;
    const coverImageHeight = parseInt(formData.get("coverImageHeight") as string, 10) || 630;
    const coverImageDominantColor = (formData.get("coverImageDominantColor") as string)?.trim() || "#18181c";
    const authorId = (formData.get("authorId") as string)?.trim() || null;
    const associatedPromptIds = formData.getAll("promptIds") as string[];

    // 3. Validation
    if (!title || title.length < 3 || title.length > 150) {
      return { success: false, error: "Title must be between 3 and 150 characters." };
    }

    // Slug lock: if already published, slug cannot be modified
    let finalSlug = current.slug;
    if (current.published_at && requestedSlug && requestedSlug !== current.slug) {
      return { success: false, error: "Slug Immutability: The slug of an already published article cannot be changed to preserve permanent URLs and bookmarks." };
    } else if (!current.published_at && requestedSlug) {
      finalSlug = slugify(requestedSlug);
      // Check collision
      const { data: collision } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", finalSlug)
        .neq("id", articleId)
        .maybeSingle();

      if (collision) {
        return { success: false, error: `The slug "${finalSlug}" is already in use by another article.` };
      }
    }

    if (!excerpt || excerpt.length < 10 || excerpt.length > 300) {
      return { success: false, error: "Excerpt must be between 10 and 300 characters." };
    }

    if (!content || content.length < 10) {
      return { success: false, error: "Article content must have at least 10 characters." };
    }

    if (coverImageUrl && (!coverImageAlt || coverImageAlt.length === 0)) {
      return { success: false, error: "Alt text is required when a cover image is specified." };
    }

    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const now = new Date().toISOString();
    const newStatus = targetStatus || current.status;
    const isFirstPublish = newStatus === "PUBLISHED" && !current.published_at;

    // Detect actual content modification
    const hasContentChanges =
      title !== current.title ||
      excerpt !== current.excerpt ||
      content !== current.content ||
      coverImageUrl !== current.cover_image_url;

    const lastEditedAt = hasContentChanges || isFirstPublish ? now : current.last_edited_at;
    const publishedAt = isFirstPublish ? now : current.published_at;

    // 4. Update article
    const { data: updated, error: updateError } = await supabase
      .from("articles")
      .update({
        title,
        slug: finalSlug,
        excerpt,
        content,
        category,
        tags,
        cover_image_url: coverImageUrl,
        cover_image_alt: coverImageAlt,
        cover_image_width: coverImageWidth,
        cover_image_height: coverImageHeight,
        cover_image_dominant_color: coverImageDominantColor,
        author_id: authorId,
        status: newStatus,
        published_at: publishedAt,
        last_edited_at: lastEditedAt,
        concurrency_version: expectedVersion + 1,
        updated_at: now,
      })
      .eq("id", articleId)
      .eq("concurrency_version", expectedVersion)
      .select("id, slug")
      .single();

    if (updateError || !updated) {
      return { success: false, error: `Failed to update article: ${updateError?.message}` };
    }

    // 5. Update prompt associations
    await supabase.from("article_prompts").delete().eq("article_id", articleId);
    if (associatedPromptIds.length > 0) {
      const promptRows = associatedPromptIds.map((pId, idx) => ({
        article_id: articleId,
        prompt_id: pId,
        sort_order: idx + 1,
      }));
      await supabase.from("article_prompts").insert(promptRows);
    }

    // 6. Audit log
    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: admin.id,
        action: "article.update",
        previous_state: { id: articleId, status: current.status, version: expectedVersion },
        new_state: { id: articleId, status: newStatus, version: expectedVersion + 1, title },
        changed_fields: ["title", "content", "excerpt", "status"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${articleId}/edit`);
    revalidatePath("/blog");
    revalidatePath(`/blog/${updated.slug}`);

    return { success: true, data: { id: updated.id, slug: updated.slug } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

/**
 * Changes article status (publish, unpublish/draft, archive).
 */
export async function setArticleStatusAction(
  articleId: string,
  expectedVersion: number,
  targetStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<ActionResult> {
  try {
    const { user: admin } = await requireAdmin();
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Database client is unavailable." };

    const { data: current, error: fetchErr } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Article not found." };
    }

    if (current.concurrency_version !== expectedVersion) {
      return {
        success: false,
        error: "Concurrency Conflict: Article was modified concurrently. Please refresh.",
      };
    }

    // Publishing validation
    if (targetStatus === "PUBLISHED") {
      if (!current.title || !current.slug || !current.excerpt || !current.content) {
        return { success: false, error: "Cannot publish: Title, slug, excerpt, and content must be complete." };
      }
    }

    const now = new Date().toISOString();
    const isFirstPublish = targetStatus === "PUBLISHED" && !current.published_at;
    const publishedAt = isFirstPublish ? now : current.published_at;
    const lastEditedAt = isFirstPublish ? now : current.last_edited_at;

    const { error: updateError } = await supabase
      .from("articles")
      .update({
        status: targetStatus,
        published_at: publishedAt,
        last_edited_at: lastEditedAt,
        concurrency_version: expectedVersion + 1,
        updated_at: now,
      })
      .eq("id", articleId)
      .eq("concurrency_version", expectedVersion);

    if (updateError) {
      return { success: false, error: `Failed to update status: ${updateError.message}` };
    }

    // Audit log
    try {
      await supabase.from("admin_audit_logs").insert({
        actor_id: admin.id,
        action: `article.${targetStatus.toLowerCase()}`,
        previous_state: { id: articleId, status: current.status },
        new_state: { id: articleId, status: targetStatus },
        changed_fields: ["status"],
      });
    } catch (auditErr) {
      console.warn("Audit log insert failed:", auditErr);
    }

    revalidatePath("/admin/articles");
    revalidatePath("/blog");
    revalidatePath(`/blog/${current.slug}`);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Status update failed.",
    };
  }
}
