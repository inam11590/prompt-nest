import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { getPublicCollectionByPublicId } from "@/lib/data/collections";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromptCard } from "@/components/PromptCard";
import { ShareButton } from "@/components/ShareButton";
import { Folder, Sparkles, User as UserIcon } from "lucide-react";

interface PublicCollectionPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicCollectionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const collection = await getPublicCollectionByPublicId(resolvedParams.publicId);

  if (!collection) {
    return {
      title: `Collection Not Found — ${siteConfig.name}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;
  const canonicalUrl = `${canonicalBaseUrl}/collections/${collection.publicId}`;
  const firstPromptImage = collection.items[0]?.prompt?.imageUrl;

  return {
    title: `${collection.title} — Prompt Collection — ${siteConfig.name}`,
    description:
      collection.description ||
      `Explore curated prompts in ${collection.title} on ${siteConfig.name}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `${collection.title} — Prompt Collection`,
      description:
        collection.description ||
        `Explore curated prompts in ${collection.title} on ${siteConfig.name}.`,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      images: firstPromptImage
        ? [
            {
              url: firstPromptImage,
              width: 1200,
              height: 630,
              alt: collection.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.title} — Prompt Collection`,
      description:
        collection.description ||
        `Explore curated prompts in ${collection.title} on ${siteConfig.name}.`,
      images: firstPromptImage ? [firstPromptImage] : undefined,
    },
  };
}

async function PublicCollectionContent({ params }: PublicCollectionPageProps) {
  const resolvedParams = await params;
  const collection = await getPublicCollectionByPublicId(resolvedParams.publicId);

  // Private or missing collections return a genuine 404
  if (!collection) {
    notFound();
  }

  const canonicalBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;
  const canonicalUrl = `${canonicalBaseUrl}/collections/${collection.publicId}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-faint mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/collections" className="hover:text-foreground transition-colors">
          Collections
        </Link>
        <span>&rsaquo;</span>
        <span className="text-text-muted truncate max-w-xs" aria-current="page">
          {collection.title}
        </span>
      </nav>

      {/* Collection Header */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
          <Folder className="h-4 w-4" />
          <span>Prompt Collection</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {collection.title}
        </h1>

        {collection.description && (
          <p className="mt-3 text-base text-text-muted leading-relaxed whitespace-pre-wrap">
            {collection.description}
          </p>
        )}

        {/* Metadata Bar: Count, Owner Attribution & Share */}
        <div className="mt-6 pt-6 border-t border-surface-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>
                {collection.items.length}{" "}
                {collection.items.length === 1 ? "prompt" : "prompts"}
              </span>
            </span>

            {/* Owner Attribution: ONLY when creator profile is active and public */}
            {collection.owner && (
              <Link
                href={`/creators/${collection.owner.username}`}
                className="inline-flex items-center gap-2 group hover:text-foreground transition-colors"
              >
                {collection.owner.avatarUrl ? (
                  <div className="relative h-5 w-5 rounded-full overflow-hidden border border-surface-border">
                    <Image
                      src={collection.owner.avatarUrl}
                      alt={collection.owner.displayName || collection.owner.username}
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                    <UserIcon className="h-3 w-3" />
                  </div>
                )}
                <span>
                  Curated by{" "}
                  <span className="font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                    {collection.owner.displayName || `@${collection.owner.username}`}
                  </span>
                </span>
              </Link>
            )}
          </div>

          {/* Share Action Button */}
          <ShareButton title={collection.title} url={canonicalUrl} label="Copy Shareable Board Link" />
        </div>
      </div>

      {/* Collection Prompts Gallery */}
      <div className="mt-12">
        {collection.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-border bg-surface/50 p-16 text-center max-w-lg mx-auto">
            <Folder className="mx-auto h-10 w-10 text-text-faint mb-3" />
            <h2 className="text-base font-bold text-foreground">
              No published prompts in this collection yet
            </h2>
            <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
              The curator has not added any published prompts to this collection yet. Check back later!
            </p>
            <div className="mt-6">
              <Link
                href="/#gallery"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
              >
                <span>Explore Prompt Gallery</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {collection.items.map((item) => {
              if (!item.prompt) return null;
              return (
                <div key={item.id} className="break-inside-avoid">
                  <PromptCard prompt={item.prompt} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicCollectionPage(props: PublicCollectionPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p className="text-xs text-text-muted">Loading collection...</p>
              </div>
            </div>
          }
        >
          <PublicCollectionContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
