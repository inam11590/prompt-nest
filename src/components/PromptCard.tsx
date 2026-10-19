"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ImageOff,
  Eye,
  Heart,
  Ratio,
  FolderPlus,
} from "lucide-react";
import type { PromptItem } from "@/data/prompts";
import { BookmarkButton } from "@/components/BookmarkButton";
import { LikeButton } from "@/components/LikeButton";
import { SaveToCollectionModal } from "@/components/collections/save-to-collection-modal";
import { incrementPromptCopyAction } from "@/app/actions/engagement";

interface PromptCardProps {
  prompt: PromptItem;
  priority?: boolean;
  returnQuery?: string;
  isBookmarked?: boolean;
  isAuthenticated?: boolean;
  rankBadge?: {
    rank: number;
    badgeStyle?: string;
  };
}

export function PromptCard({
  prompt,
  priority = false,
  returnQuery = "",
  isBookmarked = false,
  isAuthenticated = false,
  rankBadge,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const detailHref = returnQuery
    ? `/prompts/${prompt.slug}?from=${encodeURIComponent(returnQuery)}`
    : `/prompts/${prompt.slug}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt.prompt);
      } else {
        const ta = document.createElement("textarea");
        ta.value = prompt.prompt;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setCopyFailed(false);
      incrementPromptCopyAction(prompt.id).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy prompt:", err);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  const categoryLabels: Record<string, string> = {
    photography: "Photography",
    "digital-art": "Digital Art",
    architecture: "Architecture",
    "character-design": "Character Design",
    nature: "Nature",
    "graphic-design": "Graphic & UI",
    portraits: "Portraits",
    "food-product": "Food & Product",
    "fashion-cinematic": "Fashion & Cinematic",
    "sports-portraits": "Cricket & Sports",
    "cinematic-portraits": "Cinematic Portraits",
    "editorial-portraits": "Professional Editorial",
    "streetwear-fashion": "Streetwear & Fashion",
    "outdoor-travel": "Outdoor & Travel",
  };

  // Deterministic metrics for zero layout shift and consistent UI
  const metrics = useMemo(() => {
    if (
      typeof prompt.viewsCount === "number" &&
      typeof prompt.likesCount === "number" &&
      typeof prompt.copiesCount === "number"
    ) {
      const views =
        prompt.viewsCount >= 1000
          ? `${(prompt.viewsCount / 1000).toFixed(1)}k`
          : `${prompt.viewsCount}`;
      return {
        views,
        likes: prompt.likesCount,
        copies: prompt.copiesCount,
      };
    }
    const hash = prompt.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const views = (((hash * 13) % 40) + 12) / 10;
    const likes = ((hash * 7) % 160) + 24;
    const copies = ((hash * 5) % 85) + 18;
    return {
      views: `${views.toFixed(1)}k`,
      likes,
      copies,
    };
  }, [prompt]);

  // Clean aspect ratio representation e.g. "9:16", "2:3", "1:1", "16:9"
  const ratioLabel = useMemo(() => {
    if (!prompt.aspectRatioValue) return "4:5";
    return prompt.aspectRatioValue.replace("/", ":");
  }, [prompt.aspectRatioValue]);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-black/30 break-inside-avoid mb-5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent"
      style={{
        backgroundColor: prompt.dominantColor || "var(--surface)",
      }}
    >
      {/* Accessible live region for copy confirmation */}
      <div className="sr-only" aria-live="polite">
        {copied ? `Copied prompt: ${prompt.title}` : ""}
      </div>

      {/* Primary Clickable Link targeting /prompts/[slug] */}
      <Link
        href={detailHref}
        className="block relative w-full overflow-hidden focus:outline-none"
        aria-label={`View prompt details for ${prompt.title}`}
      >
        {/* Aspect Ratio Container for Strict Layout Stability (Zero CLS) */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: prompt.aspectRatioValue || "4/5",
          }}
        >
          {/* Skeleton Shimmer before image finishes loading */}
          {!imgLoaded && !imgError && (
            <div
              className="absolute inset-0 bg-surface-raised overflow-hidden"
              style={{ backgroundColor: prompt.dominantColor }}
            >
              <div className="absolute inset-0 shimmer-sweep bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          )}

          {!imgError ? (
            <Image
              src={prompt.imageUrl}
              alt={prompt.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              priority={priority}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`object-cover transition-all duration-500 ease-out group-hover:scale-[1.03] ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-raised text-text-faint p-4 text-center">
              <ImageOff className="h-8 w-8 mb-2 opacity-60" />
              <span className="text-xs">Preview unavailable</span>
            </div>
          )}

          {/* Vignette Overlay for Crisp Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15 opacity-75 transition-opacity group-hover:opacity-85" />

          {/* Top Floating Glass Badges: Model & Ratio on Left, Actions on Right */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Rank Badge for Trending Leaderboard */}
              {rankBadge && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-black tracking-tight shadow-md backdrop-blur-md pointer-events-none ${
                    rankBadge.badgeStyle ||
                    (rankBadge.rank === 1
                      ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black border border-amber-300 shadow-amber-500/20"
                      : rankBadge.rank === 2
                      ? "bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 text-zinc-900 border border-slate-300 shadow-zinc-500/20"
                      : rankBadge.rank === 3
                      ? "bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-800 text-white border border-amber-600/50 shadow-amber-900/30"
                      : "bg-surface-raised/90 text-text-muted border border-surface-border")
                  }`}
                >
                  #{rankBadge.rank}
                </span>
              )}

              {/* AI Model Badge */}
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-indigo-400/30 shadow-sm pointer-events-none">
                <Sparkles className="h-3 w-3" />
                <span>{prompt.model}</span>
              </span>

              {/* Aspect Ratio Badge */}
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-mono font-semibold text-white/90 backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
                <Ratio className="h-2.5 w-2.5 text-text-muted" />
                <span>{ratioLabel}</span>
              </span>
            </div>

            {/* Right Interactive Buttons (Like, Board Save & Bookmark) */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <div className="transition-transform active:scale-90">
                <LikeButton
                  promptId={prompt.id}
                  initialLikesCount={typeof prompt.likesCount === "number" ? prompt.likesCount : metrics.likes}
                  variant="card"
                />
              </div>
              <div className="transition-transform active:scale-90">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSaveModalOpen(true);
                  }}
                  aria-label="Save to board"
                  title="Save to board"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 hover:bg-black/75 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="transition-transform active:scale-90">
                <BookmarkButton
                  promptId={prompt.id}
                  initialBookmarked={isBookmarked}
                  isAuthenticated={isAuthenticated}
                  variant="card"
                />
              </div>
            </div>
          </div>

          {/* Direct One-Click Copy Prompt Button */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={
              copied
                ? "Prompt copied to clipboard"
                : copyFailed
                ? "Copy failed, click to retry"
                : "Copy prompt text"
            }
            className={`absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              copied
                ? "bg-emerald-500 text-white shadow-emerald-500/25 scale-105"
                : copyFailed
                ? "bg-red-500 text-white"
                : "bg-white/95 text-zinc-950 hover:bg-white hover:scale-105"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : copyFailed ? (
              <span>Retry</span>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-zinc-700" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col p-4 bg-surface transition-colors">
        {/* Category & Engagement Bar */}
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-text-faint">
          <span className="rounded-md bg-surface-raised px-2 py-0.5 font-medium text-text-muted border border-surface-border">
            {categoryLabels[prompt.category] || prompt.category}
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1" title="Views">
              <Eye className="h-3 w-3 text-text-faint" />
              <span>{metrics.views}</span>
            </span>
            <span className="inline-flex items-center gap-1" title="Saves">
              <Heart className="h-3 w-3 text-text-faint" />
              <span>{metrics.likes}</span>
            </span>
            <span className="inline-flex items-center gap-1" title="Copies">
              <Copy className="h-3 w-3 text-text-faint" />
              <span>{metrics.copies}</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <Link
          href={detailHref}
          className="group/title focus:outline-none mb-1.5"
        >
          <h2 className="font-heading text-sm sm:text-base font-bold leading-snug text-foreground transition-colors group-hover/title:text-indigo-400">
            {prompt.title}
          </h2>
        </Link>

        {/* Short Description */}
        <p className="mb-2.5 text-xs leading-relaxed text-text-muted line-clamp-2">
          {prompt.shortDescription}
        </p>

        {/* Monospace Prompt Excerpt */}
        <p className="mb-3 font-mono text-[11px] leading-relaxed text-text-faint bg-surface-raised/80 p-2.5 rounded-lg line-clamp-2 border border-surface-border">
          {prompt.prompt}
        </p>

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-text-muted border border-surface-border"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-[10px] text-text-faint self-center">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>

        {/* Card Footer: Detail Link & Source Attribution */}
        <div className="flex items-center justify-between border-t border-surface-border pt-2.5 text-[11px] text-text-faint">
          <Link
            href={detailHref}
            className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
          >
            View prompt &rarr;
          </Link>
          <a
            href={prompt.sourceAttribution.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-text-muted hover:underline text-[10px]"
            aria-label={`Photo by ${prompt.sourceAttribution.author} on ${prompt.sourceAttribution.source} (opens in new tab)`}
          >
            <span>by {prompt.sourceAttribution.author}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Save to Collection / Board Modal */}
      <SaveToCollectionModal
        prompt={prompt}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        isAuthenticated={isAuthenticated}
      />
    </article>
  );
}
