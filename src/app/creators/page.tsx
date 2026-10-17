import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getPublicCreators } from "@/lib/creators/profiles";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Users,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CreatorsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: CreatorsPageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const canonicalUrl =
    page > 1
      ? `${siteConfig.url}/creators?page=${page}`
      : `${siteConfig.url}/creators`;

  return {
    title: `Creator Directory — ${siteConfig.name}`,
    description:
      "Explore AI prompt creators, photographers, digital artists, and prompt engineers sharing curated visual instructions.",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Creator Directory — ${siteConfig.name}`,
      description:
        "Explore AI prompt creators, photographers, digital artists, and prompt engineers sharing curated visual instructions.",
      url: canonicalUrl,
    },
  };
}

async function CreatorsContent({ searchParams }: CreatorsPageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const pageSize = 12;

  const { creators, total } = await getPublicCreators({
    page: currentPage,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Users className="h-3.5 w-3.5" />
          <span>Creator Community</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Prompt Creators
        </h1>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Discover verified visual artists and prompt engineers contributing tested generation instructions to PromptNest.
        </p>
      </div>

      {/* Directory Grid */}
      {creators.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface p-16 text-center max-w-md mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised border border-surface-border text-foreground-muted">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-white">No Public Creators Yet</h2>
          <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
            Creators will be listed here once they activate their public profile and publish prompt instructions.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/settings/profile"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Set Up Creator Profile
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-xs text-foreground-muted hover:text-white transition-colors"
            >
              Browse Gallery
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {creators.map((creator) => {
            const initial = (creator.displayName || creator.username).charAt(0).toUpperCase();

            return (
              <Link
                key={creator.id}
                href={`/creators/${creator.username}`}
                className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-6 hover:border-indigo-500/40 hover:bg-surface-raised/60 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                      {initial}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-400">
                      <Sparkles className="h-3 w-3" />
                      {creator.publishedCount} {creator.publishedCount === 1 ? "prompt" : "prompts"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {creator.displayName || `@${creator.username}`}
                  </h3>
                  <p className="text-xs font-mono text-foreground-muted mt-0.5 truncate">
                    @{creator.username}
                  </p>

                  {creator.bio && (
                    <p className="text-xs text-foreground-muted/90 line-clamp-3 mt-3 leading-relaxed">
                      {creator.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-surface-border/60 flex items-center justify-between text-xs text-indigo-400 font-medium">
                  <span>View Prompts</span>
                  <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border pt-6 text-xs text-foreground-muted">
          <div>
            Page <strong className="text-white">{currentPage}</strong> of{" "}
            <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/creators?page=${currentPage - 1}`}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={`/creators?page=${currentPage + 1}`}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatorsPage(props: CreatorsPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-xs text-foreground-muted animate-pulse">
                  Loading creator directory...
                </p>
              </div>
            </div>
          }
        >
          <CreatorsContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
