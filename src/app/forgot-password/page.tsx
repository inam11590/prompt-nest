import React from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: `Forgot Password — ${siteConfig.name}`,
  description: "Recover access to your PromptNest account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <ForgotPasswordForm />
      </main>
      <Footer />
    </div>
  );
}
