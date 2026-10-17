import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { getOwnerCollectionById } from "@/lib/data/collections";
import { CollectionDetailClient } from "@/components/collections/CollectionDetailClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  if (!supabase) {
    return { title: `Collection — ${siteConfig.name}` };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { title: `Collection — ${siteConfig.name}` };
  }

  const collection = await getOwnerCollectionById(resolvedParams.id, user.id);
  if (!collection) {
    return { title: `Collection Not Found — ${siteConfig.name}` };
  }

  return {
    title: `${collection.title} — Collection — ${siteConfig.name}`,
    description: collection.description || `Manage collection ${collection.title} on PromptNest`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function CollectionDetailContent({ params }: CollectionDetailPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?returnTo=/dashboard/collections/${resolvedParams.id}`);
  }

  const collection = await getOwnerCollectionById(resolvedParams.id, user.id);
  if (!collection) {
    notFound();
  }

  const canonicalBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <CollectionDetailClient
        collection={collection}
        canonicalBaseUrl={canonicalBaseUrl}
      />
    </div>
  );
}

export default function CollectionDetailPage(props: CollectionDetailPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p className="text-xs text-text-muted">Loading collection...</p>
              </div>
            </div>
          }
        >
          <CollectionDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
