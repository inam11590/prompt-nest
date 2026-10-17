import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminSubmissions } from "@/lib/data/submissions";
import { AdminModerationClient } from "@/components/admin/AdminModerationClient";

export const metadata: Metadata = {
  title: "Submissions Moderation — PromptNest Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminSubmissionsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function SubmissionsContent({ searchParams }: AdminSubmissionsPageProps) {
  const resolvedParams = await searchParams;
  const status = resolvedParams.status || "PENDING_REVIEW";
  const page = parseInt(resolvedParams.page || "1", 10);

  const { submissions, total } = await getAdminSubmissions({
    status,
    page,
    pageSize: 20,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Submissions Moderation
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Review community submitted prompts, inspect staged assets, provide editorial feedback, or approve for public library publication.
        </p>
      </div>

      <AdminModerationClient
        initialSubmissions={submissions}
        currentStatus={status}
        total={total}
      />
    </div>
  );
}

export default function AdminSubmissionsPage(props: AdminSubmissionsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-foreground-muted">
          Loading moderation queue...
        </div>
      }
    >
      <SubmissionsContent {...props} />
    </Suspense>
  );
}
