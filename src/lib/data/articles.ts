import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { STARTER_PROMPTS, type PromptItem, type PromptCategory, type AIModel } from "@/data/prompts";
import { renderArticleMarkdown, type TocItem } from "@/lib/blog/markdown";

export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

export interface ArticleAuthor {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  coverImageDominantColor: string | null;
  category: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  lastEditedAt: string | null;
  authorId: string | null;
  concurrencyVersion: number;
  createdAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  author?: ArticleAuthor | null;
  associatedPrompts?: PromptItem[];
  htmlContent?: string;
  toc?: TocItem[];
}

export interface GetArticlesOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  query?: string;
}

/**
 * Calculates estimated reading time (approx 200 words per minute).
 */
export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Maps database article row to typed ArticleItem.
 */
export function mapArticleRow(row: ArticleRow): ArticleItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    coverImageWidth: row.cover_image_width,
    coverImageHeight: row.cover_image_height,
    coverImageDominantColor: row.cover_image_dominant_color,
    category: row.category,
    tags: row.tags || [],
    status: row.status,
    publishedAt: row.published_at,
    lastEditedAt: row.last_edited_at || row.updated_at,
    authorId: row.author_id,
    concurrencyVersion: row.concurrency_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readingTimeMinutes: calculateReadingTime(row.content),
  };
}

/**
 * Retrieves paginated published articles for the public blog directory.
 */
export async function getPublishedArticles(
  options: GetArticlesOptions = {}
): Promise<{ articles: ArticleItem[]; total: number }> {
  const { page = 1, pageSize = 9, category, query } = options;
  const supabase = createPublicClient();
  if (!supabase) return { articles: [], total: 0 };

  let dbQuery = supabase
    .from("articles")
    .select("*", { count: "exact" })
    .eq("status", "PUBLISHED");

  if (category && category !== "all") {
    dbQuery = dbQuery.eq("category", category);
  }

  if (query?.trim()) {
    const q = query.trim().replace(/"/g, '""');
    dbQuery = dbQuery.or(`title.ilike."%${q}%",excerpt.ilike."%${q}%"`);
  }

  dbQuery = dbQuery.order("published_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error } = await dbQuery;
  if (error || !data) {
    console.error("getPublishedArticles error:", error);
    return { articles: [], total: 0 };
  }

  // Fetch author profiles for articles with authors
  const authorIds = Array.from(new Set(data.map((a) => a.author_id).filter(Boolean))) as string[];
  const authorMap = new Map<string, ArticleAuthor>();

  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_public")
      .in("id", authorIds)
      .eq("is_public", true);

    for (const a of authors || []) {
      authorMap.set(a.id, {
        id: a.id,
        username: a.username,
        displayName: a.display_name,
        avatarUrl: a.avatar_url,
      });
    }
  }

  const articles = data.map((row) => {
    const item = mapArticleRow(row);
    if (row.author_id) {
      item.author = authorMap.get(row.author_id) || null;
    }
    return item;
  });

  return { articles, total: count || 0 };
}

/**
 * Retrieves a single published article by slug with rendered markdown and associated prompts.
 */
export async function getArticleBySlug(slug: string): Promise<ArticleItem | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (error || !data) return null;

  const article = mapArticleRow(data);

  // Safe server-side markdown render & TOC extraction
  const { html, toc } = renderArticleMarkdown(data.content);
  article.htmlContent = html;
  article.toc = toc;

  // Author details (only if public profile)
  if (data.author_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_public")
      .eq("id", data.author_id)
      .eq("is_public", true)
      .maybeSingle();

    if (profile) {
      article.author = {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      };
    }
  }

  // Fetch associated published prompts
  const { data: promptLinks } = await supabase
    .from("article_prompts")
    .select("prompt_id, sort_order")
    .eq("article_id", data.id)
    .order("sort_order", { ascending: true });

  if (promptLinks && promptLinks.length > 0) {
    const promptIds = promptLinks.map((p) => p.prompt_id);
    const { data: prompts } = await supabase
      .from("prompts")
      .select("*")
      .in("id", promptIds)
      .eq("published", true);

    if (prompts) {
      // Map and order
      const promptMap = new Map(prompts.map((p) => [p.id, p]));
      const orderedPrompts: PromptItem[] = [];
      for (const link of promptLinks) {
        const row = promptMap.get(link.prompt_id);
        if (row) {
          orderedPrompts.push({
            id: row.id,
            slug: row.slug,
            title: row.title,
            shortDescription: row.short_description,
            prompt: row.prompt,
            category: row.category as PromptCategory,
            model: row.model as AIModel,
            compatibleModels: (row.compatible_models || []) as AIModel[],
            tags: row.tags || [],
            imageUrl: row.image_url,
            imageAlt: row.image_alt,
            width: row.width,
            height: row.height,
            aspectRatio: (row.aspect_ratio || "landscape") as "portrait" | "landscape" | "square",
            aspectRatioValue: row.aspect_ratio_value,
            dominantColor: row.dominant_color,
            publishedAt: row.published_at,
            sourceAttribution: (row.source_attribution as unknown as PromptItem["sourceAttribution"]) || {
              source: "Unsplash",
              author: "Photographer",
              authorUrl: "https://unsplash.com",
              license: "Unsplash Free License",
            },
          });
        }
      }
      article.associatedPrompts = orderedPrompts;
    }
  }

  return article;
}

