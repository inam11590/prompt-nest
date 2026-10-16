import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles, Calendar, Tag, ExternalLink } from "lucide-react";
import { getPromptBySlug, STARTER_PROMPTS } from "@/data/prompts";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyPromptButton } from "@/components/CopyPromptButton";

interface PromptPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return STARTER_PROMPTS.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: PromptPageProps): Promise<Metadata> {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);

  if (!prompt) {
    return {
      title: "Prompt Not Found",
    };
  }

  return {
    title: `${prompt.title} — ${siteConfig.name}`,
    description: prompt.shortDescription || prompt.prompt.slice(0, 160),
    openGraph: {
      title: `${prompt.title} — ${siteConfig.name}`,
      description: prompt.shortDescription,
      images: [{ url: prompt.imageUrl, alt: prompt.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${prompt.title} — ${siteConfig.name}`,
      description: prompt.shortDescription,
      images: [prompt.imageUrl],
    },
  };
}

export default async function PromptDetailPage({ params }: PromptPageProps) {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  const categoryLabels: Record<string, string> = {
    photography: "Photography",
    "digital-art": "Digital Art",
    architecture: "Architecture",
    "character-design": "Character Design",
    nature: "Nature",
    "graphic-design": "Graphic & UI",
  };

  const formattedDate = new Date(prompt.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Back Navigation Button */}
          <div className="mb-6">
            <Link
              href="/#gallery"
              className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2 text-xs font-medium text-text-muted transition-all hover:bg-surface-raised hover:text-foreground focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Gallery</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Visual Showcase (Left Column) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-surface-border shadow-2xl bg-surface"
                style={{
                  aspectRatio: prompt.aspectRatioValue,
                  backgroundColor: prompt.dominantColor,
                }}
              >
                <Image
                  src={prompt.imageUrl}
                  alt={prompt.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>

              {/* Image Attribution */}
              <div className="flex items-center justify-between text-xs text-text-faint px-1">
                <span>Photo by {prompt.sourceAttribution.author}</span>
                <a
                  href={prompt.sourceAttribution.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-text-muted hover:underline"
                >
                  <span>{prompt.sourceAttribution.source}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Prompt Details & Meta (Right Column) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Badges: Category & Primary Model */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-semibold text-foreground">
                  {categoryLabels[prompt.category] || prompt.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
                  <Sparkles className="h-3 w-3" />
                  {prompt.model}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-text-faint ml-auto">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </span>
              </div>

              {/* Title and Short Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                  {prompt.title}
                </h1>
                <p className="text-sm leading-relaxed text-text-muted">
                  {prompt.shortDescription}
                </p>
              </div>

              {/* Complete Prompt Box */}
              <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-faint">
                    Complete Prompt
                  </span>
                  <CopyPromptButton promptText={prompt.prompt} />
                </div>
                <div className="rounded-xl border border-surface-border-subtle bg-surface-raised p-4 font-mono text-xs leading-relaxed text-foreground select-all break-words">
                  {prompt.prompt}
                </div>
              </div>

              {/* Compatible AI Models */}
              {prompt.compatibleModels && prompt.compatibleModels.length > 0 && (
                <div className="rounded-xl border border-surface-border bg-surface p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-faint mb-2">
                    Compatible AI Models
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {prompt.compatibleModels.map((m) => (
                      <span
                        key={m}
                        className="rounded-lg bg-surface-raised border border-surface-border px-2.5 py-1 text-xs font-medium text-text-muted"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags list */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-faint">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Tags & Descriptors</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface border border-surface-border px-2.5 py-1 text-xs font-medium text-text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
