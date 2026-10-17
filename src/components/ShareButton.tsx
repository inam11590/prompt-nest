"use client";

import React, { useState, useRef, useEffect } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Check for native Web Share API
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          url,
        });
        // User completed or cancelled natively
        return;
      } catch (err: unknown) {
        // If AbortError (user cancelled native share sheet), treat as graceful cancellation, not an error
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.warn("navigator.share failed, falling back to clipboard:", err);
      }
    }

    // Fallback: Copy canonical link to clipboard
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? "Prompt link copied to clipboard" : "Share this prompt"}
        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-muted hover:bg-surface-raised hover:text-foreground transition-all focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer shadow-sm active:scale-95"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span className="text-emerald-400">Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Share</span>
          </>
        )}
      </button>

      {/* Screen reader notification */}
      <div className="sr-only" role="status" aria-live="polite">
        {copied ? "Prompt link copied to clipboard." : ""}
      </div>
    </div>
  );
}
