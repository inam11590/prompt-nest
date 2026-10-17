import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getCurrentUserProfile } from "@/lib/creators/profiles";
import { ProfileSettingsForm } from "@/components/creators/ProfileSettingsForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Creator Profile Settings — ${siteConfig.name}`,
  description: "Manage your PromptNest public creator profile, username, and bio.",
};

async function ProfileSettingsContent() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login?returnTo=/settings/profile");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-xl border border-surface-border bg-surface p-2.5 text-foreground-muted hover:text-white hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Creator Profile Settings</span>
              {profile.isPublic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Public
                </span>
              )}
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Manage your unique username, portfolio link, and public visibility.
            </p>
          </div>
        </div>
      </div>

      <ProfileSettingsForm initialProfile={profile} />
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-xs text-foreground-muted animate-pulse">
                  Loading creator profile...
                </p>
              </div>
            </div>
          }
        >
          <ProfileSettingsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
