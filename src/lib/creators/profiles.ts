import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface CreatorProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorDirectoryItem extends CreatorProfile {
  username: string; // Guaranteed non-null for directory
  publishedCount: number;
}

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "creators",
  "creator",
  "settings",
  "dashboard",
  "api",
  "login",
  "signup",
  "prompts",
  "prompt",
  "saved",
  "account",
  "auth",
  "null",
  "undefined",
  "root",
  "help",
  "about",
  "privacy",
  "terms",
  "explore",
  "new",
  "edit",
  "preview",
]);

/**
 * Normalizes username input (lowercased, trimmed).
 */
export function normalizeUsername(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * Validates username syntax, length, and reservation rules.
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const normalized = normalizeUsername(username);

  if (normalized.length < 3 || normalized.length > 30) {
    return {
      valid: false,
      error: "Username must be between 3 and 30 characters in length.",
    };
  }

  if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
    return {
      valid: false,
      error: "Username can only contain lowercase letters, numbers, and underscores.",
    };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      valid: false,
      error: `The username "${normalized}" is reserved by the application and cannot be used.`,
    };
  }

  return { valid: true };
}

/**
 * Validates display name length.
 */
export function validateDisplayName(name?: string | null): { valid: boolean; error?: string } {
  if (!name) return { valid: true };
  if (name.length > 50) {
    return { valid: false, error: "Display name cannot exceed 50 characters." };
  }
  return { valid: true };
}

/**
 * Validates biography length.
 */
export function validateBio(bio?: string | null): { valid: boolean; error?: string } {
  if (!bio) return { valid: true };
  if (bio.length > 500) {
    return { valid: false, error: "Biography cannot exceed 500 characters." };
  }
  return { valid: true };
}

/**
 * Validates website URL (must be HTTPS scheme and valid URL syntax).
 */
export function validateWebsiteUrl(url?: string | null): { valid: boolean; error?: string } {
  if (!url || url.trim() === "") return { valid: true };
  const trimmed = url.trim();

  if (trimmed.length > 200) {
    return { valid: false, error: "Website URL cannot exceed 200 characters." };
  }

  if (!trimmed.startsWith("https://")) {
    return { valid: false, error: "Website URL must use a secure HTTPS scheme (e.g. https://example.com)." };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Website URL must use the https:// protocol." };
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { valid: false, error: "Website URL must include a valid top-level domain." };
    }
  } catch {
    return { valid: false, error: "Website URL is not a valid URL structure." };
  }

  return { valid: true };
}

/**
 * Maps a database profile row to a CreatorProfile object.
 */
export function mapProfileRowToCreator(row: ProfileRow): CreatorProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    websiteUrl: row.website_url,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches the currently authenticated user's profile.
 */
export async function getCurrentUserProfile(): Promise<CreatorProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfileRowToCreator(data);
}

/**
 * Resolves an active public creator profile by username.
 * Returns null if not found or if is_public = false.
 */
export async function getCreatorProfileByUsername(
  username: string
): Promise<CreatorProfile | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const normalized = normalizeUsername(username);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", normalized)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRowToCreator(data);
}

/**
 * Retrieves public creators for the directory.
 * Rules: Must have is_public = true AND at least one currently published prompt.
 */
export async function getPublicCreators(options: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{ creators: CreatorDirectoryItem[]; total: number }> {
  const { page = 1, pageSize = 12 } = options;
  const supabase = createPublicClient();

  if (!supabase) {
    return { creators: [], total: 0 };
  }

  // 1. Fetch public profiles with usernames
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_public", true)
    .not("username", "is", null);

  if (profileErr || !profiles || profiles.length === 0) {
    return { creators: [], total: 0 };
  }

  // 2. Fetch published prompt counts grouped by author_id
  const authorIds = profiles.map((p) => p.id);
  const { data: promptCounts, error: promptErr } = await supabase
    .from("prompts")
    .select("author_id")
    .in("author_id", authorIds)
    .eq("published", true);

  if (promptErr) {
    console.warn("Error fetching prompt counts for creators:", promptErr);
  }

  const countMap = new Map<string, number>();
  for (const item of promptCounts || []) {
    if (item.author_id) {
      countMap.set(item.author_id, (countMap.get(item.author_id) || 0) + 1);
    }
  }

  // 3. Filter to only creators with at least 1 published prompt
  const activeCreators: CreatorDirectoryItem[] = [];
  for (const p of profiles) {
    const publishedCount = countMap.get(p.id) || 0;
    if (publishedCount > 0 && p.username) {
      activeCreators.push({
        ...mapProfileRowToCreator(p),
        username: p.username,
        publishedCount,
      });
    }
  }

  // Sort descending by publishedCount, then username alphabetically
  activeCreators.sort((a, b) => {
    if (b.publishedCount !== a.publishedCount) {
      return b.publishedCount - a.publishedCount;
    }
    return a.username.localeCompare(b.username);
  });

  const total = activeCreators.length;
  const fromIndex = (page - 1) * pageSize;
  const paginated = activeCreators.slice(fromIndex, fromIndex + pageSize);

  return {
    creators: paginated,
    total,
  };
}
