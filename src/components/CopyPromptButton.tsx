"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";

interface CopyPromptButtonProps {
  promptText: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyPromptButton({
  promptText,
  label = "Copy Full Prompt",
  copiedLabel = "Copied to Clipboard!",
  className = "",
}: CopyPromptButtonProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [manualTextVisible, setManualTextVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Try modern secure context navigator.clipboard API
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(promptText);
        setCopyStatus("success");
        setManualTextVisible(false);
        // Keep focus on initiating button
        buttonRef.current?.focus();

        timerRef.current = setTimeout(() => {
          setCopyStatus("idle");
        }, 2500);
        return;
      } catch (err) {
        console.warn("navigator.clipboard.writeText rejected:", err);
      }
    }

    // Fallback: document.execCommand('copy') using temporary textarea
    try {
      const textarea = document.createElement("textarea");
      textarea.value = promptText;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (success) {
        setCopyStatus("success");
        setManualTextVisible(false);
        buttonRef.current?.focus();
        timerRef.current = setTimeout(() => {
          setCopyStatus("idle");
        }, 2500);
        return;
      }
    } catch (err) {
      console.warn("document.execCommand copy fallback failed:", err);
    }

    // If both failed, display failure feedback and expose selectable manual copy textarea
    setCopyStatus("error");
    setManualTextVisible(true);
    buttonRef.current?.focus();
    timerRef.current = setTimeout(() => {
      setCopyStatus("idle");
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleCopy}
        aria-label={
          copyStatus === "success"
            ? `${label} copied to clipboard successfully`
            : copyStatus === "error"
            ? `Failed to copy ${label}. Click to retry or copy manually below`
            : label
        }
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 ${
          copyStatus === "success"
            ? "bg-emerald-600 text-white"
            : copyStatus === "error"
            ? "bg-red-600 text-white hover:bg-red-500"
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 active:scale-95"
        } px-4 py-2.5 ${className}`}
      >
        {copyStatus === "success" ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{copiedLabel}</span>
          </>
        ) : copyStatus === "error" ? (
          <>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>Copy Failed (Click to retry)</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Screen reader polite live region for non-visual feedback */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copyStatus === "success"
          ? `${label} copied to clipboard.`
          : copyStatus === "error"
          ? `Could not access clipboard. Please copy prompt text manually.`
          : ""}
      </div>

      {/* Accessible manual copy fallback when clipboard permissions are blocked */}
      {manualTextVisible && (
        <div className="mt-1 flex flex-col gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-text-muted">
          <p className="font-medium text-red-300">
            Clipboard permission blocked. Press Ctrl+C (Cmd+C) to copy:
          </p>
          <textarea
            readOnly
            value={promptText}
            onFocus={(e) => e.target.select()}
            className="h-20 w-full rounded border border-surface-border bg-surface-raised p-2 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 select-all"
            aria-label="Selectable prompt text for manual copying"
          />
        </div>
      )}
    </div>
  );
}
