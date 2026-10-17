import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { User, Mail, Calendar, Bookmark, Compass, LogOut, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Your Account — ${siteConfig.name}`,
  description: "Manage your PromptNest account and saved prompts.",
};

export default async function AccountPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/account");
  }

  // Fetch user profile from database
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch count of saved prompts
  const { count: bookmarkCount } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const displayName =
    profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
  const email = user.email || "No email";
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header section */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-bold text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{displayName}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </h1>
                <p className="text-xs text-text-muted mt-0.5">{email}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2 text-xs font-semibold text-text-muted hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 cols: Account Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Profile Information
                </h2>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-surface-border-subtle pb-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <User className="h-4 w-4 text-text-faint" />
                      <span>Display Name</span>
                    </div>
                    <span className="font-semibold text-foreground">{displayName}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-surface-border-subtle pb-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Mail className="h-4 w-4 text-text-faint" />
                      <span>Email Address</span>
                    </div>
                    <span className="font-mono text-foreground">{email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar className="h-4 w-4 text-text-faint" />
                      <span>Member Since</span>
                    </div>
                    <span className="text-text-muted">{joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Security & Access */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Account Security
                </h2>
                <p className="text-xs text-text-muted mb-4">
                  Need to change your credentials or update your login details?
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Send password reset email &rarr;
                </Link>
              </div>
            </div>

            {/* Right col: Quick Links & Summary */}
            <div className="space-y-6">
              {/* Saved Prompts Quick Card */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Bookmark className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-black text-amber-400">
                      {bookmarkCount ?? 0}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Saved Prompts</h3>
                  <p className="text-xs text-text-muted mb-4">
                    Your personal collection of bookmarked AI prompts.
                  </p>
                </div>
                <Link
                  href="/saved"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition-all text-center"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>View Saved Prompts</span>
                </Link>
              </div>

              {/* Browse Prompts Card */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Explore Library</h3>
                <p className="text-xs text-text-muted mb-4">
                  Discover more curated visual prompts across Midjourney, Flux, and DALL-E.
                </p>
                <Link
                  href="/#gallery"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-xs font-semibold text-text-muted hover:text-foreground hover:bg-surface transition-all text-center"
                >
                  <span>Browse Gallery &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
