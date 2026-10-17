import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/creators/profiles";
import { SubmissionEditorForm } from "@/components/submissions/SubmissionEditorForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: `New Prompt Submission — ${siteConfig.name}`,
  description: "Create a new AI prompt draft or submit for editorial review.",
  robots: {
    index: false,
    follow: false,
  },
};

async function NewSubmissionContent() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/dashboard/submissions/new");
  }

  const profile = await getCurrentUserProfile();
  const hasActiveProfile = Boolean(profile?.isPublic && profile?.username);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <SubmissionEditorForm mode="create" hasActiveProfile={hasActiveProfile} />
    </div>
  );
}

export default function NewSubmissionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-xs text-foreground-muted animate-pulse">
                  Preparing submission form...
                </p>
              </div>
            </div>
          }
        >
          <NewSubmissionContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
