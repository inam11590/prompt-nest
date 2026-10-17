import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getCreatorProfileByUsername } from "@/lib/creators/profiles";
import { getPromptsByAuthorId } from "@/lib/data/prompts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromptCard } from "@/components/PromptCard";
import {
  ArrowLeft,
  Globe,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface CreatorDetailPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: CreatorDetailPageProps): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreatorProfileByUsername(username);

  if (!creator || !creator.isPublic) {
    return {
      title: `Creator Not Found — ${siteConfig.name}`,
    };
  }

  const name = creator.displayName || `@${creator.username}`;
  const title = `${name} (@${creator.username}) — AI Prompt Creator — ${siteConfig.name}`;
  const description =
    creator.bio || `Explore curated AI image prompts published by ${name} on ${siteConfig.name}.`;

  const canonicalUrl = `${siteConfig.url}/creators/${creator.username}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "profile",
    },
  };
}

async function CreatorDetailContent({ params }: CreatorDetailPageProps) {
  const { username } = await params;
  const creator = await getCreatorProfileByUsername(username);

  // Return a genuine 404 for nonexistent or inactive public profiles
  if (!creator || !creator.isPublic || !creator.username) {
    notFound();
  }

  const { prompts, total } = await getPromptsByAuthorId(creator.id);
  const initial = (creator.displayName || creator.username).charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link
          href="/creators"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Creators Directory</span>
        </Link>
      </div>

      {/* Creator Profile Header Card */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-3xl shadow-lg shadow-indigo-500/20">
            {initial}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <span>{creator.displayName || `@${creator.username}`}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Creator
                  </span>
                </h1>
                <p className="text-sm font-mono text-indigo-400 font-semibold mt-0.5">
                  @{creator.username}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-raised px-3.5 py-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>
                  {total} {total === 1 ? "Published Prompt" : "Published Prompts"}
                </span>
              </div>
            </div>

            {/* Plain text Bio */}
            {creator.bio && (
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed max-w-3xl whitespace-pre-line">
                {creator.bio}
              </p>
            )}

            {/* Verified HTTPS Website Link */}
            {creator.websiteUrl && (
              <div className="pt-1">
                <a
                  href={creator.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{creator.websiteUrl.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Published Prompts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span>Published Prompts</span>
          </h2>
          <span className="text-xs text-foreground-muted">
            Showing {prompts.length} published {prompts.length === 1 ? "item" : "items"}
          </span>
        </div>

        {prompts.length === 0 ? (
          <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center max-w-md mx-auto">
            <p className="text-sm font-medium text-white">No published prompts yet</p>
            <p className="text-xs text-foreground-muted mt-1">
              This creator has not published any prompt instructions yet.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="break-inside-avoid">
                <PromptCard prompt={prompt} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatorDetailPage(props: CreatorDetailPageProps) {
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
                  Loading creator profile...
                </p>
              </div>
            </div>
          }
        >
          <CreatorDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
