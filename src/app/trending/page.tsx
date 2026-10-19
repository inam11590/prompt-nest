import React, { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPrompts } from "@/lib/data/prompts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TrendingClient } from "@/components/trending/trending-client";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: `Trending Prompts Leaderboard — ${siteConfig.name}`,
  description:
    "Explore the most copied, saved, and viral AI prompts ranked live across Midjourney, Flux, DALL-E, and Stable Diffusion.",
  alternates: {
    canonical: `${siteConfig.url}/trending`,
  },
  openGraph: {
    title: `Trending Prompts Leaderboard — ${siteConfig.name}`,
    description:
      "Explore the most copied, saved, and viral AI prompts ranked live.",
    url: `${siteConfig.url}/trending`,
    siteName: siteConfig.name,
    type: "website",
  },
};

async function TrendingContent() {
  const { prompts } = await getPrompts({ pageSize: 50 });

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-400 mb-4 shadow-sm">
          <Trophy className="h-3.5 w-3.5" />
          <span>Real-Time Community Leaderboard</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
          Trending AI Prompts
        </h1>
        <p className="mt-3 text-sm sm:text-base text-text-muted leading-relaxed">
          The most copied, saved, and viral prompts across Midjourney, Flux, and DALL-E. Ranked via weighted atomic engagement metrics.
        </p>

        {/* Algorithm Score Formula Pill */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-surface-border bg-surface px-4 py-2 text-xs text-text-faint font-mono shadow-sm">
          <span className="text-amber-400 font-bold">Trending Score</span>
          <span>=</span>
          <span>copies &times; 3 + likes &times; 4 + saves &times; 5 + views &times; 0.1</span>
        </div>
      </div>

      <TrendingClient initialPrompts={prompts} />
    </div>
  );
}

export default function TrendingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-indigo-600 selection:text-white">
      <Header />

      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl py-20 text-center text-xs text-text-muted">
              Loading leaderboard rankings...
            </div>
          }
        >
          <TrendingContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
