import type { Metadata } from "next";

export const SITE_NAME = "PromptNest";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://prompt-nest-pi.vercel.app";

export const DEFAULT_TITLE =
  "PromptNest — Discover, Test & Share Elite AI Prompts";
export const DEFAULT_DESCRIPTION =
  "The professional AI prompt discovery platform and interactive variable studio for Midjourney, ChatGPT, Claude, Stable Diffusion, and Flux.";

export const DEFAULT_KEYWORDS = [
  "AI Prompts",
  "Midjourney Prompts",
  "Flux Prompts",
  "DALL-E 3 Prompts",
  "ChatGPT Prompts",
  "Stable Diffusion",
  "Prompt Engineering",
  "AI Image Generator",
  "Prompt Library",
  "Negative Prompts",
  "Prompt Variable Studio",
];

export interface ConstructMetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
}

/**
 * Builds a standardized, production-grade Next.js Metadata configuration
 * with clean canonical URLs, OpenGraph previews, Twitter Cards, and robot directives.
 */
export function constructMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  canonicalPath = "",
  noIndex = false,
  keywords = DEFAULT_KEYWORDS,
  type = "website",
}: ConstructMetadataOptions = {}): Metadata {
  const cleanSiteUrl = SITE_URL.replace(/\/+$/, "");
  // Clean canonical path by removing leading slash and any tracking query params
  const cleanPath = canonicalPath ? canonicalPath.split("?")[0].replace(/^\/+/, "") : "";
  const canonicalUrl = cleanPath ? `${cleanSiteUrl}/${cleanPath}` : cleanSiteUrl;

  const resolvedTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;

  const defaultOgImage = `${cleanSiteUrl}/api/og?title=${encodeURIComponent(
    title || DEFAULT_TITLE
  )}`;
  const ogImageUrl = image || defaultOgImage;

  return {
    metadataBase: new URL(cleanSiteUrl),
    title: title
      ? {
          default: resolvedTitle,
          template: `%s | ${SITE_NAME}`,
        }
      : {
          default: DEFAULT_TITLE,
          template: `%s | ${SITE_NAME}`,
        },
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: cleanSiteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      url: canonicalUrl,
      title: resolvedTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [ogImageUrl],
      creator: "@promptnest",
      site: "@promptnest",
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
