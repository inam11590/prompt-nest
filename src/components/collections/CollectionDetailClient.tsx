"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Folder,
  ArrowLeft,
  Lock,
  Globe,
  Share2,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Loader2,
  Save,
  Check,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { CollectionWithItems, CollectionVisibility } from "@/types/collections";
import {
  updateCollectionAction,
  deleteCollectionAction,
  removePromptFromCollectionAction,
  reorderCollectionItemsAction,
} from "@/app/actions/collections";

interface CollectionDetailClientProps {
  collection: CollectionWithItems;
  canonicalBaseUrl: string;
}

export function CollectionDetailClient({
  collection: initialCollection,
  canonicalBaseUrl,
}: CollectionDetailClientProps) {
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionWithItems>(initialCollection);
  const [title, setTitle] = useState(initialCollection.title);
  const [description, setDescription] = useState(initialCollection.description || "");
  const [visibility, setVisibility] = useState<CollectionVisibility>(initialCollection.visibility);
  const [items, setItems] = useState(initialCollection.items);

  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const publicUrl = `${canonicalBaseUrl}/collections/${collection.publicId}`;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setErrorMsg("Failed to copy link to clipboard.");
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg("Title cannot be empty.");
      return;
    }

    setIsSavingMeta(true);
    setErrorMsg(null);

    const res = await updateCollectionAction(collection.id, {
      title: trimmedTitle,
      description: description.trim() || null,
      visibility,
      expectedVersion: collection.concurrencyVersion,
    });

    setIsSavingMeta(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || "Failed to update collection.");
      return;
    }

    setCollection((prev) => ({
      ...prev,
      title: trimmedTitle,
      description: description.trim() || null,
      visibility,
      concurrencyVersion: res.data!.newVersion,
    }));

    setFeedback("Collection settings saved successfully.");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleVisibility = async () => {
    const nextVisibility: CollectionVisibility =
      visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    setIsSavingMeta(true);
    setErrorMsg(null);

    const res = await updateCollectionAction(collection.id, {
      visibility: nextVisibility,
      expectedVersion: collection.concurrencyVersion,
    });

    setIsSavingMeta(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || "Failed to change visibility.");
      return;
    }

    setVisibility(nextVisibility);
    setCollection((prev) => ({
      ...prev,
      visibility: nextVisibility,
      concurrencyVersion: res.data!.newVersion,
    }));

    setFeedback(
      nextVisibility === "PUBLIC"
        ? "Collection is now Public and shareable!"
        : "Collection is now Private."
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    const res = await deleteCollectionAction(collection.id);
    setIsDeleting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to delete collection.");
      setShowDeleteModal(false);
      return;
    }

    router.push("/dashboard/collections");
  };

  const handleRemoveItem = async (promptId: string, itemTitle: string) => {
    const previousItems = items;
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.promptId !== promptId));

    startTransition(async () => {
      const res = await removePromptFromCollectionAction(collection.id, promptId);
      if (!res.success) {
        setItems(previousItems);
        setErrorMsg(res.error || "Failed to remove prompt.");
      } else {
        setCollection((prev) => ({
          ...prev,
          concurrencyVersion: prev.concurrencyVersion + 1,
        }));
        setFeedback(`Removed "${itemTitle}" from collection.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update positions
    const updatedWithPos = reordered.map((item, idx) => ({
      ...item,
      position: idx,
    }));

    const previousItems = items;
    setItems(updatedWithPos);
    setIsReordering(true);
    setErrorMsg(null);

    const itemIds = updatedWithPos.map((i) => i.id);
    const res = await reorderCollectionItemsAction(
      collection.id,
      collection.concurrencyVersion,
      itemIds
    );

    setIsReordering(false);

    if (!res.success || !res.data) {
      setItems(previousItems);
      setErrorMsg(res.error || "Failed to update item order.");
    } else {
      setCollection((prev) => ({
        ...prev,
        concurrencyVersion: res.data!.newVersion,
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Nav & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/collections"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Collections</span>
        </Link>

        {visibility === "PUBLIC" && (
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Link!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Public Link</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Live Feedback Banners */}
      {feedback && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-medium text-emerald-400">
          {feedback}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-medium text-rose-400">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Settings & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Collection Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-500" />
              <span>Collection Details</span>
            </h2>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Curator notes or overview..."
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
                <span className="block text-right text-[10px] text-text-faint mt-1">
                  {description.length} / 500
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingMeta}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  {isSavingMeta ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

            {/* Visibility Toggle Box */}
            <div className="mt-6 pt-6 border-t border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">Visibility</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    visibility === "PUBLIC"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400"
                  }`}
                >
                  {visibility === "PUBLIC" ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Private
                    </>
                  )}
                </span>
              </div>

              <p className="text-xs text-text-faint leading-relaxed">
                {visibility === "PUBLIC"
                  ? "Anyone with the link can view published prompts in this collection."
                  : "Only you can see this collection and its contents."}
              </p>

              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={isSavingMeta}
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-raised/80 transition-all"
              >
                Make {visibility === "PUBLIC" ? "Private" : "Public"}
              </button>

              {visibility === "PUBLIC" && (
                <div className="pt-2">
                  <Link
                    href={`/collections/${collection.publicId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-border bg-surface-raised/50 px-3 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Public View</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Danger Zone: Delete */}
            <div className="mt-6 pt-6 border-t border-rose-500/20">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Collection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Ordered Prompts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Collection Items</span>
              <span className="rounded-full bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 font-bold">
                {items.length}
              </span>
            </h2>

            {isReordering && (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                <span>Saving order...</span>
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-border bg-surface/50 p-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-text-faint mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No prompts in this collection yet</h3>
              <p className="mt-1 text-xs text-text-muted max-w-sm mx-auto">
                Explore the gallery and click the &quot;Add to collection&quot; button on any prompt card.
              </p>
              <Link
                href="/#gallery"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
              >
                Browse Gallery
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const prompt = item.prompt;
                if (!prompt) return null;

                const isFirst = index === 0;
                const isLast = index === items.length - 1;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-surface-border bg-surface hover:bg-surface-raised/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Reorder Up / Down Accessible Controls */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isFirst || isReordering}
                          onClick={() => handleMove(index, "up")}
                          aria-label={`Move ${prompt.title} up`}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-border bg-surface-raised text-text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast || isReordering}
                          onClick={() => handleMove(index, "down")}
                          aria-label={`Move ${prompt.title} down`}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-border bg-surface-raised text-text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Prompt Thumbnail */}
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-surface-raised border border-surface-border">
                        <Image
                          src={prompt.imageUrl}
                          alt={prompt.imageAlt || prompt.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      {/* Prompt Title & Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-text-faint">
                            #{index + 1}
                          </span>
                          <span className="text-[10px] rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.2 text-blue-400 font-medium">
                            {prompt.model}
                          </span>
                        </div>
                        <Link
                          href={`/prompts/${prompt.slug}`}
                          className="block text-sm font-semibold text-foreground truncate hover:text-blue-400 transition-colors"
                        >
                          {prompt.title}
                        </Link>
                        <p className="text-xs text-text-muted truncate max-w-md">
                          {prompt.shortDescription}
                        </p>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(prompt.id, prompt.title)}
                      aria-label={`Remove ${prompt.title} from collection`}
                      title="Remove from collection"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Collection Deletion"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-[#150208]/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#380B1A] p-6 shadow-2xl relative text-foreground">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-base font-bold text-foreground">Delete this collection?</h2>
            </div>

            <p className="text-xs leading-relaxed text-text-muted mb-6">
              Are you sure you want to delete <strong>&quot;{collection.title}&quot;</strong>?
              This action cannot be undone. Prompts and bookmarks will not be affected.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-text-muted hover:bg-surface-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
