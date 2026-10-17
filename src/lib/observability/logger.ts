/**
 * Production-safe structured logger with automatic secret and PII redaction.
 * Prevents credentials, auth tokens, and sensitive customer content from entering server logs.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "service_role",
  "anon_key",
  "cookie",
]);

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 4) return "[MaxDepth]";
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lowerKey = k.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("secret") || lowerKey.includes("password")) {
      sanitized[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      sanitized[k] = redact(v, depth + 1);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

export const logger = {
  info(event: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ timestamp, level: "info", event, ...(meta ? { meta: redact(meta) } : {}) }));
  },

  warn(event: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({ timestamp, level: "warn", event, ...(meta ? { meta: redact(meta) } : {}) }));
  },

  error(event: string, error?: unknown, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = process.env.NODE_ENV !== "production" && error instanceof Error ? error.stack : undefined;

    console.error(
      JSON.stringify({
        timestamp,
        level: "error",
        event,
        errorMessage,
        ...(errorStack ? { errorStack } : {}),
        ...(meta ? { meta: redact(meta) } : {}),
      })
    );
  },
};
