"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Sparkles, Menu, X } from "lucide-react";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-transform hover:scale-[1.02]"
            aria-label={`${siteConfig.name} Home`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold sm:text-lg">
                {siteConfig.name}
              </span>
              <span className="hidden text-[10px] font-medium tracking-wide text-text-faint sm:inline-block">
                Prompt Discovery
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main Navigation"
        >
          {siteConfig.navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:ring-2"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Area */}
        <div className="flex items-center gap-2">
          {/* Quick badge */}
          <span className="hidden items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1 text-xs font-semibold text-emerald-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            12 Curated Prompts
          </span>

          {/* Mobile menu toggle button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface text-text-muted transition-colors hover:text-foreground md:hidden"
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
        <div className="border-b border-surface-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile Navigation">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
