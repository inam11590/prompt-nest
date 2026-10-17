import React, { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: `Create Account — ${siteConfig.name}`,
  description: "Create an account on PromptNest to save and organize your favorite AI image prompts.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 text-center text-xs text-text-muted">
              Loading registration form...
            </div>
          }
        >
          <SignUpForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
