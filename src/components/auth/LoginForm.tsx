"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/actions/auth";
import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";
  const urlError = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(urlError);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);
    formData.set("returnTo", returnTo);

    startTransition(async () => {
      try {
        const result = await signInAction(formData);
        if (result && !result.success && result.error) {
          setErrorMessage(result.error);
        }
      } catch (err: unknown) {
        const errorObj = err as { message?: string; digest?: string };
        // In Next.js, redirect() throws a NEXT_REDIRECT error which should not be caught as an application error
        if (errorObj?.message === "NEXT_REDIRECT" || errorObj?.digest?.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setErrorMessage(errorObj?.message || "An unexpected error occurred during sign in.");
      }
    });
  };


  return (
    <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Sign In to PromptNest
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          Access your saved prompts and prompt collection
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-text-muted mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-text-faint focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-text-muted"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-text-faint focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 mt-2"
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 border-t border-surface-border pt-4 text-center text-xs text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${returnTo !== "/account" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}
