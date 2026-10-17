import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticleByIdAdmin,
  getAvailableAuthorsForAdmin,
  getAvailablePromptsForAdmin,
} from "@/lib/data/articles";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";

export const metadata: Metadata = {
  title: "Edit Article — PromptNest Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

async function EditArticleContent({ params }: EditArticlePageProps) {
  const { id } = await params;

  const [articleResult, authors, prompts] = await Promise.all([
    getArticleByIdAdmin(id),
    getAvailableAuthorsForAdmin(),
    getAvailablePromptsForAdmin(),
  ]);

  if (!articleResult) {
    notFound();
  }

  const { article, promptIds } = articleResult;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <ArticleEditorForm
        mode="edit"
        initialArticle={article}
        initialPromptIds={promptIds}
        availableAuthors={authors}
        availablePrompts={prompts}
      />
    </div>
  );
}

export default function EditArticlePage(props: EditArticlePageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-foreground-muted">
          Loading article for editing...
        </div>
      }
    >
      <EditArticleContent {...props} />
    </Suspense>
  );
}