/**
 * Returns all published article slugs for static params and sitemaps.
 */
export async function getAllPublishedArticleSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("slug, published_at, last_edited_at, updated_at")
    .eq("status", "PUBLISHED");

  if (error || !data) return [];

  return data.map((row) => ({
    slug: row.slug,
    updatedAt: row.last_edited_at || row.published_at || row.updated_at,
  }));
}

/**
 * Retrieves related published articles using deterministic matching (category and shared tags).
 */
export async function getRelatedArticles(
  articleOrId: ArticleItem | string,
  categoryOrLimit: string | number = 3,
  maybeLimit = 3
): Promise<ArticleItem[]> {
  const currentArticleId = typeof articleOrId === "object" ? articleOrId.id : articleOrId;
  const category =
    typeof articleOrId === "object"
      ? articleOrId.category
      : typeof categoryOrLimit === "string"
      ? categoryOrLimit
      : "guide";
  const limit =
    typeof articleOrId === "object"
      ? typeof categoryOrLimit === "number"
        ? categoryOrLimit
        : 3
      : maybeLimit;

  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "PUBLISHED")
    .neq("id", currentArticleId)
    .order("published_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  // Sort by category match first, then newest
  const scored = data.map((row) => {
    let score = 0;
    if (row.category === category) score += 5;
    return { row, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.row.published_at || 0).getTime() - new Date(a.row.published_at || 0).getTime();
  });

  return scored.slice(0, limit).map((s) => mapArticleRow(s.row));
}

/**
 * Retrieves published guides associated with a prompt for /prompts/[slug].
 */
export async function getGuidesForPrompt(promptId: string, limit = 3): Promise<ArticleItem[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("article_prompts")
    .select("article_id, sort_order, articles (*)")
    .eq("prompt_id", promptId)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  const articles: ArticleItem[] = [];
  for (const item of data as unknown as Array<{ articles: ArticleRow | null }>) {
    if (item.articles && item.articles.status === "PUBLISHED") {
      articles.push(mapArticleRow(item.articles));
    }
  }

  return articles;
}

/**
 * Admin: Retrieves all articles with status filtering, search, and pagination.
 */
export async function getAdminArticles(options: {
  status?: string;
  query?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ articles: ArticleItem[]; total: number }> {
  const { status = "all", query, page = 1, pageSize = 15 } = options;
  const supabase = await createClient();
  if (!supabase) return { articles: [], total: 0 };

  let dbQuery = supabase.from("articles").select("*", { count: "exact" });

  if (status && status !== "all") {
    dbQuery = dbQuery.eq("status", status as "DRAFT" | "PUBLISHED" | "ARCHIVED");
  }

  if (query?.trim()) {
    const q = query.trim().replace(/"/g, '""');
    dbQuery = dbQuery.or(`title.ilike."%${q}%",slug.ilike."%${q}%",excerpt.ilike."%${q}%"`);
  }

  dbQuery = dbQuery.order("updated_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error } = await dbQuery;
  if (error || !data) {
    console.error("getAdminArticles error:", error);
    return { articles: [], total: 0 };
  }

  return {
    articles: data.map(mapArticleRow),
    total: count || 0,
  };
}

/**
 * Admin: Retrieves a single article by ID (including draft/archived) for editor/preview.
 */
export async function getArticleByIdAdmin(
  id: string
): Promise<{ article: ArticleItem; promptIds: string[] } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const article = mapArticleRow(data);

  // Fetch associated prompt IDs
  const { data: linkRows } = await supabase
    .from("article_prompts")
    .select("prompt_id")
    .eq("article_id", id)
    .order("sort_order", { ascending: true });

  const promptIds = (linkRows || []).map((l) => l.prompt_id);

  return { article, promptIds };
}

/**
 * Admin: Computes article statistics for the admin dashboard.
 */
export async function getAdminArticleStats(): Promise<{
  total: number;
  published: number;
  draft: number;
  archived: number;
}> {
  const supabase = await createClient();
  if (!supabase) return { total: 0, published: 0, draft: 0, archived: 0 };

  const { data, error } = await supabase.from("articles").select("status");
  if (error || !data) return { total: 0, published: 0, draft: 0, archived: 0 };

  let published = 0;
  let draft = 0;
  let archived = 0;

  for (const row of data) {
    if (row.status === "PUBLISHED") published++;
    else if (row.status === "DRAFT") draft++;
    else if (row.status === "ARCHIVED") archived++;
  }

  return {
    total: data.length,
    published,
    draft,
    archived,
  };
}

/**
 * Admin: Fetches eligible public creators that can be assigned as article authors.
 */
export async function getAvailableAuthorsForAdmin(): Promise<ArticleAuthor[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("is_public", true)
    .not("username", "is", null)
    .order("display_name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
  }));
}

/**
 * Admin: Fetches published prompts that can be associated with an article.
 */
export async function getAvailablePromptsForAdmin(): Promise<
  Array<{ id: string; title: string; category: string; model: string }>
> {
  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("prompts")
      .select("id, title, category, model")
      .eq("status", "published")
      .order("title", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        model: p.model,
      }));
    }
  }

  // Fallback to starter prompts
  return STARTER_PROMPTS.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    model: p.model,
  }));
}
