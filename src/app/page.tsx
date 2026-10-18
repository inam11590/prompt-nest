import React, { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { HomePageClient } from "@/components/HomePageClient";
import { getPrompts, type GetPromptsOptions } from "@/lib/data/prompts";
import type {
  StyleOccasion,
  StyleSetting,
  StyleLighting,
  StyleFraming,
  StyleWorkflow,
} from "@/data/prompts";

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

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-text-muted text-sm">
          Loading PromptNest gallery...
        </div>
      }
    >
      <HomePageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomePageContent({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;

  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : "";
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : "all";
  const model = typeof resolvedParams.model === "string" ? resolvedParams.model : "All Models";
  const sort: "newest" | "title-asc" | "title-desc" =
    resolvedParams.sort === "title-asc" || resolvedParams.sort === "title-desc"
      ? resolvedParams.sort
      : "newest";
  const page = typeof resolvedParams.page === "string" ? Math.max(1, parseInt(resolvedParams.page, 10) || 1) : 1;

  const occasion =
    typeof resolvedParams.occasion === "string" && resolvedParams.occasion !== "all"
      ? (resolvedParams.occasion as StyleOccasion)
      : undefined;

  const setting =
    typeof resolvedParams.setting === "string" && resolvedParams.setting !== "all"
      ? (resolvedParams.setting as StyleSetting)
      : undefined;

  const lighting =
    typeof resolvedParams.lighting === "string" && resolvedParams.lighting !== "all"
      ? (resolvedParams.lighting as StyleLighting)
      : undefined;

  const framing =
    typeof resolvedParams.framing === "string" && resolvedParams.framing !== "all"
      ? (resolvedParams.framing as StyleFraming)
      : undefined;

  const workflow =
    typeof resolvedParams.workflow === "string" && resolvedParams.workflow !== "all"
      ? (resolvedParams.workflow as StyleWorkflow)
      : undefined;

  const options: GetPromptsOptions = {
    query,
    category,
    model,
    sort,
    page,
    pageSize: 8,
    occasion,
    setting,
    lighting,
    framing,
    workflow,
  };

  const { prompts, totalMatching, source } = await getPrompts(options);

  return (
    <HomePageClient
      initialPrompts={prompts}
      initialTotalMatching={totalMatching}
      initialSource={source}
    />
  );
}
