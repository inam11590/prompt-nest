import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { getOwnerCollections } from "@/lib/data/collections";
import { CollectionsListClient } from "@/components/collections/CollectionsListClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: `Your Collections — ${siteConfig.name}`,
  description: "Organize and curate AI prompts into personal and public shareable collections.",
  robots: {
    index: false,
    follow: false,
  },
};

interface CollectionsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

async function CollectionsContent({ searchParams }: CollectionsPageProps) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/dashboard/collections");
  }

  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const pageSize = 12;

  const result = await getOwnerCollections(user.id, {
    page: currentPage,
    pageSize,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <CollectionsListClient
        collections={result.collections}
        total={result.total}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}

export default function CollectionsPage(props: CollectionsPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p className="text-xs text-text-muted">Loading collections...</p>
              </div>
            </div>
          }
        >
          <CollectionsContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
