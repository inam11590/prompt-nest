import React, { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: `Sign In — ${siteConfig.name}`,
  description: "Sign in to your PromptNest account to manage and view your saved AI prompts.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 text-center text-xs text-text-muted">
              Loading sign in form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
