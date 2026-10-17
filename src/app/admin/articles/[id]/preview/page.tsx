import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleByIdAdmin } from "@/lib/data/articles";
import { renderArticleMarkdown } from "@/lib/blog/markdown";
import { getPromptsByIds } from "@/lib/data/prompts";
import {
  ArrowLeft,
  Edit,
  Eye,
  Clock,
  Calendar,
  Sparkles,
  ExternalLink,
  List,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Article Preview — PromptNest",
  robots: {
    index: false,
    follow: false,
  },
};

interface PreviewArticlePageProps {
  params: Promise<{ id: string }>;
}

async function PreviewContent({ params }: PreviewArticlePageProps) {
  const { id } = await params;
  const articleResult = await getArticleByIdAdmin(id);

  if (!articleResult) {
    notFound();
  }

  const { article, promptIds } = articleResult;

  // Render markdown server-side safely
  const { html, toc } = renderArticleMarkdown(article.content);

  // Fetch associated prompt details if any
  const associatedPrompts =
    promptIds.length > 0 ? await getPromptsByIds(promptIds) : [];

  return (
    <div className="min-h-screen pb-20">
      {/* Admin Preview Floating/Prominent Banner */}
      <div className="sticky top-0 z-40 border-b border-amber-500/30 bg-amber-950/80 backdrop-blur-md px-4 py-3 text-amber-200 shadow-md">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
              <Eye className="h-4 w-4" />
              Admin Preview Mode
            </span>
            <span className="text-amber-400/60">—</span>
            <span className="text-amber-300/90">
              Not visible to public unless published.
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                article.status === "PUBLISHED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : article.status === "DRAFT"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-neutral-500/20 text-neutral-300 border border-neutral-500/30"
              }`}
            >
              Status: {article.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/articles/${article.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 font-medium text-amber-200 transition hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Article
            </Link>
            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-1 rounded-lg bg-surface/80 px-3 py-1.5 font-medium text-foreground-muted transition hover:bg-surface border border-surface-border"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Articles
            </Link>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Category & Metadata header */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
          <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand-light border border-brand/20 uppercase tracking-wider text-[11px]">
            {article.category}
          </span>
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
              : "Draft (not published)"}
          </span>
        </div>

        {/* Article Title */}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Lead Excerpt */}
        <p className="text-lg sm:text-xl text-foreground-muted leading-relaxed mb-8 font-light border-l-2 border-brand/50 pl-4 py-1 italic">
          {article.excerpt}
        </p>

        {/* Optional Cover Image */}
        {article.coverImageUrl && (
          <div className="relative mb-10 overflow-hidden rounded-2xl border border-surface-border bg-surface">
            <div
              className="relative w-full aspect-[16/9] max-h-[460px]"
              style={{
                backgroundColor: article.coverImageDominantColor || "#1e1e24",
              }}
            >
              <Image
                src={article.coverImageUrl}
                alt={article.coverImageAlt || article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            {article.coverImageAlt && (
              <p className="px-4 py-2 text-xs text-foreground-muted bg-surface/50 border-t border-surface-border">
                {article.coverImageAlt}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Body */}
          <div className="lg:col-span-8">
            <div
              className="prose prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-p:text-foreground-muted prose-p:leading-relaxed prose-li:text-foreground-muted prose-code:text-brand-light prose-code:bg-surface-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-elevated prose-pre:border prose-pre:border-surface-border prose-a:text-brand-light prose-a:underline hover:prose-a:text-brand prose-blockquote:border-brand/40 prose-blockquote:text-foreground-muted"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-surface-border flex flex-wrap items-center gap-2">
                <span className="text-xs text-foreground-muted mr-2">Tags:</span>
                {article.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-surface px-2.5 py-1 text-xs text-foreground-muted border border-surface-border"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Associated Prompts Section */}
            {associatedPrompts.length > 0 && (
              <div className="mt-14 rounded-2xl border border-surface-border bg-surface p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-brand-light" />
                  <h3 className="text-xl font-bold text-foreground">
                    Featured Prompts in this Guide
                  </h3>
                </div>
                <p className="text-sm text-foreground-muted mb-6">
                  Ready-to-use prompts highlighted and referenced throughout this guide:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {associatedPrompts.map((p) => (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between rounded-xl border border-surface-border bg-surface-elevated p-4 transition hover:border-brand/40"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-2">
                          <span className="font-semibold text-brand-light uppercase">
                            {p.category}
                          </span>
                          <span className="rounded bg-surface px-1.5 py-0.5">
                            {p.model}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-brand-light transition">
                          {p.title}
                        </h4>
                        <p className="text-xs text-foreground-muted line-clamp-2 mt-1">
                          {p.shortDescription}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between">
                        <Link
                          href={`/prompts/${p.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-light hover:underline"
                        >
                          View Prompt <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Table of Contents Sidebar */}
          {toc.length > 0 && (
            <aside className="lg:col-span-4">
              <div className="sticky top-20 rounded-2xl border border-surface-border bg-surface p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                  <List className="h-4 w-4" />
                  Table of Contents
                </div>
                <nav className="space-y-1 text-sm">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1 text-foreground-muted transition hover:text-foreground ${
                        item.level === 3 ? "pl-4 text-xs" : "font-medium"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </article>
    </div>
  );
}

export default function PreviewArticlePage(props: PreviewArticlePageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-foreground-muted">
          Loading article preview...
        </div>
      }
    >
      <PreviewContent {...paramsToProp(props)} />
    </Suspense>
  );
}

function paramsToProp(props: PreviewArticlePageProps) {
  return props;
}
