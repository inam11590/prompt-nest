import React from "react";

export default function PromptDetailLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse" aria-busy="true" aria-label="Loading prompt details">
      {/* Top Header Placeholder */}
      <header className="sticky top-0 z-50 h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-surface-raised" />
            <div className="h-5 w-28 rounded-md bg-surface-raised" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface-raised" />
            <div className="h-9 w-24 rounded-full bg-surface-raised" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Breadcrumb Placeholder */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-32 rounded-lg bg-surface-raised" />
          <div className="h-4 w-48 rounded bg-surface-raised/60" />
        </div>

        {/* 2-Column Responsive Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Media Showcase (Aspect-Ratio Locked for CLS = 0) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-surface-border bg-surface relative">
              <div className="absolute inset-0 shimmer-sweep bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-7 w-40 rounded-lg bg-surface-raised/80" />
              <div className="h-7 w-24 rounded-lg bg-surface-raised/80" />
            </div>
          </div>

          {/* Right Column: Prompt Details & Action Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="h-4 w-28 rounded bg-surface-raised/80 mb-2" />
              <div className="h-8 w-5/6 rounded-lg bg-surface-raised mb-3" />
              <div className="h-4 w-full rounded bg-surface-raised/60 mb-2" />
              <div className="h-4 w-4/5 rounded bg-surface-raised/60" />
            </div>

            {/* Action Bar Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-11 flex-1 rounded-xl bg-surface-raised" />
              <div className="h-11 w-11 rounded-xl bg-surface-raised" />
              <div className="h-11 w-11 rounded-xl bg-surface-raised" />
            </div>

            {/* Prompt Text Box Skeleton */}
            <div className="rounded-2xl border border-surface-border bg-surface p-5 space-y-3">
              <div className="h-4 w-32 rounded bg-surface-raised/80" />
              <div className="h-20 w-full rounded-xl bg-surface-raised/60" />
              <div className="h-8 w-full rounded-lg bg-surface-raised/40" />
            </div>

            {/* Variable Studio Skeleton */}
            <div className="rounded-2xl border border-surface-border bg-surface p-5 space-y-3">
              <div className="h-5 w-44 rounded bg-surface-raised/80" />
              <div className="h-12 w-full rounded-xl bg-surface-raised/60" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
