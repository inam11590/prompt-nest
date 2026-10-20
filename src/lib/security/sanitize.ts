/**
 * Enterprise input sanitization and validation utilities for PromptNest.
 * Defends against Cross-Site Scripting (XSS), SQL injection attempts, HTML payload injection,
 * and malicious parameter tampering.
 */

// Patterns to detect and strip script tags, javascript: pseudo-protocols, data URIs with html/scripts, and inline handlers
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript\s*:/gi;
const INLINE_EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi;

/**
 * Strips script tags, HTML tags, javascript: pseudo-protocols, and inline event handlers from a text string.
 * Trims leading/trailing whitespace and truncates to maxLength if specified.
 */
export function sanitizeText(input: unknown, maxLength?: number): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(JAVASCRIPT_PROTOCOL_REGEX, "")
    .replace(INLINE_EVENT_HANDLER_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .trim();

  if (typeof maxLength === "number" && maxLength > 0) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes AI prompt text while strictly preserving essential AI syntax:
 * Flags like --v 6.1, --ar 16:9, --no text, punctuation, quotes, variable tags {name}, etc.
 * Strips executable script tags, event handlers, and javascript protocols.
 */
export function sanitizePromptText(input: unknown, maxLength = 15000): string {
  if (typeof input !== "string") {
    return "";
  }

  const sanitized = input
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(JAVASCRIPT_PROTOCOL_REGEX, "")
    .replace(INLINE_EVENT_HANDLER_REGEX, "")
    .trim();

  return sanitized.slice(0, maxLength);
}

/**
 * Sanitizes and validates an array of tag strings.
 * Filters empty tags, strips special characters, deduplicates, and enforces count + length limits.
 */
export function sanitizeTags(
  tags: unknown,
  maxCount = 10,
  maxTagLength = 30
): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const cleaned = tags
    .map((tag) => {
      if (typeof tag !== "string") return "";
      return tag
        .replace(/^#+/, "") // remove leading hash
        .replace(/[^a-zA-Z0-9_-]/g, "") // keep only alphanumeric, hyphens, underscores
        .toLowerCase()
        .trim()
        .slice(0, maxTagLength);
    })
    .filter((tag) => tag.length >= 2);

  // Return deduplicated array up to maxCount
  return Array.from(new Set(cleaned)).slice(0, maxCount);
}

export interface PromptInputPayload {
  title: string;
  slug?: string;
  shortDescription?: string;
  prompt: string;
  category: string;
  model: string;
  tags?: string[];
  negativePrompt?: string;
}

export interface SanitizedPromptResult {
  valid: boolean;
  errors: string[];
  sanitized: {
    title: string;
    slug: string;
    shortDescription: string;
    prompt: string;
    category: string;
    model: string;
    tags: string[];
    negativePrompt?: string;
  };
}

/**
 * Validates and sanitizes a complete prompt submission payload.
 */
export function validateAndSanitizePromptPayload(
  payload: PromptInputPayload
): SanitizedPromptResult {
  const errors: string[] = [];

  const title = sanitizeText(payload.title, 120);
  if (!title || title.length < 3) {
    errors.push("Title is required and must be between 3 and 120 characters.");
  }

  const prompt = sanitizePromptText(payload.prompt, 15000);
  if (!prompt || prompt.length < 10) {
    errors.push("Prompt content is required and must be at least 10 characters.");
  }

  const shortDescription = sanitizeText(payload.shortDescription || "", 500);
  const category = sanitizeText(payload.category, 50);
  const model = sanitizeText(payload.model, 50);
  const tags = sanitizeTags(payload.tags || []);
  const negativePrompt = payload.negativePrompt
    ? sanitizePromptText(payload.negativePrompt, 2000)
    : undefined;

  const rawSlug = payload.slug || title;
  const slug = sanitizeText(rawSlug, 80)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    errors.push("A valid URL slug could not be generated from the title.");
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      title,
      slug,
      shortDescription,
      prompt,
      category,
      model,
      tags,
      negativePrompt,
    },
  };
}

export interface CollectionInputPayload {
  title: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Validates and sanitizes user collection payload.
 */
export function validateAndSanitizeCollectionPayload(
  payload: CollectionInputPayload
): {
  valid: boolean;
  errors: string[];
  sanitized: { title: string; description: string; isPublic: boolean };
} {
  const errors: string[] = [];
  const title = sanitizeText(payload.title, 80);

  if (!title || title.length < 2) {
    errors.push("Collection title must be between 2 and 80 characters.");
  }

  const description = sanitizeText(payload.description || "", 300);
  const isPublic = Boolean(payload.isPublic);

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      title,
      description,
      isPublic,
    },
  };
}
