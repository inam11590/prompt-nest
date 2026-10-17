"use client";

import React, { useState } from "react";
import { CopyPromptButton } from "@/components/CopyPromptButton";
import { User, Layers, Info } from "lucide-react";

interface PromptTransformationTabsProps {
  promptText: string;
  promptDual?: string | null;
}

export function PromptTransformationTabs({
  promptText,
  promptDual,
}: PromptTransformationTabsProps) {
  const [activeTab, setActiveTab] = useState<"single" | "dual">("single");

  const hasDualMode = Boolean(promptDual && promptDual.trim().length > 0);

  if (!hasDualMode) {
    return (
      <section
        aria-labelledby="prompt-heading"
        className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-5 shadow-lg"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="prompt-heading" className="text-xs font-bold uppercase tracking-wider text-text-faint">
            Prompt Text
          </h2>
          <CopyPromptButton promptText={promptText} label="Copy Prompt" />
        </div>
        <div className="rounded-xl border border-surface-border-subtle bg-surface-raised p-4 font-mono text-xs leading-relaxed text-foreground select-all break-words whitespace-pre-wrap">
          {promptText}
        </div>
      </section>
    );
  }

  const currentPrompt = activeTab === "single" ? promptText : (promptDual || promptText);

  return (
    <section
      aria-labelledby="transformation-modes-heading"
      className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface p-5 shadow-lg"
    >
      {/* Header and Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
        <div>
          <h2 id="transformation-modes-heading" className="text-sm font-bold text-white flex items-center gap-2">
            <span>Recreation Prompt Variants</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Personal Photo Ready
            </span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Select a mode depending on whether you upload only your photo or match this example.
          </p>
        </div>

        {/* Tab Controls */}
        <div role="tablist" aria-label="Prompt transformation modes" className="flex rounded-xl bg-surface-raised p-1 border border-surface-border">
          <button
            role="tab"
            id="tab-single"
            aria-selected={activeTab === "single"}
            aria-controls="panel-single"
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "single"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-text-muted hover:text-white hover:bg-surface-raised"
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
                ? "bg-blue-600 text-white shadow-sm"
                : "text-text-muted hover:text-white hover:bg-surface-raised"
            }`}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Match This Example</span>
          </button>
        </div>
      </div>

      {/* Mode Instructions */}
      <div className="rounded-xl border border-surface-border-subtle bg-surface-raised/60 p-3.5 text-xs">
        {activeTab === "single" ? (
          <div className="flex flex-col gap-1 text-text-muted">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span>📷 Mode 1: Personal Photo Only (1 Upload)</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              Upload only your personal photo to your external AI image tool (Midjourney, Flux, Stable Diffusion, etc.). This self-contained prompt instructs the model to use your photo as the sole facial identity authority while applying the full pose, lighting, clothing, and background described below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-text-muted">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span>🖼️ Mode 2: Personal Photo + Style Example (2 Uploads)</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              Upload <strong>two images</strong> to your AI tool: <strong>[Reference A]</strong> your personal photograph (identity authority) and <strong>[Reference B]</strong> this example image (styling and composition authority). Reference B must never override Reference A&apos;s facial likeness.
            </p>
          </div>
        )}
      </div>

      {/* Code Text Block & Copy Button */}
      <div
        id={activeTab === "single" ? "panel-single" : "panel-dual"}
        role="tabpanel"
        aria-labelledby={activeTab === "single" ? "tab-single" : "tab-dual"}
        className="flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-faint">
            {activeTab === "single" ? "Mode 1 Prompt Text" : "Mode 2 Dual-Reference Prompt Text"}
          </span>
          <CopyPromptButton
            promptText={currentPrompt}
            label={activeTab === "single" ? "Copy Mode A Prompt" : "Copy Mode B Prompt"}
          />
        </div>

        <div className="rounded-xl border border-surface-border-subtle bg-surface-raised p-4 font-mono text-xs leading-relaxed text-foreground select-all break-words whitespace-pre-wrap">
          {currentPrompt}
        </div>
      </div>

      {/* Facial Accuracy Notice Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
        <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-amber-300">Facial Preservation Notice</span>
          <span className="text-[11px] text-amber-200/80 leading-relaxed">
            Upload your own photo to your AI image tool and paste this prompt. Facial accuracy depends on the tool and reference photo.
          </span>
        </div>
      </div>
    </section>
  );
}
