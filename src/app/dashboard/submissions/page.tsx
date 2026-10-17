import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { getCreatorSubmissions } from "@/lib/data/submissions";
import { getCurrentUserProfile } from "@/lib/creators/profiles";
import { SubmissionsListClient } from "@/components/submissions/SubmissionsListClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: `Your Submissions — ${siteConfig.name}`,
  description: "Manage your AI prompt submissions and monitor editorial review progress.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SubmissionsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

async function SubmissionsContent({ searchParams }: SubmissionsPageProps) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/dashboard/submissions");
  }

  const resolvedParams = await searchParams;
  const status = resolvedParams.status || "all";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const pageSize = 12;

  const [submissionsResult, profile] = await Promise.all([
    getCreatorSubmissions(user.id, {
      status,
      page: currentPage,
      pageSize,
    }),
    getCurrentUserProfile(),
  ]);

  const hasActiveProfile = Boolean(profile?.isPublic && profile?.username);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <SubmissionsListClient
        submissions={submissionsResult.submissions}
        total={submissionsResult.total}
        initialStatus={status}
        currentPage={currentPage}
        pageSize={pageSize}
        hasActiveProfile={hasActiveProfile}
      />
    </div>
  );
}

export default function SubmissionsPage(props: SubmissionsPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-xs text-foreground-muted animate-pulse">
                  Loading your submissions...
                </p>
              </div>
            </div>
          }
        >
          <SubmissionsContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
