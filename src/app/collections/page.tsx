import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { getAllPublicCollections } from "@/lib/data/collections";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Folder,
  Sparkles,
  ArrowRight,
  Layers,
  User as UserIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: `Curated Collections & Boards — ${siteConfig.name}`,
  description:
    "Explore handpicked AI prompt collections, themed moodboards, and community-curated boards for Midjourney, Flux, and DALL-E.",
  alternates: {
    canonical: `${siteConfig.url}/collections`,
  },
  openGraph: {
    title: `Curated Collections & Boards — ${siteConfig.name}`,
    description:
      "Explore handpicked AI prompt collections, themed moodboards, and community-curated boards.",
    url: `${siteConfig.url}/collections`,
    siteName: siteConfig.name,
    type: "website",
  },
};

async function CollectionsContent() {
  const collections = await getAllPublicCollections();

  return (
    <div className="mx-auto max-w-6xl">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 mb-4 shadow-sm">
              <Layers className="h-3.5 w-3.5" />
              <span>Thematic Moodboards & Curation</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
              Shareable Prompt Collections
            </h1>
            <p className="mt-4 text-sm sm:text-base text-text-muted leading-relaxed">
              Explore handpicked visual moodboards and curated boards. Copy prompts, save entire boards, and discover cohesive aesthetic styles for your creative projects.
            </p>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {collections.map((board) => {
              const detailHref = `/collections/${board.slug || board.publicId}`;
              const promptImages = board.coverImageUrls || [
                ...board.items.map((i) => i.prompt?.imageUrl).filter((url): url is string => !!url),
              ];
              const displayCount = board.itemsCount || board.items.length;

              return (
                <article
                  key={board.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-black/20"
                >
                  {/* Pinterest-Style Multi-Thumbnail Mosaic Header */}
                  <Link
                    href={detailHref}
                    className="block relative w-full h-56 sm:h-64 overflow-hidden bg-surface-raised border-b border-surface-border"
                    aria-label={`View collection: ${board.title}`}
                  >
                    {promptImages.length >= 3 ? (
                      <div className="grid grid-cols-12 h-full w-full gap-1 p-1.5 bg-surface-raised">
                        {/* Primary large image (7 cols) */}
                        <div className="col-span-7 relative h-full overflow-hidden rounded-2xl">
                          <Image
                            src={promptImages[0]}
                            alt={board.title}
                            fill
                            sizes="(max-width: 768px) 60vw, 30vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        </div>
                        {/* 2 stacked secondary images (5 cols) */}
                        <div className="col-span-5 grid grid-rows-2 h-full gap-1">
                          <div className="relative h-full overflow-hidden rounded-xl">
                            <Image
                              src={promptImages[1]}
                              alt={`${board.title} preview 2`}
                              fill
                              sizes="(max-width: 768px) 30vw, 15vw"
                              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          </div>
                          <div className="relative h-full overflow-hidden rounded-xl">
                            <Image
                              src={promptImages[2]}
                              alt={`${board.title} preview 3`}
                              fill
                              sizes="(max-width: 768px) 30vw, 15vw"
                              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          </div>
                        </div>
                      </div>
                    ) : promptImages.length > 0 ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={promptImages[0]}
                          alt={board.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-faint">
                        <Folder className="h-10 w-10 opacity-40" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Floating Item Count Badge */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        <span>{displayCount} prompts</span>
                      </span>
                    </div>
                  </Link>

                  {/* Content Body */}
                  <div className="flex flex-1 flex-col p-6">
                    {/* Title */}
                    <Link href={detailHref} className="group/title focus:outline-none mb-2">
                      <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground transition-colors group-hover/title:text-indigo-400">
                        {board.title}
                      </h2>
                    </Link>

                    {/* Description */}
                    {board.description && (
                      <p className="text-xs sm:text-sm text-text-muted leading-relaxed line-clamp-2 mb-4">
                        {board.description}
                      </p>
                    )}

                    {/* Tags */}
                    {board.tags && board.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {board.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-text-muted border border-surface-border"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Row: Curator & Action */}
                    <div className="mt-auto flex items-center justify-between border-t border-surface-border pt-4 text-xs text-text-muted">
                      {board.owner ? (
                        <div className="flex items-center gap-2">
                          {board.owner.avatarUrl ? (
                            <div className="relative h-6 w-6 rounded-full overflow-hidden border border-surface-border">
                              <Image
                                src={board.owner.avatarUrl}
                                alt={board.owner.displayName || board.owner.username}
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                              <UserIcon className="h-3 w-3" />
                            </div>
                          )}
                          <span className="font-medium text-foreground">
                            {board.owner.displayName || `@${board.owner.username}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-indigo-400">
                          PromptNest Editorial
                        </span>
                      )}

                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>View Board</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-indigo-600 selection:text-white">
      <Header />

      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl py-20 text-center text-xs text-text-muted">
              Loading curated collections...
            </div>
          }
        >
          <CollectionsContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
