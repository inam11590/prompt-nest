import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse" aria-busy="true" aria-label="Loading page content">
      {/* Top Header Placeholder */}
      <header className="sticky top-0 z-50 h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-surface-raised" />
            <div className="h-5 w-28 rounded-md bg-surface-raised" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="h-4 w-16 rounded bg-surface-raised" />
            <div className="h-4 w-20 rounded bg-surface-raised" />
            <div className="h-4 w-16 rounded bg-surface-raised" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface-raised" />
            <div className="h-9 w-24 rounded-full bg-surface-raised" />
          </div>
        </div>
      </header>

      {/* Hero Shimmer */}
      <section className="relative w-full border-b border-surface-border hero-ambient-mesh pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-5 h-6 w-56 rounded-full bg-surface-raised/80" />
          <div className="mx-auto mb-4 h-12 w-3/4 max-w-xl rounded-xl bg-surface-raised" />
          <div className="mx-auto mb-8 h-4 w-2/3 max-w-md rounded bg-surface-raised/60" />

          {/* Search bar skeleton */}
          <div className="mx-auto h-12 max-w-2xl rounded-full border border-surface-border bg-surface/90" />

          {/* Filter Pills Skeleton */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-surface-raised/60" />
            ))}
          </div>
        </div>
      </section>

      {/* Main Gallery Shimmer Grid (Aspect-ratio locked for zero CLS) */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-5 w-36 rounded bg-surface-raised" />
          <div className="h-8 w-28 rounded-lg bg-surface-raised/60" />
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {[
            "aspect-[3/4]",
            "aspect-[4/5]",
            "aspect-[16/9]",
            "aspect-[4/5]",
            "aspect-[1/1]",
            "aspect-[3/4]",
            "aspect-[4/5]",
            "aspect-[16/9]",
          ].map((aspect, idx) => (
            <div
              key={idx}
              className={`mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm ${aspect}`}
            >
              <div className="h-full w-full bg-gradient-to-br from-surface to-surface-raised relative overflow-hidden">
                <div className="absolute inset-0 shimmer-sweep bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-surface-raised" />
                  <div className="h-3 w-1/2 rounded bg-surface-raised/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
