"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PromptCard } from "@/components/PromptCard";
import type { PromptItem } from "@/data/prompts";
import { Bookmark, Compass, Search } from "lucide-react";

interface SavedPromptsClientProps {
  initialPrompts: PromptItem[];
}

export function SavedPromptsClient({ initialPrompts }: SavedPromptsClientProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filtered = initialPrompts.filter((p) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q)
    );
  });

  if (initialPrompts.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface text-amber-400">
          <Bookmark className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No saved prompts yet</h2>
        <p className="text-xs text-text-muted mb-6 leading-relaxed">
          You haven&apos;t bookmarked any prompts yet. Click the bookmark icon on any prompt card or detail page to save it to your private library.
        </p>
        <Link
          href="/#gallery"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition-all"
        >
          <Compass className="h-4 w-4" />
          <span>Explore Prompt Library</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search within saved */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search your saved prompts..."
            className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="text-xs text-text-muted self-center">
          Showing <span className="font-semibold text-white">{filtered.length}</span> of{" "}
          <span className="font-semibold text-white">{initialPrompts.length}</span> saved{" "}
          {initialPrompts.length === 1 ? "prompt" : "prompts"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center text-xs text-text-muted">
          No saved prompts match &quot;{filterQuery}&quot;.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {filtered.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isBookmarked={true}
              isAuthenticated={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
