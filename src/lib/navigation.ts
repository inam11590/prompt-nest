/**
 * Validates whether a return path is a safe, allowed same-origin gallery destination.
 * Rejects external, protocol-relative, malformed, or unauthorized paths.
 */
export function sanitizeReturnUrl(returnUrl?: string | null): string {
  if (!returnUrl || typeof returnUrl !== "string") {
    return "/#gallery";
  }

  const trimmed = returnUrl.trim();

  // Reject protocol-relative URLs (e.g. //attacker.com) and javascript: / data: schemes
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("\\\\") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return "/#gallery";
  }

  // Must begin with /
  if (!trimmed.startsWith("/")) {
    return "/#gallery";
  }

  try {
    // Parse using a dummy origin to inspect path and query
    const parsed = new URL(trimmed, "http://localhost");

    // Only allow root path "/" with optional query and hash
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      return "/#gallery";
    }

    // Verify allowed query parameters: only q, category, model, sort, page are legitimate gallery state
    const safeParams = new URLSearchParams();
    const allowedKeys = ["q", "category", "model", "sort", "page"];

    for (const key of allowedKeys) {
      const val = parsed.searchParams.get(key);
      if (val !== null && val.trim() !== "") {
        safeParams.set(key, val.trim());
      }
    }

    const queryString = safeParams.toString();
    const hash = parsed.hash === "#gallery" ? "#gallery" : "#gallery";

    return queryString ? `/?${queryString}${hash}` : `/${hash}`;
  } catch {
    return "/#gallery";
  }
}
