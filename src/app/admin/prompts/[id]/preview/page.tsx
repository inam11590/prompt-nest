import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getPromptByIdAdmin } from "@/lib/data/prompts";
import { ImageModal } from "@/components/ImageModal";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import {
  ArrowLeft,
  Edit3,
  Sparkles,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Archive,
} from "lucide-react";

export const metadata: Metadata = {
  title: `Admin Preview — ${siteConfig.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminPreviewPageProps {
  params: Promise<{ id: string }>;
}

const categoryLabels: Record<string, string> = {
  photography: "Photography",
  "digital-art": "Digital Art",
  architecture: "Architecture",
  "character-design": "Character Design",
  nature: "Nature",
  "graphic-design": "Graphic Design",
  cricket: "Cricket",
};

async function PreviewContent({ params }: AdminPreviewPageProps) {
  const { id } = await params;
  const prompt = await getPromptByIdAdmin(id);

  if (!prompt) {
    notFound();
  }

  const status = prompt.status || "draft";
  const formattedDate = new Date(prompt.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Admin Preview Header Banner */}
      <div className="sticky top-16 z-30 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-amber-300">
                ADMIN PREVIEW MODE
              </span>
              <span className="text-xs text-foreground-muted">•</span>
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize border">
                {status === "published" && (
                  <span className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Published
                  </span>
                )}
                {status === "draft" && (
                  <span className="bg-amber-500/10 text-amber-400 border-amber-500/20 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Draft (Hidden from Public)
                  </span>
                )}
                {status === "archived" && (
                  <span className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 inline-flex items-center gap-1">
                    <Archive className="h-3 w-3" /> Archived
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/prompts/${prompt.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Prompt
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Visual Showcase (Left Column) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <ImageModal
                src={prompt.imageUrl}
                alt={prompt.imageAlt}
                width={prompt.width}
                height={prompt.height}
                aspectRatioValue={prompt.aspectRatioValue}
                dominantColor={prompt.dominantColor}
              />

              <div className="flex items-center justify-between text-xs text-text-faint px-1">
                <span>Photo by {prompt.sourceAttribution.author}</span>
                <a
                  href={prompt.sourceAttribution.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-text-muted hover:underline"
                >
                  <span>{prompt.sourceAttribution.source}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Prompt Details (Right Column) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Category, Model, and Date */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-semibold text-foreground">
                    {categoryLabels[prompt.category] || prompt.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
                    <Sparkles className="h-3 w-3" />
                    <span>{prompt.model}</span>
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs text-text-faint">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </span>
              </div>

              {/* Title & Short Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                  {prompt.title}
                </h1>
                <p className="text-sm leading-relaxed text-text-muted">
                  {prompt.shortDescription}
                </p>
              </div>

              {/* Full Prompt Card */}
              <div className="rounded-2xl border border-surface-border bg-surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-faint">
                    Full Prompt
                  </span>
                  <CopyPromptButton promptText={prompt.prompt} />
                </div>
                <div className="rounded-xl border border-surface-border/60 bg-surface-raised p-4">
                  <p className="font-mono text-xs sm:text-sm leading-relaxed text-foreground select-all whitespace-pre-wrap">
                    {prompt.prompt}
                  </p>
                </div>
              </div>

              {/* Negative Prompt if present */}
              {prompt.negativePrompt && (
                <div className="rounded-2xl border border-surface-border bg-surface p-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-faint">
                    Negative Prompt
                  </span>
                  <div className="rounded-xl border border-surface-border/60 bg-surface-raised p-3">
                    <p className="font-mono text-xs text-foreground select-all whitespace-pre-wrap">
                      {prompt.negativePrompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Compatible Models */}
              {prompt.compatibleModels && prompt.compatibleModels.length > 0 && (
                <div className="rounded-2xl border border-surface-border bg-surface p-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-faint">
                    Compatible AI Models
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {prompt.compatibleModels.map((m) => (
                      <span
                        key={m}
                        className="rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-foreground font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface border border-surface-border px-2 py-0.5 text-xs text-text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPreviewPage(props: AdminPreviewPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-foreground-muted animate-pulse">
              Loading admin preview...
            </p>
          </div>
        </div>
      }
    >
      <PreviewContent {...props} />
    </Suspense>
  );
}
