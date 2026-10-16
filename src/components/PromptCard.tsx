"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import type { PromptItem } from "@/data/prompts";

interface PromptCardProps {
  prompt: PromptItem;
  priority?: boolean;
}

export function PromptCard({ prompt, priority = false }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy prompt:", err);
    }
  };

  // Map category label
  const categoryLabels: Record<string, string> = {
    photography: "Photography",
    "digital-art": "Digital Art",
    architecture: "Architecture",
    "character-design": "Character Design",
    nature: "Nature",
    "graphic-design": "Graphic & UI",
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm transition-all duration-300 hover:border-surface-border-subtle hover:shadow-xl hover:shadow-black/40 break-inside-avoid mb-5"
      style={{
        backgroundColor: prompt.dominantColor,
      }}
    >
      {/* Image Container with natural aspect ratio container to prevent layout shifts */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: prompt.aspectRatioValue,
        }}
      >
        <Image
          src={prompt.imageUrl}
          alt={prompt.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10 opacity-75 transition-opacity group-hover:opacity-90" />

        {/* Top Badges: Category & AI Model */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
            {categoryLabels[prompt.category] || prompt.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-blue-400/20 shadow-sm">
            <Sparkles className="h-3 w-3" />
            {prompt.model}
          </span>
        </div>

        {/* Quick Copy Button hovering on image */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Prompt copied to clipboard" : "Copy prompt text"}
          className="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95 focus-visible:ring-2"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-700" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col p-4 bg-surface">
        <h2 className="mb-2 text-sm font-bold leading-snug text-foreground sm:text-base">
          {prompt.title}
        </h2>

        {/* Prompt Text with expand/collapse */}
        <div className="relative mb-3">
          <p
            className={`text-xs leading-relaxed text-text-muted transition-all ${
              isExpanded ? "" : "line-clamp-2"
            }`}
          >
            {prompt.prompt}
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Show less" : "Read full prompt"}
          </button>
        </div>

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {prompt.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-text-muted border border-surface-border"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Attribution Footnote */}
        <div className="flex items-center justify-between border-t border-surface-border pt-2.5 text-[10px] text-text-faint">
          <span>Photo by {prompt.sourceAttribution.author}</span>
          <a
            href={prompt.sourceAttribution.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-text-muted hover:underline"
            aria-label={`View photo source by ${prompt.sourceAttribution.author} on Unsplash (opens in new tab)`}
          >
            <span>{prompt.sourceAttribution.source}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
