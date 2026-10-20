"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { FolderPlus, Check, Plus, X, Loader2, Lock, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getUserCollectionsForPromptAction,
  addPromptToCollectionAction,
  removePromptFromCollectionAction,
  createCollectionAction,
} from "@/app/actions/collections";

interface AddToCollectionButtonProps {
  promptId: string;
  variant?: "card" | "detail";
  isAuthenticated?: boolean;
  className?: string;
}

interface CollectionItemState {
  id: string;
  title: string;
  visibility: string;
  hasPrompt: boolean;
  isPending?: boolean;
}

export function AddToCollectionButton({
  promptId,
  variant = "card",
  isAuthenticated: propIsAuthenticated = false,
  className = "",
}: AddToCollectionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [clientIsAuthenticated, setClientIsAuthenticated] = useState<boolean | null>(null);
  const [collections, setCollections] = useState<CollectionItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isAuthenticated =
    clientIsAuthenticated !== null ? clientIsAuthenticated : propIsAuthenticated;

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setClientIsAuthenticated(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setClientIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = await getUserCollectionsForPromptAction(promptId);
      setCollections(items);
    } catch {
      setErrorMsg("Failed to load your collections.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const returnTarget = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(returnTarget)}`);
      return;
    }

    setIsOpen(true);
    loadCollections();
  };

  const handleClose = () => {
    setIsOpen(false);
    setFeedback(null);
    setErrorMsg(null);
    setNewTitle("");
  };

  // Keyboard accessibility and focus trap
  useEffect(() => {
    if (!isOpen) {
      triggerRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleCollectionItem = (col: CollectionItemState) => {
    const willAdd = !col.hasPrompt;

    // Optimistic toggle
    setCollections((prev) =>
      prev.map((c) =>
        c.id === col.id ? { ...c, hasPrompt: willAdd, isPending: true } : c
      )
    );

    startTransition(async () => {
      const res = willAdd
        ? await addPromptToCollectionAction(col.id, promptId)
        : await removePromptFromCollectionAction(col.id, promptId);

      if (!res.success) {
        // Rollback
        setCollections((prev) =>
          prev.map((c) =>
            c.id === col.id ? { ...c, hasPrompt: !willAdd, isPending: false } : c
          )
        );
        setErrorMsg(res.error || "Action failed.");
      } else {
        setCollections((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, isPending: false } : c))
        );
        setFeedback(
          willAdd ? `Added to "${col.title}"` : `Removed from "${col.title}"`
        );
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setIsCreating(true);
    setErrorMsg(null);

    const createRes = await createCollectionAction({ title });
    if (!createRes.success || !createRes.data) {
      setErrorMsg(createRes.error || "Failed to create collection.");
      setIsCreating(false);
      return;
    }

    const newColId = createRes.data.id;
    const addRes = await addPromptToCollectionAction(newColId, promptId);

    setIsCreating(false);
    setNewTitle("");

    if (addRes.success) {
      setCollections((prev) => [
        {
          id: newColId,
          title,
          visibility: "PRIVATE",
          hasPrompt: true,
          isPending: false,
        },
        ...prev,
      ]);
      setFeedback(`Created "${title}" and added prompt`);
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setErrorMsg("Created collection, but failed to add prompt.");
    }
  };

  return (
    <>
      {variant === "card" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          aria-label="Add prompt to collection"
          title="Add to collection"
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/60 dark:bg-[#1A030A]/80 text-white/90 dark:text-rose-100/90 backdrop-blur-md border border-white/10 dark:border-rose-300/20 shadow-sm transition-all hover:bg-black/80 hover:text-white hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-600 ${className}`}
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#380B1A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-[#E2B8C6] transition-all hover:bg-zinc-100 dark:hover:bg-[#4A1023] hover:text-foreground focus-visible:ring-2 focus-visible:ring-rose-600 ${className}`}
        >
          <FolderPlus className="h-4 w-4 text-rose-500" />
          <span>Add to Collection</span>
        </button>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add prompt to collection"
          ref={dialogRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-[#150208]/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#380B1A] p-6 shadow-2xl relative text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#5E162D]">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold">Add to Collection</h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-zinc-100 dark:hover:bg-[#4A1023] hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Announcements */}
            <div aria-live="polite" className="sr-only">
              {feedback || errorMsg || ""}
            </div>

            {feedback && (
              <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400">
                {feedback}
              </div>
            )}

            {errorMsg && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Collections Checklist */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-xs">Loading collections...</span>
                </div>
              ) : collections.length === 0 ? (
                <p className="py-6 text-center text-xs text-text-muted">
                  You have no collections yet. Create your first one below!
                </p>
              ) : (
                collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleCollectionItem(col)}
                    disabled={col.isPending}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      col.hasPrompt
                        ? "border-rose-500/40 bg-rose-500/10 text-foreground"
                        : "border-zinc-200 dark:border-[#5E162D] bg-zinc-50 dark:bg-[#2A0813]/40 hover:bg-zinc-100 dark:hover:bg-[#2A0813]/70 text-zinc-600 dark:text-[#E2B8C6] hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          col.hasPrompt
                            ? "bg-rose-600 border-rose-500 text-white"
                            : "border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#2A0813]"
                        }`}
                      >
                        {col.hasPrompt && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium truncate">{col.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {col.visibility === "PUBLIC" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-text-faint">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-text-faint">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      )}
                      {col.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Quick Create New Collection */}
            <form onSubmit={handleCreateAndAdd} className="mt-4 pt-4 border-t border-zinc-200 dark:border-[#5E162D] flex gap-2">
              <input
                type="text"
                placeholder="New collection title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={120}
                disabled={isCreating}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-[#5E162D] bg-zinc-50 dark:bg-[#2A0813] px-3 py-2 text-xs text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={!newTitle.trim() || isCreating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-rose-500 disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Create</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
