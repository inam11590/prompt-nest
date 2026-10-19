"use client";

import React, { useState, useCallback } from "react";
import { ShieldAlert, Copy, Check, Terminal, FileText, Ban } from "lucide-react";

interface NegativePromptBlockProps {
  rawNegativeText: string;
  exclusionPills: string[];
  midjourneyNoSyntax: string;
}

export function NegativePromptBlock({
  rawNegativeText,
  exclusionPills,
  midjourneyNoSyntax,
}: NegativePromptBlockProps) {
  // Mode toggle: "raw" standard text vs "midjourney" --no syntax
  const [viewMode, setViewMode] = useState<"standard" | "midjourney">("standard");
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeTextToCopy =
    viewMode === "midjourney" ? midjourneyNoSyntax : rawNegativeText;

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(activeTextToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = activeTextToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      const msg =
        viewMode === "midjourney"
          ? "Midjourney --no parameter copied to clipboard!"
          : "Negative prompt copied to clipboard!";
      setToastMessage(msg);
      setTimeout(() => setCopied(false), 2200);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage("Failed to copy negative prompt. Please select text manually.");
    }
  }, [activeTextToCopy, viewMode]);

  return (
    <section
      aria-labelledby="negative-prompt-heading"
      className="flex flex-col gap-4 rounded-2xl border border-rose-500/20 bg-surface/90 backdrop-blur-md p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Subtle ambient rose glow */}
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-rose-500/5 blur-3xl"
        aria-hidden="true"
      />

      {/* Screen Reader Live Region */}
      <div aria-live="polite" className="sr-only">
        {toastMessage}
      </div>

      {/* Header and Syntax Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id="negative-prompt-heading" className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Negative Prompt &amp; Exclusions</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Quality Guardrails
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Prevent artifacts, bad anatomy, and unwanted elements during generation.
            </p>
          </div>
        </div>

        {/* Syntax Mode Switcher */}
        <div
          role="tablist"
          aria-label="Negative prompt syntax format"
          className="flex rounded-xl bg-surface-raised p-1 border border-surface-border self-start sm:self-auto"
        >
          <button
            role="tab"
            aria-selected={viewMode === "standard"}
            onClick={() => setViewMode("standard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "standard"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            <FileText className="h-3 w-3" />
            <span>Standard Exclusions</span>
          </button>
          <button
            role="tab"
            aria-selected={viewMode === "midjourney"}
            onClick={() => setViewMode("midjourney")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "midjourney"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            <Terminal className="h-3 w-3" />
            <span>Midjourney --no Flag</span>
          </button>
        </div>
      </div>

      {/* Scannable Exclusion Pills */}
      {exclusionPills.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1">
            <Ban className="h-3 w-3 text-rose-400" />
            <span>Excluded Elements</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {exclusionPills.map((pill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>{pill}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Formatted Code Block Display */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>{viewMode === "midjourney" ? "Formatted Midjourney Parameter" : "Raw Negative Text"}</span>
          <span className="text-[11px] text-text-faint font-mono">
            {viewMode === "midjourney" ? "--no parameter" : "Negative prompt field"}
          </span>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="Negative prompt text"
          className="rounded-xl border border-rose-500/20 bg-surface-raised/70 p-3.5 font-mono text-xs leading-relaxed text-rose-200 select-all break-words whitespace-pre-wrap shadow-inner"
        >
          {activeTextToCopy}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-text-faint">
          {viewMode === "midjourney"
            ? "Append this directly to the end of your Midjourney prompt."
            : "Paste into the 'Negative Prompt' field in Stable Diffusion, SeaArt, or Leonardo."}
        </p>

        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all ${
            copied
              ? "bg-emerald-600 shadow-emerald-500/25"
              : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Negative Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{viewMode === "midjourney" ? "Copy --no Parameter" : "Copy Negative Prompt"}</span>
            </>
          )}
        </button>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="rounded-lg bg-rose-950/40 border border-rose-500/30 p-2 text-xs text-rose-300 flex items-center justify-between gap-2">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-rose-400 hover:text-white font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
