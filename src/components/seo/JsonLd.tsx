import React from "react";
import type { PromptItem } from "@/data/prompts";
import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

export interface JsonLdProps<T extends Record<string, unknown>> {
  data: T | T[];
}

/**
 * Reusable, strictly typed server component that safely injects Schema.org JSON-LD scripts
 */
export function JsonLd<T extends Record<string, unknown>>({ data }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Generates Schema.org WebSite + Organization structured data for the homepage
 */
export function generateWebsiteJsonLd(options?: {
  siteUrl?: string;
  siteName?: string;
  description?: string;
}) {
  const url = options?.siteUrl || SITE_URL;
  const name = options?.siteName || SITE_NAME;
  const description =
    options?.description ||
    "The professional AI prompt discovery platform and interactive variable studio for Midjourney, ChatGPT, Claude, Stable Diffusion, and Flux.";

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      url,
      description,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${url}/?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      url,
      logo: `${url}/favicon.ico`,
      sameAs: [
        "https://github.com/inam11590/prompt-nest",
        "https://twitter.com/promptnest",
      ],
    },
  ];
}

/**
 * Generates Schema.org CreativeWork / Prompt structured data for a Prompt Detail Page
 */
export function generatePromptJsonLd(prompt: PromptItem, baseUrl: string = SITE_URL) {
  const cleanUrl = baseUrl.replace(/\/+$/, "");
  const canonicalPromptUrl = `${cleanUrl}/prompts/${prompt.slug}`;

  const interactionStatistics = [];

  if (typeof prompt.likesCount === "number" || prompt.likesCount) {
    interactionStatistics.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: prompt.likesCount,
    });
  }

  if (typeof prompt.copiesCount === "number" || prompt.copiesCount) {
    interactionStatistics.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/DownloadAction",
      userInteractionCount: prompt.copiesCount,
    });
  }

  if (typeof prompt.viewsCount === "number" || prompt.viewsCount) {
    interactionStatistics.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ViewAction",
      userInteractionCount: prompt.viewsCount,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    headline: `${prompt.title} — ${prompt.model} AI Prompt`,
    name: prompt.title,
    description: prompt.shortDescription || prompt.prompt.slice(0, 200),
    image: prompt.imageUrl,
    datePublished: prompt.publishedAt,
    dateModified: prompt.updatedAt || prompt.publishedAt,
    author: {
      "@type": "Person",
      name: prompt.sourceAttribution.author,
      url: prompt.sourceAttribution.authorUrl || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: cleanUrl,
      logo: {
        "@type": "ImageObject",
        url: `${cleanUrl}/favicon.ico`,
      },
    },
    keywords: [prompt.category, prompt.model, ...(prompt.tags || [])].join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalPromptUrl,
    },
    interactionStatistic: interactionStatistics.length > 0 ? interactionStatistics : undefined,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates Schema.org BreadcrumbList structured data
 */
export function generateBreadcrumbJsonLd(items: BreadcrumbItem[], baseUrl: string = SITE_URL) {
  const cleanUrl = baseUrl.replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith("http")
        ? item.url
        : `${cleanUrl}/${item.url.replace(/^\/+/, "")}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}
