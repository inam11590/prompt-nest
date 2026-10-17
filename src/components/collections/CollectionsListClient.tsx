"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  Plus,
  Lock,
  Globe,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import type { Collection } from "@/types/collections";
import { createCollectionAction } from "@/app/actions/collections";

interface CollectionsListClientProps {
  collections: Collection[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export function CollectionsListClient({
  collections,
  total,
  currentPage,
  pageSize,
}: CollectionsListClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createCollectionAction({
      title: title.trim(),
      description: description.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || "Failed to create collection.");
      return;
    }

    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    router.push(`/dashboard/collections/${res.data.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderPlus className="h-7 w-7 text-blue-500" />
            <span>Prompt Collections</span>
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Organize prompts into private or public shareable collections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-600 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center max-w-xl mx-auto my-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-4">
            <FolderPlus className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">No collections yet</h2>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Create collections to group related prompts, organize ideas, or share curated sets publicly.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create your first collection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => {
            const updatedDate = new Date(col.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={col.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-5 shadow-sm transition-all hover:border-surface-border/80 hover:bg-surface-raised/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {col.visibility === "PUBLIC" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <Globe className="h-3 w-3" />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
                        <Lock className="h-3 w-3" />
                        Private
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-faint">
                      <Sparkles className="h-3 w-3 text-blue-400" />
                      <span>{col.itemCount ?? 0} {col.itemCount === 1 ? "prompt" : "prompts"}</span>
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/collections/${col.id}`}
                    className="block font-bold text-base text-foreground group-hover:text-blue-400 transition-colors"
                  >
                    {col.title}
                  </Link>

                  {col.description && (
                    <p className="mt-1.5 text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {col.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-text-faint">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {updatedDate}
                  </span>

                  <div className="flex items-center gap-3">
                    {col.visibility === "PUBLIC" && (
                      <Link
                        href={`/collections/${col.publicId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-text-muted hover:text-foreground transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="text-[11px]">View</span>
                      </Link>
                    )}

                    <Link
                      href={`/dashboard/collections/${col.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Manage</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => router.push(`/dashboard/collections?page=${currentPage - 1}`)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-raised disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-text-muted px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => router.push(`/dashboard/collections?page=${currentPage + 1}`)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-raised disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create New Collection"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl relative text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <h2 className="text-base font-bold flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-blue-500" />
                <span>Create New Collection</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Collection Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Characters, Minimalist Architecture"
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief plain-text description of this curated set..."
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2 text-xs text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
                <span className="block text-right text-[10px] text-text-faint mt-1">
                  {description.length} / 500
                </span>
              </div>

              <div className="rounded-xl border border-surface-border/60 bg-surface-raised/30 p-3 text-xs text-text-faint flex items-center gap-2">
                <Lock className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>New collections are <strong>Private</strong> by default. You can publish your collection anytime.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-text-muted hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Collection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
