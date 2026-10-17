import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getArticleBySlug,
  getAllPublishedArticleSlugs,
  getRelatedArticles,
} from "@/lib/data/articles";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Clock,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  List,
  User,
  ArrowLeft,
} from "lucide-react";

interface ArticleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  const canonicalUrl = `${siteConfig.url}/blog/${article.slug}`;

  return {
    title: `${article.title} — ${siteConfig.name}`,
    description: article.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${article.title} — ${siteConfig.name}`,
      description: article.excerpt,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "article",
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.lastEditedAt || article.updatedAt,
      authors: article.author?.displayName
        ? [article.author.displayName]
        : ["PromptNest Team"],
      images: article.coverImageUrl
        ? [
            {
              url: article.coverImageUrl,
              alt: article.coverImageAlt || article.title,
              width: article.coverImageWidth || 1200,
              height: article.coverImageHeight || 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} — ${siteConfig.name}`,
      description: article.excerpt,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

async function ArticleDetailContent({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article, 3);
  const canonicalUrl = `${siteConfig.url}/blog/${article.slug}`;

  // Safe JSON-LD Structured Data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteConfig.url,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${siteConfig.url}/blog`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": canonicalUrl,
      },
    ],
  };

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.lastEditedAt || article.updatedAt,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.displayName || article.author.username,
          url: article.author.username
            ? `${siteConfig.url}/creators/${article.author.username}`
            : undefined,
        }
      : {
          "@type": "Organization",
          name: "PromptNest",
        },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-xs text-foreground-muted"
      >
        <Link
          href="/"
          className="hover:text-foreground transition flex items-center gap-1"
        >
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/blog"
          className="hover:text-foreground transition"
        >
          Guides & Articles
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">
          {article.title}
        </span>
      </nav>

      {/* Header Meta */}
      <div className="max-w-4xl mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
          <Link
            href={`/blog?category=${encodeURIComponent(article.category)}`}
            className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand-light border border-brand/20 uppercase tracking-wider text-[11px] hover:bg-brand/20 transition"
          >
            {article.category}
          </Link>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-foreground-muted" />
            {article.readingTimeMinutes} min read
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently published"}
          </span>
          {article.lastEditedAt && article.publishedAt && article.lastEditedAt > article.publishedAt && (
            <span className="text-foreground-muted italic">
              (Updated {new Date(article.lastEditedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })})
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-tight">
          {article.title}
        </h1>

        {/* Lead Excerpt */}
        <p className="text-lg sm:text-xl text-foreground-muted leading-relaxed font-light border-l-2 border-brand/60 pl-4 py-1 italic">
          {article.excerpt}
        </p>
      </div>

      {/* Cover Image */}
      {article.coverImageUrl && (
        <div className="relative mb-12 overflow-hidden rounded-2xl border border-surface-border bg-surface max-w-5xl">
          <div
            className="relative w-full aspect-[16/9] max-h-[500px]"
            style={{
              backgroundColor: article.coverImageDominantColor || "#1e1e24",
            }}
          >
            <Image
              src={article.coverImageUrl}
              alt={article.coverImageAlt || article.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          {article.coverImageAlt && (
            <p className="px-4 py-2 text-xs text-foreground-muted bg-surface/60 border-t border-surface-border">
              {article.coverImageAlt}
            </p>
          )}
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-5xl">
        {/* Main Article Body */}
        <div className="lg:col-span-8 space-y-10">
          <div
            className="prose prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:scroll-mt-24 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-24 prose-p:text-foreground-muted prose-p:leading-relaxed prose-p:text-base prose-li:text-foreground-muted prose-code:text-brand-light prose-code:bg-surface-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-elevated prose-pre:border prose-pre:border-surface-border prose-pre:rounded-xl prose-a:text-brand-light prose-a:underline hover:prose-a:text-brand prose-blockquote:border-brand/40 prose-blockquote:text-foreground-muted"
            dangerouslySetInnerHTML={{ __html: article.htmlContent || "" }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-surface-border flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground-muted mr-1">Tags:</span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-surface px-2.5 py-1 text-xs text-foreground-muted border border-surface-border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Contextual / Featured Prompts Section */}
          {article.associatedPrompts && article.associatedPrompts.length > 0 && (
            <section
              aria-labelledby="featured-prompts-heading"
              className="mt-14 rounded-2xl border border-surface-border bg-surface p-6 sm:p-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-brand-light" />
                <h2
                  id="featured-prompts-heading"
                  className="text-xl font-bold text-foreground"
                >
                  Prompts Featured in this Guide
                </h2>
              </div>
              <p className="text-xs text-foreground-muted mb-6">
                Explore and copy the exact generation prompts and technical parameters referenced above:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {article.associatedPrompts.map((p) => (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between rounded-xl border border-surface-border bg-surface-elevated p-4 transition hover:border-brand/40"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-2">
                        <span className="font-semibold text-brand-light uppercase">
                          {p.category}
                        </span>
                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px]">
                          {p.model}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-brand-light transition">
                        {p.title}
                      </h3>
                      <p className="text-xs text-foreground-muted line-clamp-2 mt-1">
                        {p.shortDescription}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between">
                      <Link
                        href={`/prompts/${p.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-light hover:underline"
                      >
                        Inspect Prompt <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Author Card (if assigned) */}
          {article.author && (
            <div className="rounded-2xl border border-surface-border bg-surface p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {article.author.avatarUrl ? (
                <Image
                  src={article.author.avatarUrl}
                  alt={article.author.displayName || article.author.username || "Author"}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border border-surface-border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated text-foreground-muted border border-surface-border">
                  <User className="h-8 w-8" />
                </div>
              )}
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-brand-light font-semibold">
                  Written by
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {article.author.displayName || `@${article.author.username}`}
                </h3>
                {article.author.username && (
                  <Link
                    href={`/creators/${article.author.username}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-light hover:underline font-medium"
                  >
                    View Creator Profile &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Table of Contents */}
        <aside className="lg:col-span-4 space-y-6">
          {article.toc && article.toc.length > 0 && (
            <div className="sticky top-24 rounded-2xl border border-surface-border bg-surface p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                <List className="h-4 w-4" />
                Table of Contents
              </div>
              <nav className="space-y-1.5 text-xs">
                {article.toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block py-1 text-foreground-muted transition hover:text-foreground ${
                      item.level === 3 ? "pl-3 text-[11px]" : "font-medium"
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-5 border-t border-surface-border">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to All Guides
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <section
          aria-labelledby="related-articles-heading"
          className="mt-20 pt-10 border-t border-surface-border max-w-5xl"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2
                id="related-articles-heading"
                className="text-xl font-bold tracking-tight text-foreground"
              >
                More Guides & Tutorials
              </h2>
              <p className="text-xs text-foreground-muted mt-1">
                Continue expanding your generative AI knowledge base.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-xs font-semibold text-brand-light hover:underline"
            >
              View all articles &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/blog/${rel.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-surface-border bg-surface p-5 hover:border-brand/40 transition"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase text-brand-light">
                    {rel.category}
                  </span>
                  <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-2 group-hover:text-brand-light transition">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-foreground-muted line-clamp-2 mt-2 leading-relaxed">
                    {rel.excerpt}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-border/50 text-[11px] text-foreground-muted flex items-center justify-between">
                  <span>{rel.readingTimeMinutes} min read</span>
                  <span className="font-semibold text-brand-light group-hover:underline">
                    Read guide &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default function ArticleDetailPage(props: ArticleDetailPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-foreground-muted">
              Loading guide...
            </div>
          }
        >
          <ArticleDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
