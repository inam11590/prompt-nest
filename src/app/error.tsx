"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log sanitized error with digest for debugging (never log secrets or private content)
    console.error("Application error boundary triggered:", {
      message: error?.message,
      digest: error?.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-surface-border bg-surface p-8 text-center shadow-xl space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-xs text-foreground-muted leading-relaxed">
            An unexpected error occurred while processing this request. Our systems have logged this issue.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-foreground-muted/60 bg-surface-elevated px-2 py-1 rounded inline-block">
              Error Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand/90 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated/80 transition"
          >
            <Home className="h-3.5 w-3.5" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
