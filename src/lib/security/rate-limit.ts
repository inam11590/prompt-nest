/**
 * Lightweight sliding-window rate limiter for Next.js App Router, Route Handlers, and Server Actions.
 * Tracks client request timestamps in an in-memory store keyed by client IP + action namespace.
 * Automatically cleans up expired windows to keep memory usage minimal.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  key?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

// In-memory sliding window storage: key -> array of request timestamps (epoch ms)
const requestStore = new Map<string, number[]>();

// Periodic garbage collection every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of requestStore.entries()) {
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      requestStore.delete(key);
    } else {
      requestStore.set(key, validTimestamps);
    }
  }
}

/**
 * Extracts the client IP address safely from standard proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Checks whether a client has exceeded the allowed request limit within the sliding time window.
 */
export function checkRateLimit(
  headersOrRequest: Headers | Request,
  options: RateLimitOptions
): RateLimitResult {
  const headers =
    headersOrRequest instanceof Headers
      ? headersOrRequest
      : headersOrRequest.headers;

  const clientIp = getClientIp(headers);
  const scope = options.key || "default";
  const rateLimitKey = `${scope}:${clientIp}`;

  const now = Date.now();
  cleanupExpiredEntries(now, options.windowMs);

  const timestamps = requestStore.get(rateLimitKey) || [];
  // Filter out timestamps outside the sliding window
  const windowStart = now - options.windowMs;
  const activeTimestamps = timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= options.limit) {
    const oldest = activeTimestamps[0] || now;
    const resetTime = oldest + options.windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: resetTime,
      retryAfter,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  requestStore.set(rateLimitKey, activeTimestamps);

  const resetTime = (activeTimestamps[0] || now) + options.windowMs;
  const remaining = Math.max(0, options.limit - activeTimestamps.length);

  return {
    success: true,
    limit: options.limit,
    remaining,
    reset: resetTime,
    retryAfter: 0,
  };
}

/**
 * Common rate limiting presets
 */
export const RATE_LIMIT_STRICT: RateLimitOptions = {
  limit: 10,
  windowMs: 60 * 1000, // 10 requests per minute (e.g. mutations, image uploads)
  key: "strict",
};

export const RATE_LIMIT_ENGAGEMENT: RateLimitOptions = {
  limit: 60,
  windowMs: 60 * 1000, // 60 requests per minute (e.g. like, save, view, copy)
  key: "engagement",
};

export const RATE_LIMIT_PUBLIC: RateLimitOptions = {
  limit: 120,
  windowMs: 60 * 1000, // 120 requests per minute (e.g. search, og generator)
  key: "public",
};
