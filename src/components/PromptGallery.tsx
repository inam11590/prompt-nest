import React from "react";
import { PromptCard } from "@/components/PromptCard";
import type { PromptItem } from "@/data/prompts";
import { SearchX } from "lucide-react";

interface PromptGalleryProps {
  prompts: PromptItem[];
  onResetFilters: () => void;
}

export function PromptGallery({ prompts, onResetFilters }: PromptGalleryProps) {
  if (prompts.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-text-faint">
          <SearchX className="h-7 w-7" />
        </div>
        <h3 className="mb-1 text-base font-bold text-foreground">
          No matching prompts found
        </h3>
        <p className="mb-6 text-xs text-text-muted">
          We couldn&apos;t find any prompt matching your query or selected filters. Try broadening your keywords or resetting filters.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-blue-500 hover:scale-105 active:scale-95 focus-visible:ring-2"
        >
          Reset all filters
        </button>
      </div>
    );
  }

  return (
    <section id="gallery" className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Gallery column layout (responsive multi-column masonry style) */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              priority={index < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
