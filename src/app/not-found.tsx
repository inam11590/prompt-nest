import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Compass, BookOpen, Users, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised border border-surface-border text-brand-light shadow-lg shadow-brand/5">
            <span className="font-mono text-2xl font-bold">404</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Page Not Found
            </h1>
            <p className="text-sm text-foreground-muted leading-relaxed">
              The prompt, creator profile, article, or resource you requested could not be located or may have been removed.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand/90 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
            <Link
              href="/#gallery"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition"
            >
              <Compass className="h-4 w-4" />
              Browse Gallery
            </Link>
          </div>

          <div className="pt-6 border-t border-surface-border flex items-center justify-center gap-6 text-xs text-foreground-muted">
            <Link
              href="/creators"
              className="hover:text-foreground transition inline-flex items-center gap-1"
            >
              <Users className="h-3.5 w-3.5" />
              Creators
            </Link>
            <span>•</span>
            <Link
              href="/blog"
              className="hover:text-foreground transition inline-flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Guides
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
