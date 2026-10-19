"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import {
  Sparkles,
  Menu,
  X,
  Bookmark,
  User as UserIcon,
  Send,
  Folder,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { openCommandPalette } from "@/components/search/command-palette";

function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label="Main Navigation"
    >
      {siteConfig.navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname?.startsWith(item.href) && item.href !== "/";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3.5 py-1.5 text-xs transition-all focus-visible:ring-2 ${
              isActive
                ? "bg-surface-raised text-foreground font-semibold border border-surface-border shadow-sm"
                : "text-text-muted hover:bg-surface-raised/70 hover:text-foreground font-medium"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
      {siteConfig.navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname?.startsWith(item.href) && item.href !== "/";
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-surface-raised text-foreground font-semibold"
                : "text-text-muted hover:bg-surface-raised hover:text-foreground font-medium"
            }`}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/80 backdrop-blur-xl transition-all duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 tracking-tight text-foreground transition-transform hover:scale-[1.02]"
            aria-label={`${siteConfig.name} Home`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-extrabold sm:text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-text-muted bg-clip-text">
                {siteConfig.name}
              </span>
              <span className="hidden text-[10px] font-medium tracking-wider text-text-faint sm:inline-block uppercase">
                AI Discovery
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links wrapped in Suspense for Next.js 16 Partial Prerendering */}
        <Suspense
          fallback={
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
              {siteConfig.navItems.map((item) => (
                <span
                  key={item.href}
                  className="rounded-full px-3.5 py-1.5 text-xs text-text-muted font-medium"
                >
                  {item.label}
                </span>
              ))}
            </nav>
          }
        >
          <DesktopNav />
        </Suspense>

        {/* Right Action Area */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Spotlight Search Trigger (Cmd+K) */}
          <button
            type="button"
            onClick={openCommandPalette}
            className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs text-text-muted transition-all hover:border-indigo-500/40 hover:bg-surface-raised hover:text-foreground shadow-sm focus-visible:ring-2 cursor-pointer"
            aria-label="Open search spotlight (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline text-[11px]">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-surface-raised border border-surface-border px-1.5 py-0.5 text-[10px] font-mono text-text-faint">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Saved Prompts Link */}
          <Link
            href="/saved"
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted transition-all hover:border-surface-border-subtle hover:bg-surface-raised hover:text-foreground focus-visible:ring-2"
            aria-label="View saved prompts"
          >
            <Bookmark className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Saved</span>
          </Link>

          {/* Creator Submissions Link */}
          {user && (
            <Link
              href="/dashboard/submissions"
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted transition-all hover:bg-surface-raised hover:text-foreground focus-visible:ring-2"
              aria-label="Creator submissions dashboard"
            >
              <Send className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Submissions</span>
            </Link>
          )}

          {/* Prompt Collections Link */}
          {user && (
            <Link
              href="/dashboard/collections"
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted transition-all hover:bg-surface-raised hover:text-foreground focus-visible:ring-2"
              aria-label="Prompt collections"
            >
              <Folder className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden lg:inline">Collections</span>
            </Link>
          )}

          {/* User Auth Link */}
          {user ? (
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20 focus-visible:ring-2"
              aria-label="Account Settings"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline max-w-[100px] truncate">
                {user.user_metadata?.display_name || user.email?.split("@")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95 focus-visible:ring-2"
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu toggle button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-surface text-text-muted transition-colors hover:text-foreground md:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <div className="border-b border-surface-border bg-surface/95 backdrop-blur-xl px-4 py-4 md:hidden space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Suspense fallback={<div className="h-20" />}>
            <MobileNavLinks onClose={() => setIsMobileMenuOpen(false)} />
          </Suspense>
          <div className="pt-2 border-t border-surface-border flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openCommandPalette();
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-400 hover:bg-surface-raised text-left cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>Search Prompts (⌘K)</span>
            </button>
            <Link
              href="/saved"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-surface-raised"
            >
              <Bookmark className="h-4 w-4" />
              <span>Saved Prompts</span>
            </Link>
            {user && (
              <Link
                href="/dashboard/submissions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-surface-raised"
              >
                <Send className="h-4 w-4" />
                <span>My Submissions</span>
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard/collections"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-surface-raised"
              >
                <Folder className="h-4 w-4" />
                <span>My Collections</span>
              </Link>
            )}
            {user ? (
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-surface-raised"
              >
                <UserIcon className="h-4 w-4" />
                <span>My Account</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-400 transition-colors hover:bg-surface-raised"
              >
                <span>Sign In / Create Account</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
