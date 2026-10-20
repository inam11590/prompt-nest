"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleBookmark } from "@/app/actions/bookmarks";
import { createClient } from "@/lib/supabase/client";

interface BookmarkButtonProps {
  promptId: string;
  initialBookmarked?: boolean;
  isAuthenticated?: boolean;
  variant?: "card" | "detail";
  className?: string;
}

export function BookmarkButton({
  promptId,
  initialBookmarked = false,
  isAuthenticated: propIsAuthenticated = false,
  variant = "card",
  className = "",
}: BookmarkButtonProps) {
  const router = useRouter();
  const [overrideBookmarked, setOverrideBookmarked] = useState<boolean | null>(null);
  const [clientIsAuthenticated, setClientIsAuthenticated] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isBookmarked = overrideBookmarked !== null ? overrideBookmarked : initialBookmarked;
  const isAuthenticated = clientIsAuthenticated !== null ? clientIsAuthenticated : propIsAuthenticated;

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setClientIsAuthenticated(true);
        // Fetch bookmark state for this prompt
        supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("prompt_id", promptId)
          .maybeSingle()
          .then(({ data: bookmarkData }) => {
            if (bookmarkData) {
              setOverrideBookmarked(true);
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setClientIsAuthenticated(!!session?.user);
      if (!session?.user) {
        setOverrideBookmarked(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [promptId]);



  const handleClick = (e: React.MouseEvent) => {
    // Prevent activating card anchor links
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect signed-out user to login with safe returnTo target
      const returnTarget = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(returnTarget)}`);
      return;
    }

    if (isPending) return;

    // Optimistic toggle
    const previousState = isBookmarked;
    setOverrideBookmarked(!previousState);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await toggleBookmark(promptId);
      if (!res.success) {
        // Rollback state on failure
        setOverrideBookmarked(previousState);
        setErrorMsg(res.error || "Action failed");
        setTimeout(() => setErrorMsg(null), 3500);
      } else {
        setOverrideBookmarked(res.isBookmarked);
      }
    });
  };


  if (variant === "detail") {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          aria-label={
            isBookmarked
              ? "Remove prompt from saved collection"
              : "Save prompt to your collection"
          }
          className={`inline-flex items-center gap-2 rounded-xl font-semibold text-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 px-4 py-2.5 ${
            isBookmarked
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
              : "border border-surface-border bg-surface text-text-muted hover:bg-surface-raised hover:text-foreground"
          } ${className}`}
        >
          <Bookmark
            className={`h-4 w-4 transition-all ${
              isBookmarked ? "fill-amber-400 text-amber-400" : ""
            }`}
            aria-hidden="true"
          />
          <span>{isBookmarked ? "Saved" : "Save Prompt"}</span>
        </button>

        {errorMsg && (
          <span className="absolute -top-7 left-0 text-[10px] text-red-400 bg-surface-raised px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap shadow-md">
            {errorMsg}
          </span>
        )}
      </div>
    );
  }

  // Card Variant
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={
          isBookmarked
            ? "Remove prompt from saved collection"
            : "Save prompt to your collection"
        }
        className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60 cursor-pointer shadow-md ${
          isBookmarked
            ? "bg-amber-500/90 text-zinc-950 hover:bg-amber-400"
            : "bg-black/60 dark:bg-[#1A030A]/80 text-white/90 dark:text-rose-100/90 hover:bg-black/80 hover:text-white border border-white/10 dark:border-rose-300/20"
        } ${className}`}
      >
        <Bookmark
          className={`h-4 w-4 transition-all ${
            isBookmarked ? "fill-zinc-950 text-zinc-950" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {errorMsg && (
        <span className="absolute -top-6 right-0 text-[10px] text-red-400 bg-black/90 px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap shadow-md z-30">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
