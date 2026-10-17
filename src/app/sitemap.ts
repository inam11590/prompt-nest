import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/server";
import { STARTER_PROMPTS } from "@/data/prompts";
import { getPublicCreators } from "@/lib/creators/profiles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  // 1. Static Indexable Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creators`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 2. Published Prompts
  let promptRoutes: MetadataRoute.Sitemap = [];
  const supabase = createPublicClient();

  if (supabase) {
    const { data: dbPrompts } = await supabase
      .from("prompts")
      .select("slug, updated_at, published_at")
      .eq("status", "published");

    if (dbPrompts && dbPrompts.length > 0) {
      promptRoutes = dbPrompts.map((p) => ({
        url: `${baseUrl}/prompts/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : p.published_at ? new Date(p.published_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  }

  // Fallback to starter prompts if DB prompts were not available
  if (promptRoutes.length === 0) {
    promptRoutes = STARTER_PROMPTS.map((p) => ({
      url: `${baseUrl}/prompts/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  }

  // 3. Published Articles
  let articleRoutes: MetadataRoute.Sitemap = [];
  if (supabase) {
    const { data: dbArticles } = await supabase
      .from("articles")
      .select("slug, last_edited_at, updated_at, published_at")
      .eq("status", "PUBLISHED");

    if (dbArticles && dbArticles.length > 0) {
      articleRoutes = dbArticles.map((a) => ({
        url: `${baseUrl}/blog/${a.slug}`,
        lastModified: a.last_edited_at
          ? new Date(a.last_edited_at)
          : a.updated_at
          ? new Date(a.updated_at)
          : a.published_at
          ? new Date(a.published_at)
          : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  }

  // 4. Public Activated Creators (with at least 1 published prompt)
  let creatorRoutes: MetadataRoute.Sitemap = [];
  try {
    const { creators } = await getPublicCreators({ page: 1, pageSize: 500 });
    creatorRoutes = (creators || []).map((c) => ({
      url: `${baseUrl}/creators/${c.username}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (err) {
    console.error("sitemap: error fetching creators:", err);
  }

  return [...staticRoutes, ...articleRoutes, ...promptRoutes, ...creatorRoutes];
}
