import React from "react";
import { PromptCard } from "@/components/PromptCard";
import type { PromptItem } from "@/data/prompts";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";

interface PromptGalleryProps {
  prompts: PromptItem[];
  totalMatching: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  returnQuery?: string;
  bookmarkedPromptIds?: string[];
  isAuthenticated?: boolean;
}

export function PromptGallery({
  prompts,
  totalMatching,
  currentPage,
  pageSize,
  onPageChange,
  onResetFilters,
  returnQuery = "",
  bookmarkedPromptIds = [],
  isAuthenticated = false,
}: PromptGalleryProps) {
  const totalPages = Math.ceil(totalMatching / pageSize);

  if (prompts.length === 0) {
    return (
      <section
        id="gallery"
        aria-label="Prompt Results"
        className="mx-auto flex max-w-md flex-col items-center justify-center py-20 px-4 text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-text-faint">
          <SearchX className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-base font-bold text-foreground">
          No matching prompts found
        </h3>
        <p className="mb-6 text-xs text-text-muted">
          We couldn&apos;t find any prompt matching your search keywords or active filters. Try broadening your terms or clear your filters to view all prompts.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-blue-500 hover:scale-105 active:scale-95 focus-visible:ring-2"
        >
          Clear all filters
        </button>
      </section>
    );
  }

  return (
    <section id="gallery" aria-label="Prompt Gallery" className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Gallery column layout (responsive multi-column masonry style) */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              priority={index < 4}
              returnQuery={returnQuery}
              isBookmarked={bookmarkedPromptIds.includes(prompt.id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>

        {/* Pagination Controls - only rendered when totalMatching exceeds pageSize */}
        {totalPages > 1 && (
          <nav
            aria-label="Gallery Pagination"
            className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-border pt-6 text-xs text-text-muted"
          >
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * pageSize, totalMatching)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">{totalMatching}</span>{" "}
              prompts
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous Page"
                className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface px-3 py-1.5 font-medium transition-all hover:bg-surface-raised hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => onPageChange(pageNum)}
                      aria-current={isActive ? "page" : undefined}
                      className={`h-8 w-8 rounded-lg font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white font-bold"
                          : "text-text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next Page"
                className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface px-3 py-1.5 font-medium transition-all hover:bg-surface-raised hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}
