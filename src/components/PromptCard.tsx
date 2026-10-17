"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Check, ExternalLink, Sparkles, ImageOff } from "lucide-react";
import type { PromptItem } from "@/data/prompts";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AddToCollectionButton } from "@/components/collections/AddToCollectionButton";

interface PromptCardProps {
  prompt: PromptItem;
  priority?: boolean;
  returnQuery?: string;
  isBookmarked?: boolean;
  isAuthenticated?: boolean;
}

export function PromptCard({
  prompt,
  priority = false,
  returnQuery = "",
  isBookmarked = false,
  isAuthenticated = false,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [imgError, setImgError] = useState(false);

  const detailHref = returnQuery
    ? `/prompts/${prompt.slug}?from=${encodeURIComponent(returnQuery)}`
    : `/prompts/${prompt.slug}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setCopyFailed(false);
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
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm transition-all duration-300 hover:border-surface-border-subtle hover:shadow-xl hover:shadow-black/40 break-inside-avoid mb-5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
      style={{
        backgroundColor: prompt.dominantColor,
      }}
    >
      {/* Primary Clickable Link targeting /prompts/[slug] */}
      <Link
        href={detailHref}
        className="block relative w-full overflow-hidden focus:outline-none"
        aria-label={`View prompt details for ${prompt.title}`}
      >
        {/* Aspect Ratio Container for Layout Stability */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: prompt.aspectRatioValue,
          }}
        >
          {!imgError ? (
            <Image
              src={prompt.imageUrl}
              alt={prompt.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              priority={priority}
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-raised text-text-faint p-4 text-center">
              <ImageOff className="h-8 w-8 mb-2" />
              <span className="text-xs">Preview unavailable</span>
            </div>
          )}

          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 opacity-70 transition-opacity group-hover:opacity-85" />

          {/* Top Badges: Category & Primary Model */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
              {categoryLabels[prompt.category] || prompt.category}
            </span>
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-blue-400/20 shadow-sm pointer-events-none">
                <Sparkles className="h-3 w-3" />
                {prompt.model}
              </span>
              <BookmarkButton
                promptId={prompt.id}
                initialBookmarked={isBookmarked}
                isAuthenticated={isAuthenticated}
                variant="card"
              />
              <AddToCollectionButton
                promptId={prompt.id}
                isAuthenticated={isAuthenticated}
                variant="card"
              />
            </div>
          </div>

          {/* Floating Copy Button */}
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
            className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : copyFailed ? (
              <span className="text-red-600">Failed</span>
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
      <div className="relative z-10 flex flex-col p-4 bg-surface">
        <Link
          href={detailHref}
          className="group/title focus:outline-none"
        >
          <h2 className="mb-1 text-sm font-bold leading-snug text-foreground transition-colors group-hover/title:text-blue-400 sm:text-base">
            {prompt.title}
          </h2>
        </Link>

        {/* Short Description */}
        <p className="mb-2 text-xs leading-relaxed text-text-muted line-clamp-2">
          {prompt.shortDescription}
        </p>

        {/* Prompt excerpt */}
        <p className="mb-3 font-mono text-[11px] leading-relaxed text-text-faint bg-surface-raised p-2 rounded-lg line-clamp-2 border border-surface-border">
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
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
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
    </article>
  );
}
