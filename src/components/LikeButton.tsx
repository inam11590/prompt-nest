"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePromptLikeAction } from "@/app/actions/engagement";
import { createClient } from "@/lib/supabase/client";

interface LikeButtonProps {
  promptId: string;
  initialLiked?: boolean;
  initialLikesCount?: number;
  variant?: "card" | "detail" | "icon-only";
  className?: string;
}

const GUEST_LIKES_STORAGE_KEY = "promptnest_liked_prompts";

function getGuestLikes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_LIKES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setGuestLikes(likes: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_LIKES_STORAGE_KEY, JSON.stringify(likes));
    window.dispatchEvent(new CustomEvent("promptnest-likes-changed", { detail: { likes } }));
  } catch (e) {
    console.error("Failed to persist guest likes:", e);
  }
}

export function LikeButton({
  promptId,
  initialLiked = false,
  initialLikesCount = 0,
  variant = "card",
  className = "",
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Initialize client state from localStorage if guest
  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          const guestLikes = getGuestLikes();
          if (guestLikes.includes(promptId)) {
            setIsLiked(true);
          }
        }
      });
    } else {
      queueMicrotask(() => {
        const guestLikes = getGuestLikes();
        if (guestLikes.includes(promptId)) {
          setIsLiked(true);
        }
      });
    }

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ likes: string[] }>;
      if (customEvent.detail?.likes) {
        setIsLiked(customEvent.detail.likes.includes(promptId));
      }
    };

    window.addEventListener("promptnest-likes-changed", handleStorageChange);
    return () => {
      window.removeEventListener("promptnest-likes-changed", handleStorageChange);
    };
  }, [promptId]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previousLiked = isLiked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    // Trigger instant optimistic feedback
    setIsLiked(nextLiked);
    setLikesCount(nextCount);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    // Persist guest likes in localStorage
    const guestLikes = getGuestLikes();
    if (nextLiked) {
      if (!guestLikes.includes(promptId)) {
        setGuestLikes([...guestLikes, promptId]);
      }
    } else {
      setGuestLikes(guestLikes.filter((id) => id !== promptId));
    }

    // Call server action
    startTransition(async () => {
      const res = await togglePromptLikeAction(promptId, previousLiked);
      if (!res.success) {
        // Rollback on server error
        setIsLiked(previousLiked);
        setLikesCount(previousCount);
      }
    });
  };

  const formattedCount =
    likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount;

  if (variant === "icon-only") {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isPending}
        aria-label={isLiked ? "Unlike prompt" : "Like prompt"}
        aria-pressed={isLiked}
        className={`group inline-flex items-center justify-center rounded-full p-2 transition-transform active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${className}`}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${
            isLiked
              ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              : "text-zinc-400 group-hover:text-rose-400"
          } ${isAnimating ? "scale-125" : "scale-100"}`}
        />
      </button>
    );
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isPending}
        aria-label={isLiked ? "Unlike prompt" : "Like prompt"}
        aria-pressed={isLiked}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
          isLiked
            ? "border border-rose-500/30 bg-rose-500/15 text-rose-300 shadow-rose-950/20"
            : "border border-surface-border bg-surface-raised text-text-muted hover:border-surface-border hover:bg-surface-raised hover:text-foreground"
        } ${className}`}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${
            isLiked
              ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              : "text-text-faint group-hover:text-rose-400"
          } ${isAnimating ? "scale-125" : "scale-100"}`}
        />
        <span>{isLiked ? "Liked" : "Like"}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-medium ${
            isLiked
              ? "bg-rose-500/20 text-rose-200"
              : "bg-surface text-text-muted border border-surface-border"
          }`}
        >
          {formattedCount}
        </span>
      </button>
    );
  }

  // Card Variant
  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={isPending}
      aria-label={isLiked ? "Unlike prompt" : "Like prompt"}
      aria-pressed={isLiked}
      className={`group relative flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md transition-all duration-200 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
        isLiked
          ? "border border-rose-500/40 bg-rose-500/20 text-rose-200 shadow-sm"
          : "border border-white/10 bg-black/50 text-white/90 hover:bg-black/70 hover:border-white/20"
      } ${className}`}
    >
      <Heart
        className={`h-3.5 w-3.5 transition-all duration-300 ${
          isLiked
            ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]"
            : "text-white/80 group-hover:text-rose-400"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      />
      {likesCount > 0 && (
        <span className="font-mono text-[11px] leading-none">
          {formattedCount}
        </span>
      )}
    </button>
  );
}
