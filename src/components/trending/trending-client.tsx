"use client";

import React, { useState, useMemo } from "react";
import { PromptCard } from "@/components/PromptCard";
import type { PromptItem } from "@/data/prompts";
import { calculateTrendingScore, getFallbackEngagement } from "@/lib/data/engagement-scoring";
import {
  Flame,
  Copy,
  Heart,
  Sparkles,
} from "lucide-react";

interface ScoredPrompt {
  prompt: PromptItem;
  views: number;
  copies: number;
  likes: number;
  saves: number;
  trendingScore: number;
}

interface TrendingClientProps {
  initialPrompts: PromptItem[];
}

export function TrendingClient({ initialPrompts }: TrendingClientProps) {
  const [activeTab, setActiveTab] = useState<
    "trending" | "copies" | "likes" | "midjourney" | "flux" | "dalle" | "chatgpt"
  >("trending");

  // Calculate scores and metrics for all prompts
  const scoredPrompts: ScoredPrompt[] = useMemo(() => {
    return initialPrompts.map((p) => {
      const fallback = getFallbackEngagement(p);
      const views = typeof p.viewsCount === "number" ? p.viewsCount : fallback.views;
      const copies = typeof p.copiesCount === "number" ? p.copiesCount : fallback.copies;
      const likes = typeof p.likesCount === "number" ? p.likesCount : fallback.likes;
      const saves = typeof p.savesCount === "number" ? p.savesCount : fallback.saves;

      const trendingScore = calculateTrendingScore({
        views,
        copies,
        likes,
        saves,
      });

      return {
        prompt: p,
        views,
        copies,
        likes,
        saves,
        trendingScore,
      };
    });
  }, [initialPrompts]);

  // Sort and filter based on active tab
  const displayedPrompts = useMemo(() => {
    let list = [...scoredPrompts];

    if (activeTab === "trending") {
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (activeTab === "copies") {
      list.sort((a, b) => b.copies - a.copies);
    } else if (activeTab === "likes") {
      list.sort((a, b) => b.likes - a.likes);
    } else if (activeTab === "midjourney") {
      list = list.filter((item) => item.prompt.model.includes("Midjourney"));
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (activeTab === "flux") {
      list = list.filter((item) => item.prompt.model.includes("FLUX"));
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (activeTab === "dalle") {
      list = list.filter((item) => item.prompt.model.includes("DALL-E"));
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (activeTab === "chatgpt") {
      list = list.filter((item) => item.prompt.model.includes("ChatGPT"));
      list.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    return list;
  }, [scoredPrompts, activeTab]);

  const tabs = [
    { id: "trending", label: "Overall Trending", icon: Flame },
    { id: "copies", label: "Most Copied", icon: Copy },
    { id: "likes", label: "Most Liked", icon: Heart },
    { id: "midjourney", label: "Midjourney", icon: Sparkles },
    { id: "flux", label: "FLUX.1", icon: Sparkles },
    { id: "dalle", label: "DALL-E 3", icon: Sparkles },
    { id: "chatgpt", label: "ChatGPT-4o", icon: Sparkles },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-surface-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500 scale-105"
                  : "bg-surface text-text-muted hover:bg-surface-raised hover:text-foreground border border-surface-border"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Prompts Leaderboard Grid with Rank Badges */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
        {displayedPrompts.map((item, index) => {
          const rank = index + 1;
          let badgeStyle: string | undefined;

          if (rank === 1) {
            badgeStyle =
              "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black border border-amber-300 font-black shadow-lg shadow-amber-500/20";
          } else if (rank === 2) {
            badgeStyle =
              "bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 text-zinc-900 border border-slate-300 font-black shadow-lg shadow-zinc-500/20";
          } else if (rank === 3) {
            badgeStyle =
              "bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-800 text-white border border-amber-600/50 font-black shadow-lg shadow-amber-900/30";
          } else {
            badgeStyle =
              "bg-surface-raised/90 text-text-muted border border-surface-border font-bold";
          }

          return (
            <PromptCard
              key={item.prompt.id}
              prompt={item.prompt}
              rankBadge={{
                rank,
                badgeStyle,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
