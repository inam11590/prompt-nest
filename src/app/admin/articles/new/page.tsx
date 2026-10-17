import React, { Suspense } from "react";
import type { Metadata } from "next";
import {
  getAvailableAuthorsForAdmin,
  getAvailablePromptsForAdmin,
} from "@/lib/data/articles";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";

export const metadata: Metadata = {
  title: "New Article — PromptNest Admin",
  robots: {
    index: false,
    follow: false,
  },
};

async function NewArticleContent() {
  const [authors, prompts] = await Promise.all([
    getAvailableAuthorsForAdmin(),
    getAvailablePromptsForAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <ArticleEditorForm
        mode="create"
        availableAuthors={authors}
        availablePrompts={prompts}
      />
    </div>
  );
}

export default function NewArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-foreground-muted">
          Loading article editor...
        </div>
      }
    >
      <NewArticleContent />
    </Suspense>
  );
}
