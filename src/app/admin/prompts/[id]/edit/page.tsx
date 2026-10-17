import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPromptByIdAdmin } from "@/lib/data/prompts";
import { PromptEditorForm } from "@/components/admin/PromptEditorForm";

export const metadata: Metadata = {
  title: `Edit Prompt — Admin Console — ${siteConfig.name}`,
  robots: {
    index: false,
    follow: false,
  },
};

interface EditPromptPageProps {
  params: Promise<{ id: string }>;
}

async function EditPromptContent({ params }: EditPromptPageProps) {
  const { id } = await params;
  const prompt = await getPromptByIdAdmin(id);

  if (!prompt) {
    notFound();
  }

  return <PromptEditorForm mode="edit" initialPrompt={prompt} />;
}

export default function EditPromptPage(props: EditPromptPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-foreground-muted animate-pulse">
              Loading prompt details...
            </p>
          </div>
        </div>
      }
    >
      <EditPromptContent {...props} />
    </Suspense>
  );
}
