import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Tag,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import {
  getPromptBySlug,
  getAllPromptSlugs,
  getRelatedPrompts,
} from "@/data/prompts";
import {
  getPromptBySlugDb,
} from "@/lib/data/prompts";
import { getGuidesForPrompt } from "@/lib/data/articles";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import { ImageModal } from "@/components/ImageModal";
import { ShareButton } from "@/components/ShareButton";
import { PromptCard } from "@/components/PromptCard";
import { ReturnButton } from "@/components/ReturnButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AddToCollectionButton } from "@/components/collections/AddToCollectionButton";

interface PromptPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getAllPromptSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: PromptPageProps): Promise<Metadata> {
  const { slug } = await params;
  let prompt = getPromptBySlug(slug) || null;
  if (!prompt) {
    prompt = await getPromptBySlugDb(slug).catch(() => null);
  }

  if (!prompt) {
    return {
      title: "Prompt Not Found",
    };
  }

  // Canonical public URL without return-state parameters
  const canonicalUrl = `${siteConfig.url}/prompts/${prompt.slug}`;

  return {
    title: `${prompt.title} — ${siteConfig.name}`,
    description: prompt.shortDescription || prompt.prompt.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${prompt.title} — ${siteConfig.name}`,
      description: prompt.shortDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "article",
      images: [
        {
          url: prompt.imageUrl,
          width: prompt.width,
          height: prompt.height,
          alt: prompt.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${prompt.title} — ${siteConfig.name}`,
      description: prompt.shortDescription,
      images: [prompt.imageUrl],
    },
  };
}

