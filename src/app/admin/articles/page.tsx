import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminArticles, getAdminArticleStats } from "@/lib/data/articles";
import { AdminArticlesListClient } from "@/components/admin/AdminArticlesListClient";

export const metadata: Metadata = {
  title: "Articles Management — PromptNest Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminArticlesPageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

async function ArticlesContent({ searchParams }: AdminArticlesPageProps) {
  const resolvedParams = await searchParams;
  const status = resolvedParams.status || "all";
  const query = resolvedParams.q || "";
  const page = parseInt(resolvedParams.page || "1", 10);

  const [articlesData, stats] = await Promise.all([
    getAdminArticles({
      status,
      query,
      page,
      pageSize: 15,
    }),
    getAdminArticleStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <AdminArticlesListClient
        initialArticles={articlesData.articles}
        total={articlesData.total}
        currentStatus={status}
        stats={stats}
      />
    </div>
  );
}

export default function AdminArticlesPage(props: AdminArticlesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-foreground-muted">
          Loading editorial articles...
        </div>
      }
    >
      <ArticlesContent {...props} />
    </Suspense>
  );
}
