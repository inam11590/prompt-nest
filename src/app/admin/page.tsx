import React, { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import {
  getAdminPrompts,
  getAdminStats,
  getAuditLogsAdmin,
} from "@/lib/data/prompts";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: `Prompts Dashboard — Admin Console — ${siteConfig.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    category?: string;
    model?: string;
    sort?: string;
    page?: string;
  }>;
}

async function AdminPageContent({ searchParams }: AdminPageProps) {
  const resolvedParams = await searchParams;

  const status = (resolvedParams.status || "all") as "all" | "draft" | "published" | "archived";
  const query = resolvedParams.q || "";
  const category = resolvedParams.category || "all";
  const model = resolvedParams.model || "All Models";
  const sort = (resolvedParams.sort || "newest") as "newest" | "oldest" | "title-asc" | "title-desc" | "updated";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const pageSize = 15;

  const [promptsResult, stats, auditLogs] = await Promise.all([
    getAdminPrompts({
      status,
      query,
      category,
      model,
      sort,
      page: currentPage,
      pageSize,
    }),
    getAdminStats(),
    getAuditLogsAdmin(15),
  ]);

  return (
    <AdminDashboardClient
      prompts={promptsResult.prompts}
      totalMatching={promptsResult.totalMatching}
      stats={stats}
      auditLogs={auditLogs}
      initialStatus={status}
      initialQuery={query}
      initialCategory={category}
      initialModel={model}
      initialSort={sort}
      currentPage={currentPage}
      pageSize={pageSize}
    />
  );
}

export default function AdminPage(props: AdminPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-foreground-muted animate-pulse">
              Loading administration catalog...
            </p>
          </div>
        </div>
      }
    >
      <AdminPageContent {...props} />
    </Suspense>
  );
}
