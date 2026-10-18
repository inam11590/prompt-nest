"use client";

import React from "react";
import { Sparkles, Search, X, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { siteConfig } from "@/config/site";
import { STYLE_FACETS, type AIModel } from "@/data/prompts";
import { MobileFilterDrawer } from "@/components/MobileFilterDrawer";

export type SortOption = "newest" | "title-asc" | "title-desc";

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  occasion: string;
  onSelectOccasion: (val: string) => void;
  setting: string;
  onSelectSetting: (val: string) => void;
  lighting: string;
  onSelectLighting: (val: string) => void;
  framing: string;
  onSelectFraming: (val: string) => void;
  workflow: string;
  onSelectWorkflow: (val: string) => void;
  onResetFilters: () => void;
  onRemoveSearch: () => void;
  onRemoveCategory: () => void;
  onRemoveModel: () => void;
  onRemoveOccasion: () => void;
  onRemoveSetting: () => void;
  onRemoveLighting: () => void;
  onRemoveFraming: () => void;
  onRemoveWorkflow: () => void;
  onApplyMobileFilters: (filters: {
    model: string;
    category: string;
    occasion: string;
    setting: string;
    lighting: string;
    framing: string;
    workflow: string;
  }) => void;
  totalResults: number;
}

const AI_MODELS: ("All Models" | AIModel)[] = [
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
  sortOption,
  onSortChange,
  occasion,
  onSelectOccasion,
  setting,
  onSelectSetting,
  lighting,
  onSelectLighting,
  framing,
  onSelectFraming,
  workflow,
  onSelectWorkflow,
  onResetFilters,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveModel,
  onRemoveOccasion,
  onRemoveSetting,
  onRemoveLighting,
  onRemoveFraming,
  onRemoveWorkflow,
  onApplyMobileFilters,
  totalResults,
}: HeroProps) {
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedModel !== "All Models" ||
    (occasion && occasion !== "all") ||
    (setting && setting !== "all") ||
    (lighting && lighting !== "all") ||
    (framing && framing !== "all") ||
    (workflow && workflow !== "all");

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedModel !== "All Models" ? 1 : 0) +
    (occasion && occasion !== "all" ? 1 : 0) +
    (setting && setting !== "all" ? 1 : 0) +
    (lighting && lighting !== "all" ? 1 : 0) +
    (framing && framing !== "all" ? 1 : 0) +
    (workflow && workflow !== "all" ? 1 : 0);

  const selectedCategoryObj = siteConfig.categories.find(
    (c) => c.id === selectedCategory
  );

  return (
    <section className="relative w-full border-b border-surface-border bg-gradient-to-b from-surface/50 via-background to-background pt-10 pb-8 sm:pt-14 sm:pb-12">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {/* Repository pill tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-1.5 text-xs font-medium text-text-muted shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Curated AI Prompt Engineering Repository</span>
        </div>

        {/* Hero Title */}
        <h1 className="mb-3 font-extrabold tracking-tight text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Find the Perfect{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            AI Prompt
          </span>
        </h1>

        {/* Tagline / Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base md:text-lg">
          Explore real-world prompt recipes for Midjourney, FLUX, DALL-E, and Stable Diffusion. Inspect exact lighting, optics, and aesthetic tokens.
        </p>

        {/* Central Prominent Search Bar & Sort Row */}
        <div className="relative mx-auto mb-4 max-w-2xl flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full flex items-center rounded-full border border-surface-border bg-surface shadow-lg transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <div className="pointer-events-none pl-4.5 pr-2 text-text-faint">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search title, description, tags, prompt text..."
              className="h-12 w-full rounded-full bg-transparent pr-12 text-sm text-foreground placeholder-text-faint focus:outline-none sm:text-base"
              aria-label="Search prompt library"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onRemoveSearch}
                className="absolute right-4 rounded-full p-1 text-text-faint hover:text-foreground focus-visible:ring-1"
                aria-label="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Control */}
          <div className="w-full sm:w-auto shrink-0 flex items-center justify-end gap-1.5">
            <label htmlFor="gallery-sort" className="sr-only">
              Sort prompts by
            </label>
            <div className="relative flex items-center w-full sm:w-auto">
              <div className="pointer-events-none absolute left-3 text-text-faint">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </div>
              <select
                id="gallery-sort"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="h-12 w-full sm:w-auto pl-8 pr-8 rounded-full border border-surface-border bg-surface text-xs font-medium text-foreground appearance-none shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                aria-label="Sort prompts"
              >
                <option value="newest">Newest first</option>
                <option value="title-asc">Title (A - Z)</option>
                <option value="title-desc">Title (Z - A)</option>
              </select>
              <div className="pointer-events-none absolute right-3 text-text-faint">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer Trigger (Mobile only) */}
        <div className="mb-4 sm:hidden">
          <MobileFilterDrawer
            selectedModel={selectedModel}
            selectedCategory={selectedCategory}
            occasion={occasion}
            setting={setting}
            lighting={lighting}
            framing={framing}
            workflow={workflow}
            activeFilterCount={activeFilterCount}
            totalResults={totalResults}
            onApplyFilters={onApplyMobileFilters}
            onResetFilters={onResetFilters}
          />
        </div>

        {/* Desktop / Tablet Filters */}
        <div className="hidden sm:block space-y-3">
          {/* Model Filter Pills */}
          <div
            className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-1.5 sm:gap-2"
            aria-label="AI Model Filter"
          >
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
                      ? "bg-blue-600 text-white shadow-sm font-semibold"
                      : "border border-surface-border bg-surface text-text-muted hover:bg-surface-raised hover:text-foreground"
                  }`}
                  aria-pressed={isSelected}
                >
                  {model}
                </button>
              );
            })}
          </div>

          {/* Category Filter Chips */}
          <div
            className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 pt-1"
            aria-label="Category Navigation"
          >
            {siteConfig.categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "border border-blue-500/50 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30 font-semibold"
                      : "border border-surface-border bg-surface/80 text-text-muted hover:border-surface-border hover:bg-surface-raised hover:text-foreground"
                  }`}
                  aria-pressed={isSelected}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Controlled Style Facets Toolbar (Occasion, Setting, Lighting, Framing, Workflow) */}
          <div className="mx-auto max-w-4xl pt-2 border-t border-surface-border/50">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-blue-400" />
                <span>Style:</span>
              </span>

              {/* Occasion */}
              <select
                value={occasion}
                onChange={(e) => onSelectOccasion(e.target.value)}
                aria-label="Filter by Occasion"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-blue-500 ${
                  occasion && occasion !== "all"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold ring-1 ring-blue-500/30"
                    : "border-surface-border text-text-muted hover:border-surface-border-subtle"
                }`}
              >
                <option value="all">All Occasions</option>
                {STYLE_FACETS.occasion.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Setting */}
              <select
                value={setting}
                onChange={(e) => onSelectSetting(e.target.value)}
                aria-label="Filter by Setting"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-blue-500 ${
                  setting && setting !== "all"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold ring-1 ring-blue-500/30"
                    : "border-surface-border text-text-muted hover:border-surface-border-subtle"
                }`}
              >
                <option value="all">All Settings</option>
                {STYLE_FACETS.setting.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Lighting */}
              <select
                value={lighting}
                onChange={(e) => onSelectLighting(e.target.value)}
                aria-label="Filter by Lighting"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-blue-500 ${
                  lighting && lighting !== "all"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold ring-1 ring-blue-500/30"
                    : "border-surface-border text-text-muted hover:border-surface-border-subtle"
                }`}
              >
                <option value="all">All Lighting</option>
                {STYLE_FACETS.lighting.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Framing */}
              <select
                value={framing}
                onChange={(e) => onSelectFraming(e.target.value)}
                aria-label="Filter by Framing"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-blue-500 ${
                  framing && framing !== "all"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold ring-1 ring-blue-500/30"
                    : "border-surface-border text-text-muted hover:border-surface-border-subtle"
                }`}
              >
                <option value="all">All Framing</option>
                {STYLE_FACETS.framing.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Workflow */}
              <select
                value={workflow}
                onChange={(e) => onSelectWorkflow(e.target.value)}
                aria-label="Filter by Workflow"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-blue-500 ${
                  workflow && workflow !== "all"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold ring-1 ring-blue-500/30"
                    : "border-surface-border text-text-muted hover:border-surface-border-subtle"
                }`}
              >
                <option value="all">All Workflows</option>
                {STYLE_FACETS.workflow.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Removable Active Filter Chips & Result Counter */}
        {isFiltered && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-surface-border/60 pt-4 text-xs">
            <span className="text-text-muted">
              <strong className="text-foreground">{totalResults}</strong>{" "}
              {totalResults === 1 ? "prompt matching" : "prompts matching"}:
            </span>

            {/* Search chip */}
            {searchQuery.trim() !== "" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-blue-300">
                <span>&ldquo;{searchQuery.trim()}&rdquo;</span>
                <button
                  type="button"
                  onClick={onRemoveSearch}
                  className="rounded-full hover:bg-blue-500/20 p-0.5"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Category chip */}
            {selectedCategory !== "all" && selectedCategoryObj && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted">
                <span>Category: {selectedCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={onRemoveCategory}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove category filter ${selectedCategoryObj.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Model chip */}
            {selectedModel !== "All Models" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted">
                <span>Model: {selectedModel}</span>
                <button
                  type="button"
                  onClick={onRemoveModel}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove model filter ${selectedModel}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Occasion chip */}
            {occasion && occasion !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted capitalize">
                <span>Occasion: {occasion}</span>
                <button
                  type="button"
                  onClick={onRemoveOccasion}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove occasion filter ${occasion}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Setting chip */}
            {setting && setting !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted capitalize">
                <span>Setting: {setting}</span>
                <button
                  type="button"
                  onClick={onRemoveSetting}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove setting filter ${setting}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Lighting chip */}
            {lighting && lighting !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted capitalize">
                <span>Lighting: {lighting.replace("_", " ")}</span>
                <button
                  type="button"
                  onClick={onRemoveLighting}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove lighting filter ${lighting}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Framing chip */}
            {framing && framing !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted capitalize">
                <span>Framing: {framing.replace("_", " ")}</span>
                <button
                  type="button"
                  onClick={onRemoveFraming}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove framing filter ${framing}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Workflow chip */}
            {workflow && workflow !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-0.5 text-text-muted">
                <span>
                  Workflow:{" "}
                  {workflow === "personal_photo_plus_example"
                    ? "Photo + Ref"
                    : "Photo Only"}
                </span>
                <button
                  type="button"
                  onClick={onRemoveWorkflow}
                  className="rounded-full hover:bg-surface-raised p-0.5"
                  aria-label={`Remove workflow filter ${workflow}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Clear All button */}
            <button
              type="button"
              onClick={onResetFilters}
              className="ml-2 font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
