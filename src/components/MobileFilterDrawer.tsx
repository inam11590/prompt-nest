"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  STYLE_FACETS,
  type AIModel,
} from "@/data/prompts";

const AI_MODELS: ("All Models" | AIModel)[] = [
  "All Models",
  "Midjourney v6.1",
  "FLUX.1 [dev]",
  "DALL-E 3",
  "Stable Diffusion XL",
  "ChatGPT-4o",
];

interface MobileFilterDrawerProps {
  selectedModel: string;
  selectedCategory: string;
  occasion: string;
  setting: string;
  lighting: string;
  framing: string;
  workflow: string;
  activeFilterCount: number;
  totalResults: number;
  onApplyFilters: (filters: {
    model: string;
    category: string;
    occasion: string;
    setting: string;
    lighting: string;
    framing: string;
    workflow: string;
  }) => void;
  onResetFilters: () => void;
}

export function MobileFilterDrawer({
  selectedModel,
  selectedCategory,
  occasion,
  setting,
  lighting,
  framing,
  workflow,
  activeFilterCount,
  totalResults,
  onApplyFilters,
  onResetFilters,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Staged filter state within the drawer
  const [stagedModel, setStagedModel] = useState(selectedModel);
  const [stagedCategory, setStagedCategory] = useState(selectedCategory);
  const [stagedOccasion, setStagedOccasion] = useState(occasion);
  const [stagedSetting, setStagedSetting] = useState(setting);
  const [stagedLighting, setStagedLighting] = useState(lighting);
  const [stagedFraming, setStagedFraming] = useState(framing);
  const [stagedWorkflow, setStagedWorkflow] = useState(workflow);

  const handleOpen = () => {
    setStagedModel(selectedModel);
    setStagedCategory(selectedCategory);
    setStagedOccasion(occasion);
    setStagedSetting(setting);
    setStagedLighting(lighting);
    setStagedFraming(framing);
    setStagedWorkflow(workflow);
    setIsOpen(true);
  };

  // Body scroll lock & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "Tab" && drawerRef.current) {
        // Focus trap
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus restoration on close
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  };

  const handleApply = () => {
    onApplyFilters({
      model: stagedModel,
      category: stagedCategory,
      occasion: stagedOccasion,
      setting: stagedSetting,
      lighting: stagedLighting,
      framing: stagedFraming,
      workflow: stagedWorkflow,
    });
    handleClose();
  };

  const handleReset = () => {
    setStagedModel("All Models");
    setStagedCategory("all");
    setStagedOccasion("all");
    setStagedSetting("all");
    setStagedLighting("all");
    setStagedFraming("all");
    setStagedWorkflow("all");
    onResetFilters();
    handleClose();
  };

  return (
    <div className="sm:hidden w-full">
      {/* Mobile Drawer Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 rounded-full border border-surface-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm hover:border-blue-500/40 hover:bg-surface-raised transition-all"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="mobile-filter-drawer"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-400" aria-hidden="true" />
          <span>Filters &amp; Style Facets</span>
        </span>
        {activeFilterCount > 0 ? (
          <span className="flex h-5 items-center justify-center rounded-full bg-blue-600 px-2 text-[10px] font-bold text-white shadow-sm">
            {activeFilterCount} active
          </span>
        ) : (
          <span className="text-[11px] text-text-faint">All styles</span>
        )}
      </button>

      {/* Accessible Drawer Modal Overlay */}
      {isOpen && (
        <div
          role="dialog"
          id="mobile-filter-drawer"
          aria-modal="true"
          aria-labelledby="mobile-filters-heading"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            ref={drawerRef}
            className="relative flex h-full w-full max-w-sm flex-col bg-surface shadow-2xl border-l border-surface-border animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-surface-border p-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <h2 id="mobile-filters-heading" className="text-sm font-bold text-white">
                  Filter Prompts
                </h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-text-muted hover:bg-surface-raised hover:text-white transition-colors"
                aria-label="Close filter drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Facet Options */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {/* AI Model */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-2">
                  AI Model
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AI_MODELS.map((m) => {
                    const isSelected = stagedModel === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setStagedModel(m)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold shadow-sm"
                            : "border border-surface-border bg-surface-raised text-text-muted hover:text-white"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {siteConfig.categories.map((c) => {
                    const isSelected = stagedCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setStagedCategory(c.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "border border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold ring-1 ring-blue-500/30"
                            : "border border-surface-border bg-surface-raised text-text-muted hover:text-white"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style Facet: Occasion */}
              <div>
                <label htmlFor="drawer-occasion" className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-1.5">
                  Occasion
                </label>
                <select
                  id="drawer-occasion"
                  value={stagedOccasion}
                  onChange={(e) => setStagedOccasion(e.target.value)}
                  className="w-full h-9 rounded-lg border border-surface-border bg-surface-raised px-3 text-xs text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Occasions</option>
                  {STYLE_FACETS.occasion.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Facet: Setting */}
              <div>
                <label htmlFor="drawer-setting" className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-1.5">
                  Setting
                </label>
                <select
                  id="drawer-setting"
                  value={stagedSetting}
                  onChange={(e) => setStagedSetting(e.target.value)}
                  className="w-full h-9 rounded-lg border border-surface-border bg-surface-raised px-3 text-xs text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Settings</option>
                  {STYLE_FACETS.setting.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Facet: Lighting */}
              <div>
                <label htmlFor="drawer-lighting" className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-1.5">
                  Lighting
                </label>
                <select
                  id="drawer-lighting"
                  value={stagedLighting}
                  onChange={(e) => setStagedLighting(e.target.value)}
                  className="w-full h-9 rounded-lg border border-surface-border bg-surface-raised px-3 text-xs text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Lighting</option>
                  {STYLE_FACETS.lighting.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Facet: Framing */}
              <div>
                <label htmlFor="drawer-framing" className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-1.5">
                  Framing
                </label>
                <select
                  id="drawer-framing"
                  value={stagedFraming}
                  onChange={(e) => setStagedFraming(e.target.value)}
                  className="w-full h-9 rounded-lg border border-surface-border bg-surface-raised px-3 text-xs text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Framing</option>
                  {STYLE_FACETS.framing.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Facet: Workflow */}
              <div>
                <label htmlFor="drawer-workflow" className="block text-[11px] font-bold uppercase tracking-wider text-text-faint mb-1.5">
                  Workflow Mode
                </label>
                <select
                  id="drawer-workflow"
                  value={stagedWorkflow}
                  onChange={(e) => setStagedWorkflow(e.target.value)}
                  className="w-full h-9 rounded-lg border border-surface-border bg-surface-raised px-3 text-xs text-foreground focus:outline-none focus:border-blue-500"
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

            {/* Sticky Drawer Footer */}
            <div className="border-t border-surface-border p-4 flex items-center justify-between gap-3 bg-surface">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-white hover:bg-surface-raised transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply Filters ({totalResults})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
