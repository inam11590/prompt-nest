"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import {
  FolderPlus,
  Check,
  Plus,
  X,
  Loader2,
  Lock,
  Globe,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserCollectionsForPromptAction,
  addPromptToCollectionAction,
  removePromptFromCollectionAction,
  createCollectionAction,
} from "@/app/actions/collections";
import type { PromptItem } from "@/data/prompts";

export interface SaveToCollectionModalProps {
  prompt: PromptItem;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
}

interface BoardItem {
  id: string;
  title: string;
  visibility: string;
  hasPrompt: boolean;
  itemCount?: number;
  isPending?: boolean;
}

const GUEST_BOARDS_STORAGE_KEY = "promptnest_guest_boards";

interface GuestBoard {
  id: string;
  title: string;
  description?: string;
  visibility: "PRIVATE" | "PUBLIC";
  promptIds: string[];
}

const DEFAULT_GUEST_BOARDS: GuestBoard[] = [
  {
    id: "guest-board-1",
    title: "Design Inspiration",
    description: "Creative styling and lighting concepts",
    visibility: "PUBLIC",
    promptIds: [],
  },
  {
    id: "guest-board-2",
    title: "My Favorite Prompts",
    description: "Personal tested prompts for AI generation",
    visibility: "PRIVATE",
    promptIds: [],
  },
];

function getGuestBoards(): GuestBoard[] {
  if (typeof window === "undefined") return DEFAULT_GUEST_BOARDS;
  try {
    const raw = localStorage.getItem(GUEST_BOARDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GUEST_BOARDS_STORAGE_KEY, JSON.stringify(DEFAULT_GUEST_BOARDS));
      return DEFAULT_GUEST_BOARDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_GUEST_BOARDS;
  }
}

function saveGuestBoards(boards: GuestBoard[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_BOARDS_STORAGE_KEY, JSON.stringify(boards));
    window.dispatchEvent(new CustomEvent("promptnest-guest-boards-changed", { detail: { boards } }));
  } catch (e) {
    console.error("Failed to save guest boards:", e);
  }
}

