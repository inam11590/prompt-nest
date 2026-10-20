import React, { Suspense } from "react";
import type { Metadata } from "next";
import { HomePageClient } from "@/components/HomePageClient";
import { getPrompts, type GetPromptsOptions } from "@/lib/data/prompts";
import type {
  StyleOccasion,
  StyleSetting,
  StyleLighting,
  StyleFraming,
  StyleWorkflow,
} from "@/data/prompts";

import { constructMetadata } from "@/lib/seo/config";
import { JsonLd, generateWebsiteJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  canonicalPath: "/",
});

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
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <HomePageClient
        initialPrompts={prompts}
        initialTotalMatching={totalMatching}
        initialSource={source}
      />
    </>
  );
}
