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

const TRENDING_TAGS = [
  "#editorial-portrait",
  "#automotive-photography",
  "#3d-billboard",
  "#luxury-fashion",
  "#cinematic-lighting",
];

const MODEL_TRUST_BAR = [
  { model: "Midjourney v6.1", shortName: "Midjourney", count: "40+" },
  { model: "FLUX.1 [dev]", shortName: "FLUX.1", count: "25+" },
  { model: "DALL-E 3", shortName: "DALL-E 3", count: "18+" },
  { model: "Stable Diffusion XL", shortName: "SDXL", count: "16+" },
  { model: "ChatGPT-4o", shortName: "ChatGPT-4o", count: "12+" },
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
    <section className="relative w-full border-b border-surface-border hero-ambient-mesh pt-12 pb-10 sm:pt-16 sm:pb-14 transition-colors">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {/* Animated status pill */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-4 py-1.5 text-xs font-semibold text-text-muted shadow-sm backdrop-blur-md">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Thousands of Tested AI Prompts • Ready to Copy</span>
        </div>

        {/* Hero Title */}
        <h1 className="mb-4 font-heading font-extrabold tracking-tight text-foreground text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
          Find the Perfect{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AI Prompt
          </span>
        </h1>

        {/* Tagline / Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base md:text-lg">
          Explore production-grade recipes across Midjourney, FLUX, DALL-E 3, and Stable Diffusion. Inspect verified lighting tokens, photographic lenses, and aesthetic parameters.
        </p>

        {/* Central Search Bar & Controls */}
        <div className="relative mx-auto mb-4 max-w-2xl flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full flex items-center rounded-full border border-surface-border bg-surface/95 backdrop-blur-md shadow-lg transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
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

          {/* Quick Model Selector + Sort Controls */}
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2 justify-end">
            {/* Quick Model Selector */}
            <div className="relative flex items-center w-full sm:w-auto">
              <label htmlFor="hero-model-quick" className="sr-only">
                Filter by AI Model
              </label>
              <select
                id="hero-model-quick"
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                aria-label="Filter by AI Model"
                className="h-12 w-full sm:w-auto pl-3.5 pr-8 rounded-full border border-surface-border bg-surface text-xs font-semibold text-foreground appearance-none shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {AI_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 text-text-faint">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Sort Control */}
            <div className="relative flex items-center w-full sm:w-auto">
              <label htmlFor="gallery-sort" className="sr-only">
                Sort prompts by
              </label>
              <div className="pointer-events-none absolute left-3 text-text-faint">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </div>
              <select
                id="gallery-sort"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="h-12 w-full sm:w-auto pl-8 pr-8 rounded-full border border-surface-border bg-surface text-xs font-semibold text-foreground appearance-none shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
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

        {/* Trending Search Tags Row */}
        <div className="mx-auto mb-6 max-w-2xl flex flex-wrap items-center justify-center gap-1.5 text-xs text-text-faint">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-text-faint mr-1">
            Trending:
          </span>
          {TRENDING_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSearchChange(tag.replace("#", ""))}
              className="rounded-full border border-surface-border bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-text-muted hover:border-indigo-500/40 hover:bg-surface-raised hover:text-foreground transition-all shadow-sm"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Tested Across Leading AI Models (Interactive Trust Bar) */}
        <div className="mx-auto mb-8 max-w-3xl pt-2 pb-2">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Tested Across Leading AI Models</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
            {MODEL_TRUST_BAR.map((item) => {
              const isSelected = selectedModel === item.model;
              return (
                <button
                  key={item.model}
                  type="button"
                  onClick={() => onSelectModel(isSelected ? "All Models" : item.model)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/15 shadow-md ring-1 ring-indigo-500/30"
                      : "border-surface-border bg-surface/80 hover:border-indigo-500/40 hover:bg-surface-raised shadow-sm"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${item.model}`}
                >
                  <span className={`text-xs font-heading font-bold truncate w-full ${isSelected ? "text-indigo-400" : "text-foreground group-hover:text-indigo-400"}`}>
                    {item.shortName}
                  </span>
                  <span className="text-[10px] text-text-faint mt-0.5">
                    {item.count} prompts
                  </span>
                </button>
              );
            })}
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
                      ? "border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 font-semibold"
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
          <div className="mx-auto max-w-4xl pt-3 border-t border-surface-border/50">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-indigo-400" />
                <span>Style:</span>
              </span>

              {/* Occasion */}
              <select
                value={occasion}
                onChange={(e) => onSelectOccasion(e.target.value)}
                aria-label="Filter by Occasion"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-indigo-500 ${
                  occasion && occasion !== "all"
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-semibold ring-1 ring-indigo-500/30"
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
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-indigo-500 ${
                  setting && setting !== "all"
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-semibold ring-1 ring-indigo-500/30"
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
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-indigo-500 ${
                  lighting && lighting !== "all"
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-semibold ring-1 ring-indigo-500/30"
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
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-indigo-500 ${
                  framing && framing !== "all"
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-semibold ring-1 ring-indigo-500/30"
                    : "border-surface-border text-text-muted hover:border-surface-border-subtle"
                }`}
              >
                <option value="all">All Framings</option>
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
                aria-label="Filter by Transformation Workflow"
                className={`h-8 rounded-full border px-3 text-xs font-medium transition-all cursor-pointer bg-surface appearance-none focus:outline-none focus:border-indigo-500 ${
                  workflow && workflow !== "all"
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-semibold ring-1 ring-indigo-500/30"
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

              {/* Reset all button if any filter is active */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="h-8 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips & Results Count */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border/40 pt-3 text-xs text-text-muted">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-text-faint font-medium">Active:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-foreground border border-surface-border">
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={onRemoveSearch}
                  className="hover:text-red-400"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCategory !== "all" && selectedCategoryObj && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-foreground border border-surface-border">
                <span>Category: {selectedCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={onRemoveCategory}
                  className="hover:text-red-400"
                  aria-label="Remove category filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedModel !== "All Models" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-foreground border border-surface-border">
                <span>Model: {selectedModel}</span>
                <button
                  type="button"
                  onClick={onRemoveModel}
                  className="hover:text-red-400"
                  aria-label="Remove model filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {occasion && occasion !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-500/30">
                <span>Occasion: {STYLE_FACETS.occasion.options.find((o) => o.id === occasion)?.label || occasion}</span>
                <button
                  type="button"
                  onClick={onRemoveOccasion}
                  className="hover:text-red-400"
                  aria-label="Remove occasion filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {setting && setting !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-500/30">
                <span>Setting: {STYLE_FACETS.setting.options.find((s) => s.id === setting)?.label || setting}</span>
                <button
                  type="button"
                  onClick={onRemoveSetting}
                  className="hover:text-red-400"
                  aria-label="Remove setting filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {lighting && lighting !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-500/30">
                <span>Lighting: {STYLE_FACETS.lighting.options.find((l) => l.id === lighting)?.label || lighting}</span>
                <button
                  type="button"
                  onClick={onRemoveLighting}
                  className="hover:text-red-400"
                  aria-label="Remove lighting filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {framing && framing !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-500/30">
                <span>Framing: {STYLE_FACETS.framing.options.find((f) => f.id === framing)?.label || framing}</span>
                <button
                  type="button"
                  onClick={onRemoveFraming}
                  className="hover:text-red-400"
                  aria-label="Remove framing filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {workflow && workflow !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-500/30">
                <span>Workflow: {STYLE_FACETS.workflow.options.find((w) => w.id === workflow)?.label || workflow}</span>
                <button
                  type="button"
                  onClick={onRemoveWorkflow}
                  className="hover:text-red-400"
                  aria-label="Remove workflow filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {!isFiltered && (
              <span className="text-text-faint italic">No filters applied</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {totalResults} {totalResults === 1 ? "prompt" : "prompts"} found
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
