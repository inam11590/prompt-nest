"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/app/actions/auth";
import { Sparkles, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updatePasswordAction(formData);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to update password.");
      } else {
        setSuccessMessage(
          result.message || "Password updated successfully! You can now sign in with your new password."
        );
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
          Set New Password
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          Choose a secure new password for your PromptNest account
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

      {successMessage ? (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-xs text-emerald-300 leading-relaxed font-medium">
            {successMessage}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors"
            >
              Sign In with New Password
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-text-muted mb-1.5"
            >
              New Password <span className="text-text-faint font-normal">(min 6 characters)</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
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
            {isPending ? "Updating password..." : "Update Password"}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-surface-border pt-4 text-center text-xs text-text-muted">
        Back to{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
