import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/creators/profiles";
import { getSubmissionById } from "@/lib/data/submissions";
import { SubmissionEditorForm } from "@/components/submissions/SubmissionEditorForm";
import { SubmissionDetailView } from "@/components/submissions/SubmissionDetailView";

interface SubmissionPageProps {
  params: Promise<{ id: string }>;
}

async function SubmissionContent({ params }: SubmissionPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    redirect(`/login?next=/dashboard/submissions/${id}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/dashboard/submissions/${id}`);
  }

  const submission = await getSubmissionById(id, user.id);
  if (!submission) {
    notFound();
  }

  // Check creator profile activation
  const profile = await getCurrentUserProfile();
  const hasActiveProfile = !!profile?.isPublic && !!profile?.username;

  // If status is editable (DRAFT or CHANGES_REQUESTED)
  const isEditable = submission.status === "DRAFT" || submission.status === "CHANGES_REQUESTED";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {isEditable ? (
        <SubmissionEditorForm
          mode="edit"
          initialSubmission={submission}
          hasActiveProfile={hasActiveProfile}
        />
      ) : (
        <SubmissionDetailView submission={submission} />
      )}
    </div>
  );
}

export default function SubmissionPage(props: SubmissionPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-foreground-muted">
          Loading submission details...
        </div>
      }
    >
      <SubmissionContent {...props} />
    </Suspense>
  );
}
