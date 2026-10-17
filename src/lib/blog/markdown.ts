import { marked } from "marked";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Escapes unsafe HTML characters to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validates link URLs to ensure only safe schemes are allowed.
 * Rejects javascript:, data:, vbscript:, and relative traversal.
 */
function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Internal relative links
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    // Prevent protocol relative "//"
    return !trimmed.startsWith("//");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

/**
 * Sanitizes heading text into a collision-resistant HTML id.
 */
function generateHeadingId(text: string, index: number): string {
  const clean = text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return `heading-${clean || "section"}-${index}`;
}

export interface RenderedArticle {
  html: string;
  toc: TocItem[];
}

/**
 * Server-renders safe, constrained markdown into HTML.
 * Strictly disables raw HTML, validates link protocols, and extracts Table of Contents.
 */
export function renderArticleMarkdown(markdownContent: string): RenderedArticle {
  const toc: TocItem[] = [];
  let headingCounter = 0;

  const renderer = new marked.Renderer();

  // 1. Headings: sanitize text, prevent ID collisions, map h1 to h2 (since article title is primary h1)
  renderer.heading = ({ tokens, depth }) => {
    const text = marked.parseInline(tokens.map((t) => t.raw).join("")) as string;
    const plainText = text.replace(/<[^>]*>/g, "").trim();

    // Map h1 from markdown to h2, preserve h2-h4
    const targetDepth = depth === 1 ? 2 : Math.min(depth, 4);
    headingCounter++;
    const id = generateHeadingId(plainText, headingCounter);

    if (targetDepth === 2 || targetDepth === 3) {
      toc.push({
        id,
        text: plainText,
        level: targetDepth,
      });
    }

    return `<h${targetDepth} id="${id}" class="article-heading scroll-mt-24 font-bold tracking-tight text-white ${
      targetDepth === 2 ? "text-xl sm:text-2xl mt-10 mb-4 pt-4 border-t border-surface-border" : "text-lg sm:text-xl mt-6 mb-3 text-slate-200"
    }">${text}</h${targetDepth}>`;
  };

  // 2. Links: enforce safe protocol, open external links safely
  renderer.link = ({ href, title, tokens }) => {
    const text = marked.parseInline(tokens.map((t) => t.raw).join("")) as string;
    if (!isSafeUrl(href)) {
      return text; // Disarm unsafe link schemes like javascript:
    }

    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const relAttr = isExternal ? ' rel="noopener noreferrer"' : "";
    const targetAttr = isExternal ? ' target="_blank"' : "";

    return `<a href="${escapeHtml(href)}"${titleAttr}${relAttr}${targetAttr} class="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-medium transition-colors">${text}</a>`;
  };

  // 3. Fenced Code Blocks: safely escape content, provide accessible wrapper
  renderer.code = ({ text, lang }) => {
    const escaped = escapeHtml(text);
    const langLabel = lang ? `<span class="text-[10px] font-mono uppercase tracking-wider text-foreground-muted select-none">${escapeHtml(lang)}</span>` : "";

    return `<div class="my-6 rounded-2xl border border-surface-border bg-surface-raised overflow-hidden shadow-sm">
      ${langLabel ? `<div class="px-4 py-2 border-b border-surface-border bg-surface/60 flex items-center justify-between">${langLabel}</div>` : ""}
      <pre class="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[32rem]"><code>${escaped}</code></pre>
    </div>`;
  };

  // 4. Inline code: escape content
  renderer.codespan = ({ text }) => {
    return `<code class="rounded-md border border-surface-border bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] text-indigo-300">${escapeHtml(text)}</code>`;
  };

  // 5. Blockquotes: clean styling
  renderer.blockquote = ({ tokens }) => {
    const body = marked.parse(tokens.map((t) => t.raw).join("")) as string;
    return `<blockquote class="my-6 border-l-2 border-indigo-500 pl-4 py-1 italic text-foreground-muted text-sm leading-relaxed">${body}</blockquote>`;
  };

  // 6. Paragraphs
  renderer.paragraph = ({ tokens }) => {
    const body = marked.parseInline(tokens.map((t) => t.raw).join("")) as string;
    return `<p class="my-4 text-sm sm:text-base text-foreground-muted leading-relaxed">${body}</p>`;
  };

  // 7. Lists
  renderer.list = ({ ordered, items }) => {
    const tag = ordered ? "ol" : "ul";
    const listClass = ordered ? "list-decimal pl-6 my-4 space-y-2 text-sm sm:text-base text-foreground-muted" : "list-disc pl-6 my-4 space-y-2 text-sm sm:text-base text-foreground-muted";
    const content = items.map((item) => `<li>${marked.parseInline(item.tokens.map((t) => t.raw).join("")) as string}</li>`).join("");
    return `<${tag} class="${listClass}">${content}</${tag}>`;
  };

  // 8. Raw HTML disablement: escape all raw HTML tags
  renderer.html = ({ text }) => {
    return escapeHtml(text);
  };

  const html = marked.parse(markdownContent, {
    renderer,
    gfm: true,
    breaks: false,
    async: false,
  }) as string;

  return { html, toc };
}
