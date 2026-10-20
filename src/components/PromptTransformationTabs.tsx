"use client";

import React, { useState } from "react";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import { User, Layers, CheckCircle2, ShieldAlert, Sparkles, Download, ExternalLink } from "lucide-react";

interface PromptTransformationTabsProps {
  promptText: string;
  promptDual?: string | null;
  exampleImageUrl?: string;
  exampleImageAlt?: string;
  assetStatus?: "READY" | "DRAFT_PENDING_ASSET";
  sourceUrl?: string;
  sourceLicense?: string;
}

export function PromptTransformationTabs({
  promptText,
  promptDual,
  exampleImageUrl,
  assetStatus = "READY",
  sourceUrl,
}: PromptTransformationTabsProps) {
  const [activeTab, setActiveTab] = useState<"single" | "dual">("single");

  const hasDualMode = Boolean(promptDual && promptDual.trim().length > 0);
  const isAssetReady = assetStatus === "READY" && Boolean(exampleImageUrl);

  return (
    <section
      aria-labelledby="transformation-modes-heading"
      className="flex flex-col gap-5 rounded-2xl border border-surface-border bg-surface p-5 shadow-lg"
    >
      {/* Header and Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <h2 id="transformation-modes-heading" className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Recreation Prompt &amp; Workflow</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
              Personal Photo Ready
            </span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Transform your personal photograph into this aesthetic using an external AI tool.
          </p>
        </div>

        {/* Tab Controls (Only shown if dual mode exists) */}
        {hasDualMode && (
          <div
            role="tablist"
            aria-label="Prompt transformation workflow modes"
            className="flex rounded-xl bg-surface-raised p-1 border border-surface-border"
          >
            <button
              role="tab"
              id="tab-single"
              aria-selected={activeTab === "single"}
              aria-controls="panel-single"
              onClick={() => setActiveTab("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "single"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-text-muted hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Use My Photo</span>
            </button>

            <button
              role="tab"
              id="tab-dual"
              aria-selected={activeTab === "dual"}
              aria-controls="panel-dual"
              onClick={() => setActiveTab("dual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dual"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-text-muted hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Match This Example</span>
            </button>
          </div>
        )}
      </div>

      {/* 3-Step Concise Guide */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-[#380B1A]/80 p-4 text-xs">
        <h3 className="font-semibold text-rose-900 dark:text-rose-200 mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span>How to use this prompt (3 Easy Steps)</span>
        </h3>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-text-muted text-[11px] leading-relaxed">
          <li className="flex flex-col gap-1 rounded-lg bg-white dark:bg-[#2A0813] p-2.5 border border-zinc-200 dark:border-[#5E162D]">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px]">1</span>
              <span>Copy Prompt</span>
            </span>
            <span>Click &ldquo;Copy Prompt&rdquo; below to copy the complete self-contained recipe.</span>
          </li>
          <li className="flex flex-col gap-1 rounded-lg bg-white dark:bg-[#2A0813] p-2.5 border border-zinc-200 dark:border-[#5E162D]">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px]">2</span>
              <span>Upload Photo</span>
            </span>
            <span>
              {activeTab === "single" || !hasDualMode
                ? "Open Midjourney, FLUX, or SDXL and upload your personal reference photo."
                : "Open your AI image tool and upload your personal photo + this style example image."}
            </span>
          </li>
          <li className="flex flex-col gap-1 rounded-lg bg-white dark:bg-[#2A0813] p-2.5 border border-zinc-200 dark:border-[#5E162D]">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px]">3</span>
              <span>Paste &amp; Generate</span>
            </span>
            <span>Paste the prompt, reference your upload(s), and generate your transformed portrait.</span>
          </li>
        </ol>
      </div>

      {/* Mode-Specific Workflow Explanation */}
      {hasDualMode && (
        <div className="rounded-xl border border-surface-border bg-surface-raised/60 p-3.5 text-xs">
          {activeTab === "single" ? (
            <div className="flex flex-col gap-1.5 text-text-muted">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-rose-500" />
                <span>Mode A: Personal Photo Only (1 Image Upload)</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                The prompt below is completely self-contained with comprehensive styling, clothing, lighting, optics, and setting specifications. Upload only your own photograph to your AI tool. The prompt instructs the model to preserve your facial identity while applying the full scene aesthetic.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 text-text-muted">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-rose-500" />
                <span>Mode B: Personal Photo + Style Example (2 Image Uploads)</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                Upload <strong>two images</strong> to your AI image tool: <strong>[Reference A]</strong> your personal photo (sole identity authority) and <strong>[Reference B]</strong> PromptNest&apos;s style example (styling &amp; composition authority). The dual contract strictly prevents the model from blending facial features.
              </p>
              {isAssetReady && exampleImageUrl && (
                <div className="pt-2 flex items-center gap-3">
                  <a
                    href={exampleImageUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-xs font-semibold text-foreground hover:bg-surface hover:border-rose-500/40 transition-all shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 text-rose-500" />
                    <span>Download Example Reference Image</span>
                  </a>
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-foreground"
                    >
                      <span>View original source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Code Text Block & Copy Button */}
      <div
        id={activeTab === "single" ? "panel-single" : "panel-dual"}
        role="tabpanel"
        aria-labelledby={activeTab === "single" ? "tab-single" : "tab-dual"}
        className="flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-faint">
            {activeTab === "single" || !hasDualMode
              ? "Mode A Prompt Text (Photo Only)"
              : "Mode B Dual-Reference Prompt Text"}
          </span>
          <CopyPromptButton
            promptText={activeTab === "single" || !hasDualMode ? promptText : promptDual || promptText}
            label={activeTab === "single" || !hasDualMode ? "Copy Mode A Prompt" : "Copy Mode B Prompt"}
          />
        </div>

        <div className="rounded-xl border border-surface-border-subtle bg-surface-raised p-4 font-mono text-xs leading-relaxed text-foreground select-all break-words whitespace-pre-wrap">
          {activeTab === "single" || !hasDualMode ? promptText : promptDual || promptText}
        </div>
      </div>

      {/* Reference-Photo Quality & Ethical Guidance */}
      <div className="rounded-xl border border-surface-border bg-surface-raised/40 p-4 text-xs flex flex-col gap-2">
        <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Reference-Photo Best Practices</span>
        </span>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text-muted text-[11px] leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span><strong>Well-lit &amp; Facing Camera:</strong> Clear, balanced lighting with a neutral or natural facial expression.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span><strong>Minimal Obstructions:</strong> Avoid dark sunglasses, heavy cast shadows, hair across eyes, or hands covering facial contours.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span><strong>High Resolution:</strong> Use crisp, uncompressed photos; avoid heavily filtered, blurred, or low-resolution images.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span><strong>Permission Required:</strong> Use only your own photos or images you have explicit authorization and consent to use.</span>
          </li>
        </ul>
      </div>

      {/* Mandatory Identity Preservation Notice Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200/90 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-amber-900 dark:text-amber-300">Identity Disclaimer</span>
          <span className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
            Prompts are designed to preserve your identity. Results vary by image tool and reference photo. Facial accuracy depends on the tool and reference photo.
          </span>
        </div>
      </div>
    </section>
  );
}
