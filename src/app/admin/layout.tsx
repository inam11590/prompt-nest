import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getAdminSession } from "@/lib/auth/admin";
import { signOutAction } from "@/app/actions/auth";
import { connection } from "next/server";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  ExternalLink,
  LogOut,
  Sparkles,
  Inbox,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: `Admin Console — ${siteConfig.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground-muted animate-pulse">
          Verifying administrator credentials...
        </p>
      </div>
    </div>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getAdminSession();

  // If not authenticated or not in the admin_users role table
  if (!session || !session.isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-surface-border bg-surface p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
            Administrator Access Required
          </h1>

          <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
            {session?.user
              ? `Signed in as ${session.user.email}. This account is not registered in the administrator role membership table.`
              : "You must be signed in with a verified administrator account to access this console."}
          </p>

          <div className="flex flex-col gap-3">
            {!session?.user ? (
              <Link
                href="/login?returnTo=/admin"
                className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Sign In to Admin Console
              </Link>
            ) : (
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-border transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out and Switch Account
                </button>
              </form>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center text-xs text-foreground-muted hover:text-foreground transition-colors py-1"
            >
              Return to Public Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-foreground">PromptNest</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                Prompts
              </Link>
              <Link
                href="/admin/submissions"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <Inbox className="h-4 w-4 text-amber-400" />
                Submissions
              </Link>
              <Link
                href="/admin/articles"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <BookOpen className="h-4 w-4 text-purple-400" />
                Articles
              </Link>
              <Link
                href="/admin/prompts/new"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                New Prompt
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-border transition-colors"
              title="Open public gallery in a new tab"
            >
              <span>View Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-surface-border">
              <div className="text-right">
                <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                  {session.user.email}
                </p>
                <p className="text-[10px] text-emerald-400">Verified Admin</p>
              </div>
            </div>

            <ThemeToggle />

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised p-2 text-foreground-muted hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                title="Sign out of Admin Console"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoadingSkeleton />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
