import { STARTER_PROMPTS, type PromptItem, type PromptCategory, type AIModel } from "@/data/prompts";
import { createClient, createPublicClient } from "@/lib/supabase/server";
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
export function mapDatabaseRowToPromptItem(row: PromptRow): PromptItem {

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
    status: row.status || (row.published ? "published" : "draft"),
    updatedAt: row.updated_at,
    negativePrompt: row.negative_prompt || undefined,
    generationParameters: (row.generation_parameters as Record<string, string | number>) || undefined,
    sourceAttribution: (row.source_attribution as unknown as PromptItem["sourceAttribution"]) || {
      source: "Unsplash",
      author: "Photographer",
      authorUrl: "https://unsplash.com",
      license: "Unsplash Free License",
    },
    authorId: row.author_id || undefined,
    promptMatchExample: row.prompt_match_example || undefined,
    styleInspiration: row.style_inspiration || undefined,
    isCricketIdentity: row.is_cricket_identity ?? (row.category === "cricket"),
    imageProvenance: (row.image_provenance as unknown as PromptItem["imageProvenance"]) || undefined,
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

  const supabase = createPublicClient();

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
        `title.ilike."%${q}%",short_description.ilike."%${q}%",prompt.ilike."%${q}%",prompt_match_example.ilike."%${q}%",style_inspiration.ilike."%${q}%",category.ilike."%${q}%",model.ilike."%${q}%"`
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
        (item.promptMatchExample && item.promptMatchExample.toLowerCase().includes(q)) ||
        (item.styleInspiration && item.styleInspiration.toLowerCase().includes(q)) ||
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
  const supabase = createPublicClient();

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

    if (data) {
      const item = mapDatabaseRowToPromptItem(data);
      if (data.author_id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url, is_public")
            .eq("id", data.author_id)
            .maybeSingle();

          if (profile?.is_public && profile?.username) {
            item.author = {
              username: profile.username,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
            };
          }
        } catch {
          // Graceful fallback if profiles table error
        }
      }
      return item;
    }
    return null;
  }

  const local = STARTER_PROMPTS.find((p) => p.slug === slug);
  return local || null;
}

/**
 * Returns all published prompt slugs for static params and sitemaps.
 */
export async function getAllPromptSlugsDb(): Promise<string[]> {
  const supabase = createPublicClient();

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
  const supabase = createPublicClient();

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

export interface GetAdminPromptsOptions {
  query?: string;
  category?: string;
  model?: string;
  status?: "all" | "draft" | "published" | "archived";
  sort?: "newest" | "oldest" | "title-asc" | "title-desc" | "updated";
  page?: number;
  pageSize?: number;
}

export interface GetAdminPromptsResult {
  prompts: PromptItem[];
  totalMatching: number;
  source: "database" | "local";
}

/**
 * Retrieves prompts for the administrator console (including draft, published, and archived).
 */
export async function getAdminPrompts(
  options: GetAdminPromptsOptions = {}
): Promise<GetAdminPromptsResult> {
  const {
    query = "",
    category = "all",
    model = "All Models",
    status = "all",
    sort = "newest",
    page = 1,
    pageSize = 15,
  } = options;

  const supabase = await createClient();

  if (supabase) {
    let dbQuery = supabase.from("prompts").select("*", { count: "exact" });

    // Status filter
    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    // Category filter
    if (category && category !== "all") {
      dbQuery = dbQuery.eq("category", category);
    }

    // Model filter
    if (model && model !== "All Models") {
      dbQuery = dbQuery.or(`model.eq."${model}",compatible_models.cs.{"${model}"}`);
    }

    // Search query
    if (query.trim()) {
      const q = query.trim().replace(/"/g, '""');
      dbQuery = dbQuery.or(
        `title.ilike."%${q}%",short_description.ilike."%${q}%",slug.ilike."%${q}%",prompt.ilike."%${q}%"`
      );
    }

    // Sort
    if (sort === "title-asc") {
      dbQuery = dbQuery.order("title", { ascending: true });
    } else if (sort === "title-desc") {
      dbQuery = dbQuery.order("title", { ascending: false });
    } else if (sort === "oldest") {
      dbQuery = dbQuery.order("created_at", { ascending: true });
    } else if (sort === "updated") {
      dbQuery = dbQuery.order("updated_at", { ascending: false });
    } else {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    }

    // Pagination
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    dbQuery = dbQuery.range(fromIndex, toIndex);

    const { data, count, error } = await dbQuery;

    if (error) {
      console.error("getAdminPrompts query error:", error);
      throw new Error(`Admin prompts query failed: ${error.message}`);
    }

    return {
      prompts: (data || []).map(mapDatabaseRowToPromptItem),
      totalMatching: count || 0,
      source: "database",
    };
  }

  // Local fallback
  let items = STARTER_PROMPTS.map((p) => ({
    ...p,
    status: p.status || "published" as const,
  }));

  if (status !== "all") {
    items = items.filter((item) => (item.status || "published") === status);
  }

  if (category !== "all") {
    items = items.filter((item) => item.category === category);
  }

  if (model !== "All Models") {
    items = items.filter(
      (item) => item.model === model || item.compatibleModels?.includes(model as AIModel)
    );
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q)
    );
  }

  items.sort((a, b) => {
    if (sort === "title-asc") return a.title.localeCompare(b.title);
    if (sort === "title-desc") return b.title.localeCompare(a.title);
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const totalMatching = items.length;
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    prompts: paginated,
    totalMatching,
    source: "local",
  };
}

/**
 * Retrieves a single prompt by its unique ID for the admin editor or preview.
 */
export async function getPromptByIdAdmin(id: string): Promise<PromptItem | null> {
  const supabase = await createClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`getPromptByIdAdmin error for id '${id}':`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data ? mapDatabaseRowToPromptItem(data) : null;
  }

  const found = STARTER_PROMPTS.find((p) => p.id === id);
  return found ? { ...found, status: found.status || "published" } : null;
}

