"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PromptCard } from "@/components/PromptCard";
import type { PromptItem } from "@/data/prompts";
import { STARTER_PROMPTS } from "@/data/prompts";
import type { Collection } from "@/types/collections";
import {
  Bookmark,
  Compass,
  Search,
  Heart,
  FolderPlus,
  Lock,
  Globe,
  Plus,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { createCollectionAction } from "@/app/actions/collections";

interface SavedPromptsClientProps {
  initialPrompts: PromptItem[];
  initialLikedPrompts?: PromptItem[];
  initialCollections?: Collection[];
  isAuthenticated?: boolean;
}

const GUEST_LIKES_STORAGE_KEY = "promptnest_liked_prompts";
const GUEST_BOARDS_STORAGE_KEY = "promptnest_guest_boards";

interface GuestBoard {
  id: string;
  title: string;
  description?: string;
  visibility: "PRIVATE" | "PUBLIC";
  promptIds: string[];
}

export function SavedPromptsClient({
  initialPrompts,
  initialLikedPrompts = [],
  initialCollections = [],
  isAuthenticated = true,
}: SavedPromptsClientProps) {
  const [activeTab, setActiveTab] = useState<"boards" | "saved" | "liked">("boards");
  const [filterQuery, setFilterQuery] = useState("");

  // Live state
  const [savedPrompts] = useState<PromptItem[]>(initialPrompts);
  const [likedPrompts, setLikedPrompts] = useState<PromptItem[]>(initialLikedPrompts);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);

  // New Board Modal / Form State
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load guest data if unauthenticated or when localStorage changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isAuthenticated) {
      queueMicrotask(() => {
        // 1. Guest liked prompts
        try {
          const rawLikes = localStorage.getItem(GUEST_LIKES_STORAGE_KEY);
          const likedIds: string[] = rawLikes ? JSON.parse(rawLikes) : [];
          const likedItems = STARTER_PROMPTS.filter((p) => likedIds.includes(p.id));
          setLikedPrompts(likedItems);
        } catch {
          // Fallback
        }

        // 2. Guest boards
        try {
          const rawBoards = localStorage.getItem(GUEST_BOARDS_STORAGE_KEY);
          const guestBoards: GuestBoard[] = rawBoards ? JSON.parse(rawBoards) : [];
          if (guestBoards.length > 0) {
            const mapped: Collection[] = guestBoards.map((b) => ({
              id: b.id,
              publicId: b.id,
              slug: b.id,
              userId: "guest",
              title: b.title,
              description: b.description || null,
              visibility: b.visibility,
              concurrencyVersion: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              itemCount: b.promptIds.length,
            }));
            setCollections(mapped);
          }
        } catch {
          // Fallback
        }
      });
    }
  }, [isAuthenticated]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = boardName.trim();
    if (!title) return;

    setIsSubmitting(true);

    if (isAuthenticated) {
      try {
        const res = await createCollectionAction({
          title,
          description: boardDesc.trim() || undefined,
          visibility: isSecret ? "PRIVATE" : "PUBLIC",
        });

        if (res.success && res.data) {
          setCollections((prev) => [res.data!, ...prev]);
          setBoardName("");
          setBoardDesc("");
          setShowCreateBoard(false);
        }
      } catch (err) {
        console.error("Failed to create collection:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Guest localStorage
      const newBoard: GuestBoard = {
        id: `guest-board-${Date.now()}`,
        title,
        description: boardDesc.trim() || undefined,
        visibility: isSecret ? "PRIVATE" : "PUBLIC",
        promptIds: [],
      };
      const rawBoards = localStorage.getItem(GUEST_BOARDS_STORAGE_KEY);
      const existing: GuestBoard[] = rawBoards ? JSON.parse(rawBoards) : [];
      const updated = [newBoard, ...existing];
      localStorage.setItem(GUEST_BOARDS_STORAGE_KEY, JSON.stringify(updated));

      const mapped: Collection = {
        id: newBoard.id,
        publicId: newBoard.id,
        slug: newBoard.id,
        userId: "guest",
        title: newBoard.title,
        description: newBoard.description || null,
        visibility: newBoard.visibility,
        concurrencyVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 0,
      };
      setCollections((prev) => [mapped, ...prev]);
      setBoardName("");
      setBoardDesc("");
      setShowCreateBoard(false);
      setIsSubmitting(false);
    }
  };

  // Filter prompts by search query
  const filteredSaved = savedPrompts.filter((p) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q)
    );
  });

  const filteredLiked = likedPrompts.filter((p) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* 3 Interactive Tabs */}
      <div className="flex border-b border-surface-border">
        <button
          type="button"
          onClick={() => setActiveTab("boards")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "boards"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-text-muted hover:text-foreground"
          }`}
        >
          <FolderPlus className="h-4 w-4" />
          <span>My Boards</span>
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-mono font-medium text-text-muted border border-surface-border">
            {collections.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "saved"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-text-muted hover:text-foreground"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Saved Prompts</span>
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-mono font-medium text-text-muted border border-surface-border">
            {savedPrompts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("liked")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "liked"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-text-muted hover:text-foreground"
          }`}
        >
          <Heart className="h-4 w-4" />
          <span>Liked Prompts</span>
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-mono font-medium text-text-muted border border-surface-border">
            {likedPrompts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MY BOARDS */}
      {activeTab === "boards" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Boards</h2>
              <p className="text-xs text-text-muted">
                Group prompts into custom Pinterest-style moodboards
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateBoard(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Board</span>
            </button>
          </div>

          {/* Inline Create Board Form */}
          {showCreateBoard && (
            <div className="rounded-2xl border border-indigo-500/30 bg-surface-raised/70 p-5 shadow-lg max-w-lg">
              <h3 className="text-sm font-bold text-foreground mb-3">Create New Board</h3>
              <form onSubmit={handleCreateBoard} className="space-y-3">
                <div>
                  <label htmlFor="board-title" className="block text-xs font-semibold text-text-muted mb-1">
                    Board Name
                  </label>
                  <input
                    id="board-title"
                    type="text"
                    required
                    maxLength={120}
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="e.g. Neon Cyberpunk Aesthetic"
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="board-desc" className="block text-xs font-semibold text-text-muted mb-1">
                    Description (Optional)
                  </label>
                  <input
                    id="board-desc"
                    type="text"
                    maxLength={500}
                    value={boardDesc}
                    onChange={(e) => setBoardDesc(e.target.value)}
                    placeholder="What is this board for?"
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <label htmlFor="board-secret" className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                    <Lock className="h-3.5 w-3.5 text-text-faint" />
                    <span>Secret Board (Private)</span>
                  </label>
                  <input
                    id="board-secret"
                    type="checkbox"
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !boardName.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Save Board</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateBoard(false)}
                    className="rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-muted hover:text-foreground transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {collections.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center py-16 px-4 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-indigo-400">
                <FolderPlus className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">No boards yet</h3>
              <p className="text-xs text-text-muted mb-5 leading-relaxed">
                Create themed boards to organize prompts for your creative projects, client briefs, or aesthetic styles.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateBoard(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Board</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((board) => (
                <div
                  key={board.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-border bg-surface p-5 shadow-sm hover:border-indigo-500/40 hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-text-faint">
                        {board.visibility === "PRIVATE" ? (
                          <>
                            <Lock className="h-3 w-3" />
                            <span>Private</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-3 w-3" />
                            <span>Public</span>
                          </>
                        )}
                      </div>
                      <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-[11px] font-mono font-medium text-text-muted border border-surface-border">
                        {board.itemCount || 0} {board.itemCount === 1 ? "prompt" : "prompts"}
                      </span>
                    </div>

                    <h3 className="font-heading text-base font-bold text-foreground group-hover:text-indigo-400 transition-colors mb-1.5">
                      {board.title}
                    </h3>

                    {board.description && (
                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4">
                        {board.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
                    <Link
                      href={board.visibility === "PUBLIC" ? `/collections/${board.publicId}` : `/dashboard/collections/${board.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Open Board</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED PROMPTS */}
      {activeTab === "saved" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search saved prompts..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="text-xs text-text-muted self-center">
              Showing <span className="font-semibold text-foreground">{filteredSaved.length}</span> of{" "}
              <span className="font-semibold text-foreground">{savedPrompts.length}</span> saved
            </div>
          </div>

          {filteredSaved.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface text-amber-400">
                <Bookmark className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No saved prompts yet</h3>
              <p className="text-xs text-text-muted mb-6 leading-relaxed">
                Click the bookmark icon on any prompt card or detail page to save it to your private library.
              </p>
              <Link
                href="/#gallery"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Prompt Library</span>
              </Link>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
              {filteredSaved.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isBookmarked={true}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIKED PROMPTS */}
      {activeTab === "liked" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-faint">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search liked prompts..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-text-faint focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>

            <div className="text-xs text-text-muted self-center">
              Showing <span className="font-semibold text-foreground">{filteredLiked.length}</span> of{" "}
              <span className="font-semibold text-foreground">{likedPrompts.length}</span> liked
            </div>
          </div>

          {filteredLiked.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface text-rose-500">
                <Heart className="h-8 w-8 fill-rose-500/20" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No liked prompts yet</h3>
              <p className="text-xs text-text-muted mb-6 leading-relaxed">
                Click the heart icon on prompts you love to build your personal inspiration reel.
              </p>
              <Link
                href="/#gallery"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-all"
              >
                <Compass className="h-4 w-4" />
                <span>Discover Prompts to Like</span>
              </Link>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
              {filteredLiked.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
