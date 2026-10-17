import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { getPublishedArticles } from "@/lib/data/articles";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    page?: string;
  }>;
}

const CATEGORIES = [
  { value: "all", label: "All Topics" },
  { value: "guide", label: "Guides" },
  { value: "tutorial", label: "Tutorials" },
  { value: "prompt-engineering", label: "Prompt Engineering" },
  { value: "case-study", label: "Case Studies" },
  { value: "overview", label: "Overviews" },
];

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const isFiltered = Boolean(resolved.category && resolved.category !== "all") || Boolean(resolved.q);
  const page = parseInt(resolved.page || "1", 10);

  const canonicalUrl =
    page > 1 && !isFiltered
      ? `${siteConfig.url}/blog?page=${page}`
      : `${siteConfig.url}/blog`;

  return {
    title: `Guides & Tutorials — ${siteConfig.name}`,
    description:
      "Comprehensive AI prompt engineering guides, model comparisons, visual case studies, and tutorials for Midjourney, FLUX, Stable Diffusion, and DALL-E.",
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isFiltered
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: `Guides & Tutorials — ${siteConfig.name}`,
      description:
        "Comprehensive AI prompt engineering guides, model comparisons, visual case studies, and tutorials.",
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Guides & Tutorials — ${siteConfig.name}`,
      description:
        "Comprehensive AI prompt engineering guides, model comparisons, visual case studies, and tutorials.",
    },
  };
}

async function BlogContent({ searchParams }: BlogPageProps) {
  const resolved = await searchParams;
  const currentCategory = resolved.category || "all";
  const query = resolved.q || "";
  const currentPage = Math.max(1, parseInt(resolved.page || "1", 10));
  const pageSize = 9;

  const { articles, total } = await getPublishedArticles({
    category: currentCategory,
    query,
    page: currentPage,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-light">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Prompt Engineering Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
          Guides & Tutorials
        </h1>
        <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
          Master the craft of visual AI prompt engineering with in-depth breakdowns, lighting controls, camera angles, and model-specific nuances.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-surface-border pb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.value;
            const searchParamsObj = new URLSearchParams();
            if (cat.value !== "all") searchParamsObj.set("category", cat.value);
            if (query) searchParamsObj.set("q", query);
            const href = `/blog${searchParamsObj.toString() ? `?${searchParamsObj.toString()}` : ""}`;

            return (
              <Link
                key={cat.value}
                href={href}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-brand text-white shadow-md shadow-brand/20"
                    : "bg-surface text-foreground-muted hover:bg-surface-elevated hover:text-foreground border border-surface-border"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Search Input */}
        <form
          action="/blog"
          method="GET"
          className="relative w-full md:w-72"
        >
          {currentCategory !== "all" && (
            <input type="hidden" name="category" value={currentCategory} />
          )}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search guides..."
            className="w-full rounded-xl border border-surface-border bg-surface pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </form>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface p-16 text-center max-w-md mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated border border-surface-border text-foreground-muted">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No articles found
          </h3>
          <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
            {query || currentCategory !== "all"
              ? "Try adjusting your search query or selecting a different topic."
              : "Check back soon for new in-depth guides and prompt tutorials."}
          </p>
          {(query || currentCategory !== "all") && (
            <Link
              href="/blog"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-light hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-border bg-surface hover:border-brand/40 transition-all duration-200 hover:shadow-lg hover:shadow-brand/5"
            >
              <div>
                {/* Cover Image */}
                <Link
                  href={`/blog/${article.slug}`}
                  className="relative block aspect-[16/9] w-full overflow-hidden bg-surface-elevated"
                  style={{
                    backgroundColor: article.coverImageDominantColor || "#1e1e24",
                  }}
                >
                  {article.coverImageUrl ? (
                    <Image
                      src={article.coverImageUrl}
                      alt={article.coverImageAlt || article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-foreground-muted">
                      <BookOpen className="h-10 w-10 opacity-30" />
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  {/* Category and Reading Time */}
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-light uppercase tracking-wider border border-brand/20">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      {article.readingTimeMinutes} min read
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-brand-light transition line-clamp-2">
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="text-xs text-foreground-muted leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Footer Attribution / Date */}
              <div className="border-t border-surface-border/60 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs text-foreground-muted">
                {article.author ? (
                  <div className="flex items-center gap-2">
                    {article.author.avatarUrl ? (
                      <Image
                        src={article.author.avatarUrl}
                        alt={article.author.displayName || article.author.username || "Author"}
                        width={22}
                        height={22}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-surface-elevated text-foreground-muted">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                    <span className="font-medium text-foreground text-[11px] truncate max-w-[120px]">
                      {article.author.displayName || `@${article.author.username}`}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-foreground-muted">
                    PromptNest Team
                  </span>
                )}

                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar className="h-3 w-3" />
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8 border-t border-surface-border">
          {currentPage > 1 ? (
            <Link
              href={`/blog?${new URLSearchParams({
                ...(currentCategory !== "all" && { category: currentCategory }),
                ...(query && { q: query }),
                page: String(currentPage - 1),
              }).toString()}`}
              className="inline-flex items-center gap-1 rounded-xl border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl border border-surface-border/40 bg-surface/40 px-3 py-1.5 text-xs font-semibold text-foreground-muted/40 cursor-not-allowed">
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </span>
          )}

          <span className="px-3 text-xs text-foreground-muted font-medium">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link
              href={`/blog?${new URLSearchParams({
                ...(currentCategory !== "all" && { category: currentCategory }),
                ...(query && { q: query }),
                page: String(currentPage + 1),
              }).toString()}`}
              className="inline-flex items-center gap-1 rounded-xl border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl border border-surface-border/40 bg-surface/40 px-3 py-1.5 text-xs font-semibold text-foreground-muted/40 cursor-not-allowed">
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function BlogPage(props: BlogPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-foreground-muted">
              Loading articles...
            </div>
          }
        >
          <BlogContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