/**
 * Computes administrative counts across all publication states.
 */
export async function getAdminStats(): Promise<{
  total: number;
  published: number;
  draft: number;
  archived: number;
}> {
  const supabase = await createClient();

  if (supabase) {
    const { data, error } = await supabase.from("prompts").select("status, published");

    if (error) {
      console.error("getAdminStats query error:", error);
      return { total: 0, published: 0, draft: 0, archived: 0 };
    }

    let published = 0;
    let draft = 0;
    let archived = 0;

    for (const row of data || []) {
      const s = row.status || (row.published ? "published" : "draft");
      if (s === "published") published++;
      else if (s === "draft") draft++;
      else if (s === "archived") archived++;
    }

    return {
      total: (data || []).length,
      published,
      draft,
      archived,
    };
  }

  return {
    total: STARTER_PROMPTS.length,
    published: STARTER_PROMPTS.length,
    draft: 0,
    archived: 0,
  };
}

export interface AdminAuditLogEntry {
  id: string;
  actor_id: string;
  prompt_id: string | null;
  action: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  changed_fields: string[];
  created_at: string;
}

/**
 * Fetches recent admin audit logs.
 */
export async function getAuditLogsAdmin(limit = 20): Promise<AdminAuditLogEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getAuditLogsAdmin error:", error);
    return [];
  }

  return (data || []) as unknown as AdminAuditLogEntry[];
}

/**
 * Retrieves all published prompts attributed to a specific creator author_id.
 * Excludes drafts, pending reviews, and archived prompts.
 */
export async function getPromptsByAuthorId(
  authorId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ prompts: PromptItem[]; total: number }> {
  const { page = 1, pageSize = 20 } = options;
  const supabase = createPublicClient();

  if (supabase) {
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data, count, error } = await supabase
      .from("prompts")
      .select("*", { count: "exact" })
      .eq("author_id", authorId)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .range(fromIndex, toIndex);

    if (error) {
      console.error("getPromptsByAuthorId error:", error);
      return { prompts: [], total: 0 };
    }

    return {
      prompts: (data || []).map(mapDatabaseRowToPromptItem),
      total: count || 0,
    };
  }

  return { prompts: [], total: 0 };
}

/**
 * Retrieves prompts matching the given list of IDs, preserving order.
 */
export async function getPromptsByIds(ids: string[]): Promise<PromptItem[]> {
  if (!ids || ids.length === 0) return [];

  const supabase = createPublicClient();
  const foundMap = new Map<string, PromptItem>();

  if (supabase) {
    const { data } = await supabase
      .from("prompts")
      .select("*")
      .in("id", ids);

    if (data) {
      for (const row of data) {
        foundMap.set(row.id, mapDatabaseRowToPromptItem(row));
      }
    }
  }

  // Fallback to starter prompts for any missing IDs
  for (const starter of STARTER_PROMPTS) {
    if (ids.includes(starter.id) && !foundMap.has(starter.id)) {
      foundMap.set(starter.id, starter);
    }
  }

  const result: PromptItem[] = [];
  for (const id of ids) {
    const item = foundMap.get(id);
    if (item) {
      result.push(item);
    }
  }

  return result;
}




