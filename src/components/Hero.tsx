import React from "react";
import { Sparkles, Search, X } from "lucide-react";
import { siteConfig } from "@/config/site";

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onResetFilters: () => void;
  totalResults: number;
}

const AI_MODELS = [
  "All Models",
  "Midjourney v6.1",
  "FLUX.1 [dev]",
  "DALL-E 3",
  "Stable Diffusion XL",
  "ChatGPT-4o",
];

export function Hero({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedModel,
  onSelectModel,
  onResetFilters,
  totalResults,
}: HeroProps) {
  const isFiltered = searchQuery !== "" || selectedCategory !== "all" || selectedModel !== "All Models";

  return (
    <section className="relative w-full border-b border-surface-border bg-gradient-to-b from-surface/50 via-background to-background pt-10 pb-8 sm:pt-14 sm:pb-12">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {/* Subtle pill tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-1.5 text-xs font-medium text-text-muted shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Curated AI Prompt Engineering Repository</span>
        </div>

        {/* Hero Title */}
        <h1 className="mb-3 font-extrabold tracking-tight text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Find the Perfect <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AI Prompt</span>
        </h1>

        {/* Tagline / Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base md:text-lg">
          Explore real-world prompt recipes for Midjourney, FLUX, DALL-E, and Stable Diffusion. Inspect exact lighting, lens styles, and composition tokens.
        </p>

        {/* Central Prominent Search Bar */}
        <div className="relative mx-auto mb-6 max-w-2xl">
          <div className="relative flex items-center rounded-full border border-surface-border bg-surface shadow-lg transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <div className="pointer-events-none pl-4.5 pr-2 text-text-faint">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search prompts, styles, optics (e.g., 35mm, brutalism, neon, cybernetic)..."
              className="h-13 w-full rounded-full bg-transparent pr-12 text-sm text-foreground placeholder-text-faint focus:outline-none sm:text-base"
              aria-label="Search prompt library"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-4 rounded-full p-1 text-text-faint hover:text-foreground focus-visible:ring-1"
                aria-label="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Model Filter Pills */}
        <div className="mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Model Filter">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-text-faint">
            Model:
          </span>
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model;
            return (
              <button
                key={model}
                type="button"
                onClick={() => onSelectModel(model)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-surface-border bg-surface text-text-muted hover:bg-surface-raised hover:text-foreground"
                }`}
                aria-pressed={isSelected}
              >
                {model}
              </button>
            );
          })}
        </div>

        {/* Category Horizontal Scroll / Wrap Bar */}
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 pt-2" aria-label="Category Navigation">
          {siteConfig.categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border border-blue-500/50 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30"
                    : "border border-surface-border bg-surface/80 text-text-muted hover:border-surface-border hover:bg-surface-raised hover:text-foreground"
                }`}
                aria-pressed={isSelected}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Active Filters Summary & Reset */}
        {isFiltered && (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-text-muted">
            <span>
              Showing {totalResults} {totalResults === 1 ? "result" : "results"}
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