async function PromptDetailContent({ params }: PromptPageProps) {
  const { slug } = await params;
  let prompt = getPromptBySlug(slug) || null;
  if (!prompt) {
    prompt = await getPromptBySlugDb(slug).catch(() => null);
  }

  if (!prompt) {
    notFound();
  }

  // Compute canonical URL for sharing (excludes ?from=)
  const canonicalUrl = `${siteConfig.url}/prompts/${prompt.slug}`;

  // Deterministic related prompts matching (excluding current prompt)
  const relatedPrompts = getRelatedPrompts(prompt, 4);

  // Fetch contextual guides associated with this prompt
  const relatedGuides = await getGuidesForPrompt(prompt.id).catch(() => []);

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

  // Breadcrumb schema (JSON-LD) accurately matching visible navigation
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabels[prompt.category] || prompt.category,
        item: `${siteConfig.url}/?category=${encodeURIComponent(prompt.category)}#gallery`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: prompt.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      {/* Schema.org Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <Header />

      <main className="flex-1 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Top Bar: Return Link & Breadcrumb */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {/* Safe Back Navigation Link wrapped in Suspense for searchParams isolation */}
            <Suspense
              fallback={
                <Link
                  href="/#gallery"
                  className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-muted transition-all hover:bg-surface-raised hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back to Gallery</span>
                </Link>
              }
            >
              <ReturnButton />
            </Suspense>

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-faint">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <Link
                href={`/?category=${encodeURIComponent(prompt.category)}#gallery`}
                className="hover:text-foreground transition-colors"
              >
                {categoryLabels[prompt.category] || prompt.category}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-text-muted truncate max-w-[200px] sm:max-w-[320px]" aria-current="page">
                {prompt.title}
              </span>
            </nav>
          </div>

          {/* Main 2-Column Responsive Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Visual Showcase (Left Column on Desktop, First on Mobile) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Image Area with Accessible Enlargement Modal */}
              <ImageModal
                src={prompt.imageUrl}
                alt={prompt.imageAlt}
                width={prompt.width}
                height={prompt.height}
                aspectRatioValue={prompt.aspectRatioValue}
                dominantColor={prompt.dominantColor}
              />

              {/* Image Attribution */}
              <div className="flex items-center justify-between text-xs text-text-faint px-1">
                <span>Photo by {prompt.sourceAttribution.author}</span>
                <a
                  href={prompt.sourceAttribution.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-text-muted hover:underline"
                  aria-label={`Photo by ${prompt.sourceAttribution.author} on ${prompt.sourceAttribution.source} (opens in new tab)`}
                >
                  <span>{prompt.sourceAttribution.source}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Prompt Details & Actions (Right Column on Desktop, Below on Mobile) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Category, Model, Date & Share Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Pill Link */}
                  <Link
                    href={`/?category=${encodeURIComponent(prompt.category)}#gallery`}
                    className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:bg-surface-raised hover:border-surface-border-subtle transition-all"
                  >
                    {categoryLabels[prompt.category] || prompt.category}
                  </Link>

                  {/* Primary AI Model Link */}
                  <Link
                    href={`/?model=${encodeURIComponent(prompt.model)}#gallery`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition-all"
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    <span>{prompt.model}</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-text-faint">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{formattedDate}</span>
                  </span>
                  <BookmarkButton promptId={prompt.id} variant="detail" />
                  <AddToCollectionButton promptId={prompt.id} variant="detail" />
                  <ShareButton title={prompt.title} url={canonicalUrl} />
                </div>

              </div>

              {/* Title & Short Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                  {prompt.title}
                </h1>
                <p className="text-sm leading-relaxed text-text-muted">
                  {prompt.shortDescription}
                </p>
              </div>

              {/* Creator Attribution Badge (if prompt is community created & author is public) */}
              {prompt.author?.username && (
                <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-sm overflow-hidden">
                      {prompt.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prompt.author.avatarUrl}
                          alt={prompt.author.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        prompt.author.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-text-faint tracking-wider block">
                        Creator
                      </span>
                      <p className="text-xs font-semibold text-white">
                        {prompt.author.displayName || prompt.author.username}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/creators/${prompt.author.username}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                  >
                    <span>@{prompt.author.username}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Prompt Text Section with Copy Button */}
              <section
                aria-labelledby="prompt-heading"
                className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-5 shadow-lg"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 id="prompt-heading" className="text-xs font-bold uppercase tracking-wider text-text-faint">
                    Prompt Text
                  </h2>
                  <CopyPromptButton promptText={prompt.prompt} label="Copy Prompt" />
                </div>
                <div className="rounded-xl border border-surface-border-subtle bg-surface-raised p-4 font-mono text-xs leading-relaxed text-foreground select-all break-words whitespace-pre-wrap">
                  {prompt.prompt}
                </div>
              </section>

              {/* Optional: Negative Prompt Section (only rendered when explicitly stored) */}
              {prompt.negativePrompt && (
                <section
                  aria-labelledby="negative-prompt-heading"
                  className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="negative-prompt-heading"
                      className="text-xs font-bold uppercase tracking-wider text-text-faint"
                    >
                      Negative Prompt
                    </h2>
                    <CopyPromptButton
                      promptText={prompt.negativePrompt}
                      label="Copy Negative"
                      className="bg-zinc-800 hover:bg-zinc-700"
                    />
                  </div>
                  <div className="rounded-xl border border-surface-border-subtle bg-surface-raised p-4 font-mono text-xs leading-relaxed text-text-muted select-all break-words whitespace-pre-wrap">
                    {prompt.negativePrompt}
                  </div>
                </section>
              )}

              {/* Optional: Generation Parameters (only rendered when explicitly stored) */}
              {prompt.generationParameters && Object.keys(prompt.generationParameters).length > 0 && (
                <div className="rounded-xl border border-surface-border bg-surface p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-faint mb-2.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Parameters</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(prompt.generationParameters).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-surface-raised p-2 border border-surface-border-subtle">
                        <dt className="text-[10px] uppercase font-semibold text-text-faint">{key}</dt>
                        <dd className="font-mono text-foreground font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Compatible AI Models */}
              {prompt.compatibleModels && prompt.compatibleModels.length > 0 && (
                <div className="rounded-xl border border-surface-border bg-surface p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-faint mb-2.5">
                    Compatible AI Models
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {prompt.compatibleModels.map((m) => (
                      <Link
                        key={m}
                        href={`/?model=${encodeURIComponent(m)}#gallery`}
                        className="rounded-lg bg-surface-raised border border-surface-border px-2.5 py-1 text-xs font-medium text-text-muted hover:border-blue-500/40 hover:text-foreground transition-colors"
                      >
                        {m}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags & Descriptors */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-faint">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tags & Descriptors</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prompt.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/?q=${encodeURIComponent(tag)}#gallery`}
                      className="rounded-md bg-surface border border-surface-border px-2.5 py-1 text-xs font-medium text-text-muted hover:border-blue-500/40 hover:text-foreground transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related Guides Section */}
          {relatedGuides.length > 0 && (
            <section
              aria-labelledby="related-guides-heading"
              className="mt-16 sm:mt-20 border-t border-surface-border pt-10"
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-light" />
                    <h2
                      id="related-guides-heading"
                      className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                    >
                      Guides & Tutorials Featuring this Prompt
                    </h2>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    In-depth articles and breakdowns demonstrating how to apply and customize this prompt.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-semibold text-brand-light hover:underline"
                >
                  Browse all guides &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/blog/${guide.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-surface-border bg-surface p-5 hover:border-brand/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-text-muted mb-2">
                        <span className="rounded bg-surface-raised px-2 py-0.5 font-semibold text-brand-light uppercase text-[10px]">
                          {guide.category}
                        </span>
                        <span>{guide.readingTimeMinutes} min read</span>
                      </div>
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-brand-light transition">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-text-muted line-clamp-2 mt-2 leading-relaxed">
                        {guide.excerpt}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-surface-border/50 text-[11px] font-semibold text-brand-light group-hover:underline">
                      Read full tutorial &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Prompts Section (below primary content) */}
          {relatedPrompts.length > 0 && (
            <section
              aria-labelledby="related-heading"
              className="mt-16 sm:mt-20 border-t border-surface-border pt-10"
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2
                    id="related-heading"
                    className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                  >
                    Similar & Related Prompts
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Prompts sharing category, aesthetic tags, and AI model compatibility.
                  </p>
                </div>
                <Link
                  href={`/?category=${encodeURIComponent(prompt.category)}#gallery`}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  View all in {categoryLabels[prompt.category] || prompt.category} &rarr;
                </Link>
              </div>

              {/* Related cards gallery grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedPrompts.map((relatedPrompt) => (
                  <PromptCard
                    key={relatedPrompt.id}
                    prompt={relatedPrompt}
                    priority={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PromptDetailPage(props: PromptPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-text-muted text-sm">
          Loading prompt details...
        </div>
      }
    >
      <PromptDetailContent {...props} />
    </Suspense>
  );
}