export function SaveToCollectionModal({
  prompt,
  isOpen,
  onClose,
  isAuthenticated: propIsAuthenticated = false,
}: SaveToCollectionModalProps) {
  const [clientIsAuth, setClientIsAuth] = useState<boolean | null>(null);
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const isAuthenticated = clientIsAuth !== null ? clientIsAuth : propIsAuthenticated;

  // Determine auth status
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      queueMicrotask(() => setClientIsAuth(false));
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setClientIsAuth(!!data.user);
    });
  }, []);

  // Load boards when opened
  useEffect(() => {
    if (!isOpen) return;

    queueMicrotask(() => {
      setFeedback(null);
      setShowCreateForm(false);
      setNewBoardName("");
      setNewBoardDesc("");
      setIsSecret(false);
    });

    const loadBoards = async () => {
      setIsLoading(true);
      if (isAuthenticated) {
        try {
          const items = await getUserCollectionsForPromptAction(prompt.id);
          setBoards(
            items.map((i) => ({
              id: i.id,
              title: i.title,
              visibility: i.visibility,
              hasPrompt: i.hasPrompt,
            }))
          );
        } catch {
          // Fallback to guest boards on fetch failure
          const guestBoards = getGuestBoards();
          setBoards(
            guestBoards.map((b) => ({
              id: b.id,
              title: b.title,
              visibility: b.visibility,
              hasPrompt: b.promptIds.includes(prompt.id),
              itemCount: b.promptIds.length,
            }))
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        const guestBoards = getGuestBoards();
        setBoards(
          guestBoards.map((b) => ({
            id: b.id,
            title: b.title,
            visibility: b.visibility,
            hasPrompt: b.promptIds.includes(prompt.id),
            itemCount: b.promptIds.length,
          }))
        );
        setIsLoading(false);
      }
    };

    loadBoards();
  }, [isOpen, prompt.id, isAuthenticated]);

  // Accessibility: Focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeBtnRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleToggleBoard = (board: BoardItem) => {
    const nextState = !board.hasPrompt;

    // Optimistic UI update
    setBoards((prev) =>
      prev.map((b) => (b.id === board.id ? { ...b, hasPrompt: nextState } : b))
    );

    if (isAuthenticated) {
      startTransition(async () => {
        try {
          if (nextState) {
            const res = await addPromptToCollectionAction(board.id, prompt.id);
            if (!res.success) {
              // Rollback
              setBoards((prev) =>
                prev.map((b) => (b.id === board.id ? { ...b, hasPrompt: !nextState } : b))
              );
            }
          } else {
            const res = await removePromptFromCollectionAction(board.id, prompt.id);
            if (!res.success) {
              // Rollback
              setBoards((prev) =>
                prev.map((b) => (b.id === board.id ? { ...b, hasPrompt: !nextState } : b))
              );
            }
          }
        } catch {
          setBoards((prev) =>
            prev.map((b) => (b.id === board.id ? { ...b, hasPrompt: !nextState } : b))
          );
        }
      });
    } else {
      // Guest local storage update
      const guestBoards = getGuestBoards();
      const updated = guestBoards.map((gb) => {
        if (gb.id === board.id) {
          const promptIds = nextState
            ? Array.from(new Set([...gb.promptIds, prompt.id]))
            : gb.promptIds.filter((id) => id !== prompt.id);
          return { ...gb, promptIds };
        }
        return gb;
      });
      saveGuestBoards(updated);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newBoardName.trim();
    if (!title) return;

    setIsCreating(true);
    setFeedback(null);

    if (isAuthenticated) {
      try {
        const res = await createCollectionAction({
          title,
          description: newBoardDesc.trim() || undefined,
          visibility: isSecret ? "PRIVATE" : "PUBLIC",
          initialPromptId: prompt.id,
        });

        if (res.success && res.data) {
          setBoards((prev) => [
            {
              id: res.data!.id,
              title: res.data!.title,
              visibility: res.data!.visibility,
              hasPrompt: true,
            },
            ...prev,
          ]);
          setNewBoardName("");
          setNewBoardDesc("");
          setShowCreateForm(false);
          setFeedback(`Created and saved to "${title}"!`);
          setTimeout(() => setFeedback(null), 3000);
        } else {
          setFeedback(res.error || "Failed to create board.");
        }
      } catch {
        setFeedback("Failed to create board.");
      } finally {
        setIsCreating(false);
      }
    } else {
      // Guest mode
      const guestBoards = getGuestBoards();
      const newBoard: GuestBoard = {
        id: `guest-board-${Date.now()}`,
        title,
        description: newBoardDesc.trim() || undefined,
        visibility: isSecret ? "PRIVATE" : "PUBLIC",
        promptIds: [prompt.id],
      };
      const updated = [newBoard, ...guestBoards];
      saveGuestBoards(updated);
      setBoards((prev) => [
        {
          id: newBoard.id,
          title: newBoard.title,
          visibility: newBoard.visibility,
          hasPrompt: true,
        },
        ...prev,
      ]);
      setNewBoardName("");
      setNewBoardDesc("");
      setShowCreateForm(false);
      setIsCreating(false);
      setFeedback(`Saved to your board "${title}"!`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-[#150208]/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-to-board-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#380B1A] shadow-2xl transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#5E162D] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="save-to-board-title"
                className="font-heading text-base font-bold text-foreground"
              >
                Save to Board
              </h2>
              <p className="text-[11px] text-text-muted">
                Curate into personal or public collections
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-text-muted hover:bg-zinc-100 dark:hover:bg-[#4A1023] hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Prompt Preview Snippet */}
        <div className="flex items-center gap-3.5 bg-zinc-50 dark:bg-[#2A0813]/60 p-4 border-b border-zinc-200 dark:border-[#5E162D]">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#380B1A]">
            <Image
              src={prompt.imageUrl}
              alt={prompt.imageAlt || prompt.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-semibold text-foreground">
              {prompt.title}
            </h3>
            <p className="truncate text-[11px] text-text-muted">
              {prompt.model} &bull; {prompt.category}
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="mx-4 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center text-xs font-medium text-emerald-400 animate-fade-in">
            {feedback}
          </div>
        )}

        {/* Boards List */}
        <div className="max-h-60 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-text-muted gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Loading boards...</span>
            </div>
          ) : boards.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">
              No boards found. Create your first board below!
            </div>
          ) : (
            boards.map((board) => (
              <div
                key={board.id}
                onClick={() => handleToggleBoard(board)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleBoard(board);
                  }
                }}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  board.hasPrompt
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-zinc-200 dark:border-[#5E162D] bg-zinc-50 dark:bg-[#2A0813]/40 hover:bg-zinc-100 dark:hover:bg-[#2A0813]/70"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                      board.hasPrompt
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-white dark:bg-[#380B1A] text-zinc-500 dark:text-[#E2B8C6] border-zinc-200 dark:border-[#5E162D]"
                    }`}
                  >
                    {board.hasPrompt ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {board.title}
                      </span>
                      {board.visibility === "PRIVATE" ? (
                        <Lock className="h-2.5 w-2.5 text-text-faint" />
                      ) : (
                        <Globe className="h-2.5 w-2.5 text-text-faint" />
                      )}
                    </div>
                    <span className="text-[10px] text-text-faint">
                      {board.hasPrompt ? "Saved to board" : "Click to save"}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    board.hasPrompt
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-white dark:bg-[#380B1A] text-zinc-600 dark:text-[#E2B8C6] border border-zinc-200 dark:border-[#5E162D] group-hover:text-foreground"
                  }`}
                >
                  {board.hasPrompt ? "Saved" : "Save"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Inline Create Board Form */}
        <div className="border-t border-zinc-200 dark:border-[#5E162D] p-4 bg-zinc-50/50 dark:bg-[#2A0813]/40">
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 dark:border-[#5E162D] py-2.5 text-xs font-semibold text-zinc-600 dark:text-[#E2B8C6] hover:border-rose-500/50 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Board</span>
            </button>
          ) : (
            <form onSubmit={handleCreateBoard} className="space-y-3">
              <div>
                <label
                  htmlFor="new-board-name"
                  className="block text-[11px] font-semibold text-text-muted mb-1"
                >
                  Board Name
                </label>
                <input
                  id="new-board-name"
                  type="text"
                  required
                  maxLength={120}
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g. Neon Cyberpunk Ideas"
                  className="w-full rounded-xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#2A0813] px-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="new-board-desc"
                  className="block text-[11px] font-semibold text-text-muted mb-1"
                >
                  Description (Optional)
                </label>
                <input
                  id="new-board-desc"
                  type="text"
                  maxLength={500}
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  placeholder="What is this collection about?"
                  className="w-full rounded-xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#2A0813] px-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Secret toggle */}
              <div className="flex items-center justify-between py-1">
                <label
                  htmlFor="new-board-secret"
                  className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5 text-text-faint" />
                  <span>Keep this board secret (Private)</span>
                </label>
                <input
                  id="new-board-secret"
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-[#5E162D] text-rose-600 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isCreating || !newBoardName.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Create & Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl border border-zinc-200 dark:border-[#5E162D] bg-white dark:bg-[#2A0813] px-3 py-2 text-xs font-semibold text-text-muted hover:text-foreground transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
