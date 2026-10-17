import { STARTER_PROMPTS, type PromptItem, type PromptCategory, type AIModel } from "@/data/prompts";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type PromptRow = Database["public"]["Tables"]["prompts"]["Row"];

export interface GetPromptsOptions {
  query?: string;
  category?: string;
  model?: string;
  sort?: "newest" | "title-asc" | "title-desc";
  page?: number;
  pageSize?: number;
}

export interface GetPromptsResult {
  prompts: PromptItem[];
  totalMatching: number;
  source: "database" | "local";
}

/**
 * Transforms a raw Supabase PostgreSQL prompts table row into a PromptItem
 */
function mapDatabaseRowToPromptItem(row: PromptRow): PromptItem {

  return {
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
    aspectRatio: row.aspect_ratio as "portrait" | "landscape" | "square",
    aspectRatioValue: row.aspect_ratio_value,
    dominantColor: row.dominant_color,
    publishedAt: row.published_at,
    negativePrompt: row.negative_prompt || undefined,
    generationParameters: (row.generation_parameters as Record<string, string | number>) || undefined,
    sourceAttribution: (row.source_attribution as unknown as PromptItem["sourceAttribution"]) || {
      source: "Unsplash",
      author: "Photographer",
      authorUrl: "https://unsplash.com",
      license: "Unsplash Free License",
    },

  };
}

/**
 * Retrieves paginated, filtered, and sorted prompts.
 * Queries Supabase PostgreSQL if credentials are configured.
 * When Supabase credentials are not set, falls back to local data source.
 * When Supabase credentials ARE set, database errors are thrown so the application can render a recoverable error UI.
 */
export async function getPrompts(options: GetPromptsOptions = {}): Promise<GetPromptsResult> {
  const {
    query = "",
    category = "all",
    model = "All Models",
    sort = "newest",
    page = 1,
    pageSize = 8,
  } = options;

  const supabase = await createClient();

  if (supabase) {
    let dbQuery = supabase
      .from("prompts")
      .select("*", { count: "exact" })
      .eq("published", true);

    // Category filter
    if (category && category !== "all") {
      dbQuery = dbQuery.eq("category", category);
    }

    // Model filter (match primary or compatible_models contains)
    if (model && model !== "All Models") {
      dbQuery = dbQuery.or(`model.eq."${model}",compatible_models.cs.{"${model}"}`);
    }

    // Search query
    if (query.trim()) {
      const q = query.trim().replace(/"/g, '""');
      dbQuery = dbQuery.or(
        `title.ilike."%${q}%",short_description.ilike."%${q}%",prompt.ilike."%${q}%",category.ilike."%${q}%",model.ilike."%${q}%"`
      );
    }

    // Sorting
    if (sort === "title-asc") {
      dbQuery = dbQuery.order("title", { ascending: true });
    } else if (sort === "title-desc") {
      dbQuery = dbQuery.order("title", { ascending: false });
    } else {
      dbQuery = dbQuery.order("published_at", { ascending: false });
    }

    // Pagination
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    dbQuery = dbQuery.range(fromIndex, toIndex);

    const { data, count, error } = await dbQuery;

    if (error) {
      console.error("Supabase getPrompts query failed:", error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      prompts: (data || []).map(mapDatabaseRowToPromptItem),
      totalMatching: count || 0,
      source: "database",
    };
  }

  // Local data fallback when Supabase is not configured in environment
  const filtered = STARTER_PROMPTS.filter((item) => {

    if (category !== "all" && item.category !== category) return false;
    if (model !== "All Models") {
      const isPrimary = item.model === model;
      const isCompatible = item.compatibleModels?.includes(model as AIModel);
      if (!isPrimary && !isCompatible) return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const matches =
        item.title.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.model.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === "title-asc") return a.title.localeCompare(b.title);
    if (sort === "title-desc") return b.title.localeCompare(a.title);
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const totalMatching = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    prompts: paginated,
    totalMatching,
    source: "local",
  };
}

/**
 * Resolves a prompt by slug from Supabase PostgreSQL (or local fallback if unconfigured).
 */
export async function getPromptBySlugDb(slug: string): Promise<PromptItem | null> {
  const supabase = await createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error(`Supabase getPromptBySlugDb error for slug '${slug}':`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? mapDatabaseRowToPromptItem(data) : null;
  }

  const local = STARTER_PROMPTS.find((p) => p.slug === slug);
  return local || null;
}

/**
 * Returns all published prompt slugs for static params and sitemaps.
 */
export async function getAllPromptSlugsDb(): Promise<string[]> {
  const supabase = await createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("prompts")
      .select("slug")
      .eq("published", true);

    if (error) {
      console.warn("getAllPromptSlugsDb error, using local slugs:", error);
      return STARTER_PROMPTS.map((p) => p.slug);
    }

    return (data || []).map((row) => row.slug);
  }

  return STARTER_PROMPTS.map((p) => p.slug);
}

/**
 * Retrieves deterministically ranked related prompts.
 */
export async function getRelatedPromptsDb(
  prompt: PromptItem,
  limit = 4
): Promise<PromptItem[]> {
  const supabase = await createClient();

  if (supabase) {
    // 1. Fetch other published prompts in the same category or overlapping tags
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("published", true)
      .neq("slug", prompt.slug)
      .limit(20);

    if (error) {
      console.warn("getRelatedPromptsDb error, fallback to local scoring:", error);
      return [];
    }

    const candidates = (data || []).map(mapDatabaseRowToPromptItem);
    return scoreRelatedPrompts(prompt, candidates, limit);
  }

  const localCandidates = STARTER_PROMPTS.filter((p) => p.slug !== prompt.slug);
  return scoreRelatedPrompts(prompt, localCandidates, limit);
}

function scoreRelatedPrompts(
  current: PromptItem,
  candidates: PromptItem[],
  limit: number
): PromptItem[] {
  const scored = candidates
    .map((candidate) => {
      let score = 0;
      if (candidate.category === current.category) score += 10;
      const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));
      const sharedTags = candidate.tags.filter((t) => currentTags.has(t.toLowerCase())).length;
      score += sharedTags * 3;
      const currentModels = new Set([current.model, ...(current.compatibleModels || [])]);
      const candidateModels = [candidate.model, ...(candidate.compatibleModels || [])];
      const modelOverlap = candidateModels.filter((m) => currentModels.has(m)).length;
      score += modelOverlap * 2;
      return { candidate, score };
    })
    .filter((item) => item.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dateDiff =
      new Date(b.candidate.publishedAt).getTime() -
      new Date(a.candidate.publishedAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.candidate.title.localeCompare(b.candidate.title);
  });

  return scored.slice(0, limit).map((i) => i.candidate);
}

/**
 * Retrieves the full PromptItem objects for all published prompts bookmarked by the authenticated user.
 */
export async function getUserSavedPrompts(): Promise<PromptItem[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select(`
      prompt_id,
      created_at,
      prompts (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserSavedPrompts query error:", error);
    return [];
  }

  if (!data) return [];

  const results: PromptItem[] = [];
  const rows = data as unknown as Array<{ prompts: PromptRow | null }>;
  for (const row of rows) {
    if (row.prompts && row.prompts.published) {
      results.push(mapDatabaseRowToPromptItem(row.prompts));
    }
  }

  return results;
}


