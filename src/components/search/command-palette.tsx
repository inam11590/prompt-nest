"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Command,
  ArrowRight,
  Copy,
  Check,
  Folder,
  Compass,
  Bookmark,
  BookOpen,
  Send,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { STARTER_PROMPTS, type PromptItem } from "@/data/prompts";
import { siteConfig } from "@/config/site";
import { useTheme } from "@/components/theme/ThemeProvider";

interface CommandItem {
  id: string;
  type: "prompt" | "category" | "model" | "action";
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  onSelect: () => void;
  promptData?: PromptItem;
}

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleOpen = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Listen for Cmd+K / Ctrl+K and custom open event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            handleOpen();
            return true;
          } else {
            handleClose();
            return false;
          }
        });
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    const handleCustomOpen = () => {
      handleOpen();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen, handleOpen, handleClose]);

  // Body scroll lock & input autofocus when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const copyPromptText = useCallback((p: PromptItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = p.prompt;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(p.id);
        showToast("Prompt copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(p.id);
      showToast("Prompt copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const closeAndNavigate = useCallback((href: string) => {
    handleClose();
    router.push(href);
  }, [router, handleClose]);

  // Compute matching items
  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const result: CommandItem[] = [];

    if (!q) {
      // Default: Quick Actions
      result.push({
        id: "action-gallery",
        type: "action",
        title: "Explore All Prompts",
        subtitle: "Browse the curated visual gallery",
        icon: <Compass className="h-4 w-4 text-indigo-400" />,
        onSelect: () => closeAndNavigate("/#gallery"),
      });

      result.push({
        id: "action-saved",
        type: "action",
        title: "Saved Prompts",
        subtitle: "View your bookmarked inspiration library",
        icon: <Bookmark className="h-4 w-4 text-amber-400" />,
        onSelect: () => closeAndNavigate("/saved"),
      });

      result.push({
        id: "action-submit",
        type: "action",
        title: "Submit a Prompt",
        subtitle: "Share your tested AI recipe with the community",
        icon: <Send className="h-4 w-4 text-emerald-400" />,
        onSelect: () => closeAndNavigate("/dashboard/submissions/new"),
      });

      result.push({
        id: "action-blog",
        type: "action",
        title: "Guides & Tutorials",
        subtitle: "Learn prompt engineering best practices",
        icon: <BookOpen className="h-4 w-4 text-blue-400" />,
        onSelect: () => closeAndNavigate("/blog"),
      });

      result.push({
        id: "action-theme",
        type: "action",
        title: theme === "dark" ? "Switch to Alabaster Light Mode" : "Switch to Obsidian Dark Mode",
        subtitle: `Currently using ${theme} theme`,
        icon: theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />,
        onSelect: () => {
          toggleTheme();
          showToast(`Switched to ${theme === "dark" ? "light" : "dark"} theme`);
        },
      });

      // Top Models
      const leadingModels = [
        "Midjourney v6.1",
        "FLUX.1 [dev]",
        "DALL-E 3",
        "Stable Diffusion XL",
        "ChatGPT-4o",
      ];
      for (const m of leadingModels) {
        result.push({
          id: `model-${m}`,
          type: "model",
          title: `${m} Prompts`,
          subtitle: `Filter gallery by ${m}`,
          badge: "Model",
          icon: <Sparkles className="h-4 w-4 text-indigo-400" />,
          onSelect: () => closeAndNavigate(`/?model=${encodeURIComponent(m)}#gallery`),
        });
      }

      // Top Categories
      for (const cat of siteConfig.categories.slice(1, 6)) {
        result.push({
          id: `category-${cat.id}`,
          type: "category",
          title: cat.name,
          subtitle: cat.description,
          badge: "Category",
          icon: <Folder className="h-4 w-4 text-text-muted" />,
          onSelect: () => closeAndNavigate(`/?category=${cat.id}#gallery`),
        });
      }

      return result;
    }

    // When query is active:
    // 1. Matching Prompts (up to 6)
    const matchingPrompts = STARTER_PROMPTS.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }).slice(0, 6);

    for (const p of matchingPrompts) {
      result.push({
        id: `prompt-${p.id}`,
        type: "prompt",
        title: p.title,
        subtitle: p.shortDescription,
        badge: p.model,
        imageUrl: p.imageUrl,
        promptData: p,
        onSelect: () => closeAndNavigate(`/prompts/${p.slug}`),
      });
    }

    // 2. Matching Categories
    const matchingCategories = siteConfig.categories.filter((c) =>
      c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
    for (const c of matchingCategories) {
      result.push({
        id: `cat-${c.id}`,
        type: "category",
        title: c.name,
        subtitle: c.description,
        badge: "Category",
        icon: <Folder className="h-4 w-4 text-indigo-400" />,
        onSelect: () => closeAndNavigate(`/?category=${c.id}#gallery`),
      });
    }

    // 3. Matching Models
    const models = ["Midjourney v6.1", "FLUX.1 [dev]", "DALL-E 3", "Stable Diffusion XL", "ChatGPT-4o"];
    const matchingModels = models.filter((m) => m.toLowerCase().includes(q));
    for (const m of matchingModels) {
      result.push({
        id: `m-${m}`,
        type: "model",
        title: `${m} Prompts`,
        subtitle: `Explore tested prompts for ${m}`,
        badge: "AI Model",
        icon: <Sparkles className="h-4 w-4 text-indigo-400" />,
        onSelect: () => closeAndNavigate(`/?model=${encodeURIComponent(m)}#gallery`),
      });
    }

    // 4. Quick Actions
    if ("explore gallery all prompts".includes(q)) {
      result.push({
        id: "act-explore",
        type: "action",
        title: "Explore Gallery",
        subtitle: "View the full prompt catalog",
        icon: <Compass className="h-4 w-4 text-indigo-400" />,
        onSelect: () => closeAndNavigate("/#gallery"),
      });
    }
    if ("saved bookmarks favorites".includes(q)) {
      result.push({
        id: "act-saved",
        type: "action",
        title: "Saved Prompts",
        subtitle: "View your bookmarked prompts",
        icon: <Bookmark className="h-4 w-4 text-amber-400" />,
        onSelect: () => closeAndNavigate("/saved"),
      });
    }
    if ("blog guides tutorials articles".includes(q)) {
      result.push({
        id: "act-blog",
        type: "action",
        title: "Guides & Articles",
        subtitle: "Read AI prompt engineering tutorials",
        icon: <BookOpen className="h-4 w-4 text-blue-400" />,
        onSelect: () => closeAndNavigate("/blog"),
      });
    }
    if ("theme dark light mode color".includes(q)) {
      result.push({
        id: "act-theme",
        type: "action",
        title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: `Currently using ${theme} theme`,
        icon: theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />,
        onSelect: () => {
          toggleTheme();
          showToast(`Switched to ${theme === "dark" ? "light" : "dark"} theme`);
        },
      });
    }

    return result;
  }, [query, theme, toggleTheme, closeAndNavigate]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search prompt catalog and quick actions"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Accessible Live Region Toast */}
      <div
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {toastMessage}
      </div>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl ring-1 ring-white/10 transition-all z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3 bg-surface-raised/40">
          <Search className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search prompts, models, styles, tags, or navigation..."
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder-text-faint focus:outline-none"
            aria-label="Type to search"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              className="p-1 rounded-full text-text-faint hover:text-foreground hover:bg-surface-raised"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-surface border border-surface-border px-2 py-0.5 text-[10px] font-mono font-medium text-text-faint">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div
          ref={listRef}
          className="overflow-y-auto px-2 py-2 divide-y divide-surface-border/40 space-y-1"
          role="listbox"
        >
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-text-muted">
              <Search className="mx-auto h-8 w-8 text-text-faint mb-2 opacity-50" />
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-text-faint mt-1">
                Try searching for &quot;portrait&quot;, &quot;cyberpunk&quot;, &quot;Midjourney&quot;, or &quot;cinematic&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    data-active={isSelected}
                    onClick={() => item.onSelect()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-500/10 text-foreground border border-indigo-500/30"
                        : "hover:bg-surface-raised/70 text-text-muted border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Leading Thumbnail or Icon */}
                      {item.imageUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-surface-border bg-surface-raised">
                          <Image
                            src={item.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-raised">
                          {item.icon || <Sparkles className="h-4 w-4 text-indigo-400" />}
                        </div>
                      )}

                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-medium truncate ${isSelected ? "text-foreground font-semibold" : "text-foreground"}`}>
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-text-faint border border-surface-border">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <span className="text-[11px] text-text-faint truncate max-w-md">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trailing Quick Copy or Arrow */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.promptData && (
                        <button
                          type="button"
                          onClick={(e) => copyPromptText(item.promptData!, e)}
                          title="Copy prompt text"
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-surface-raised text-text-muted hover:text-foreground border border-surface-border transition-colors cursor-pointer"
                          aria-label={`Copy prompt for ${item.title}`}
                        >
                          {copiedId === item.promptData.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                      <ArrowRight className={`h-4 w-4 transition-transform ${isSelected ? "text-indigo-400 translate-x-0.5" : "text-text-faint opacity-50"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-2 text-[11px] text-text-faint bg-surface-raised/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-surface border border-surface-border px-1.5 py-0.5 font-mono text-[9px]">↑</kbd>
              <kbd className="rounded bg-surface border border-surface-border px-1.5 py-0.5 font-mono text-[9px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-surface border border-surface-border px-1.5 py-0.5 font-mono text-[9px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>PromptNest Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
