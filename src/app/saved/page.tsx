import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSavedPrompts } from "@/lib/data/prompts";
import { getOwnerCollections } from "@/lib/data/collections";
import { getUserLikedPromptsAction } from "@/app/actions/engagement";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SavedPromptsClient } from "@/components/SavedPromptsClient";
import { Bookmark } from "lucide-react";

export const metadata: Metadata = {
  title: `My Boards & Saved Prompts — ${siteConfig.name}`,
  description: "View and manage your boards, saved prompts, and liked creations.",
};

async function SavedContent() {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/saved");
  }

  const [savedPrompts, { collections }, likedPrompts] = await Promise.all([
    getUserSavedPrompts(),
    getOwnerCollections(user.id),
    getUserLikedPromptsAction(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 border-b border-surface-border pb-6">
        <div className="flex items-center gap-2.5 text-amber-400 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Bookmark className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Personal Library
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Saved Prompts & Boards
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-2xl">
          Organize your AI prompt boards, access bookmarked favorites across devices, and revisit prompts you liked.
        </p>
      </div>

      <SavedPromptsClient
        initialPrompts={savedPrompts}
        initialLikedPrompts={likedPrompts}
        initialCollections={collections}
        isAuthenticated={true}
      />
    </div>
  );
}

export default function SavedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl py-20 text-center text-xs text-text-muted">
              Loading your saved prompts...
            </div>
          }
        >
          <SavedContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
