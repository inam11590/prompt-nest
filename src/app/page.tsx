import React, { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { HomePageClient } from "@/components/HomePageClient";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  keywords: [
    "AI Prompts",
    "Midjourney Prompts",
    "FLUX Prompts",
    "DALL-E 3 Prompts",
    "Prompt Engineering",
    "Stable Diffusion XL",
    "Prompt Gallery",
  ],
  authors: [{ name: siteConfig.name }],
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-text-muted text-sm">
          Loading PromptNest gallery...
        </div>
      }
    >
      <HomePageClient />
    </Suspense>
  );
}
