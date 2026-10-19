"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  ExternalLink,
  Layers,
  Wand2,
  Camera,
  SunMedium,
  Ratio,
  Bot,
} from "lucide-react";
import type { PromptVariable } from "@/data/prompts";
import { incrementPromptCopyAction } from "@/app/actions/engagement";

interface PromptVariableStudioProps {
  initialPrompt: string;
  promptDual?: string | null;
  model: string;
  aspectRatioValue?: string;
  variables?: PromptVariable[];
  slug: string;
  negativePromptText?: string;
}

export function PromptVariableStudio({
  initialPrompt,
  promptDual,
  model,
  aspectRatioValue,
  variables: initialVariables = [],
  slug,
}: PromptVariableStudioProps) {
  // Mode selection: Single mode vs Dual-reference mode
  const [activeTab, setActiveTab] = useState<"single" | "dual">("single");
  const hasDualMode = Boolean(promptDual && promptDual.trim().length > 0);

  const basePrompt = activeTab === "dual" && promptDual ? promptDual : initialPrompt;

  // Derive default variables if none provided
  const resolvedVariables = useMemo(() => {
    if (initialVariables.length > 0) return initialVariables;

    const detected: PromptVariable[] = [];
    const bracketMatches = basePrompt.match(/\[([a-zA-Z0-9_\-\s]+)\]/g);
    if (bracketMatches) {
      const seen = new Set<string>();
      for (const match of bracketMatches) {
        const inner = match.slice(1, -1).trim();
        const key = inner.toLowerCase().replace(/\s+/g, "_");
        if (!seen.has(key)) {
          seen.add(key);
          detected.push({
            key,
            label: inner.charAt(0).toUpperCase() + inner.slice(1),
            defaultValue: inner,
            options: [inner],
          });
        }
      }
    }

    const defaultAr =
      aspectRatioValue === "3/4" || aspectRatioValue === "4/5"
        ? "9:16"
        : aspectRatioValue === "4/3" || aspectRatioValue === "16/9"
        ? "16:9"
        : "1:1";

    detected.push({
      key: "aspectRatio",
      label: "Aspect Ratio",
      defaultValue: defaultAr,
      options: ["9:16", "2:3", "4:5", "1:1", "16:9"],
    });

    detected.push({
      key: "lightingStyle",
      label: "Lighting Style",
      defaultValue: "Default",
      options: [
        "Default",
        "Golden Hour",
        "Crisp Studio Daylight",
        "Moody Cinematic Neon",
        "Soft Diffused Overcast",
      ],
    });

    detected.push({
      key: "cameraLens",
      label: "Camera Lens",
      defaultValue: "Default",
      options: [
        "Default",
        "35mm Editorial",
        "50mm Prime",
        "85mm f/1.4 Portrait",
        "24mm Wide Angle",
      ],
    });

    detected.push({
      key: "modelFormat",
      label: "Model Format",
      defaultValue: model.includes("Midjourney")
        ? "Midjourney v6.1"
        : model.includes("FLUX")
        ? "Flux.1 Pro"
        : "Raw Prompt",
      options: ["Midjourney v6.1", "Flux.1 Pro", "DALL-E 3", "Raw Prompt"],
    });

    return detected;
  }, [basePrompt, initialVariables, aspectRatioValue, model]);

  // Initial state map
  const defaultValues = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of resolvedVariables) {
      map[v.key] = v.defaultValue;
    }
    return map;
  }, [resolvedVariables]);

  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(defaultValues);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copyCount, setCopyCount] = useState(0);

  // Check if any variable differs from its default
  const isModified = useMemo(() => {
    return Object.keys(defaultValues).some(
      (key) => (selectedValues[key] || defaultValues[key]) !== defaultValues[key]
    );
  }, [selectedValues, defaultValues]);

  // Handle variable change
  const handleVariableChange = (key: string, value: string) => {
    setSelectedValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset all variables to default
  const handleReset = () => {
    setSelectedValues(defaultValues);
    setToastMessage("Prompt reset to tested original defaults.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Assembled prompt computation with highlighted segments
  const { assembledPrompt, segments } = useMemo(() => {
    let text = basePrompt;
    const customizedAdditions: { label: string; text: string }[] = [];

    // Replace bracketed variables
    for (const v of resolvedVariables) {
      if (
        v.key !== "aspectRatio" &&
        v.key !== "lightingStyle" &&
        v.key !== "cameraLens" &&
        v.key !== "modelFormat"
      ) {
        const currentVal = selectedValues[v.key] || v.defaultValue;
        const pattern = new RegExp(`\\[${v.defaultValue}\\]`, "gi");
        text = text.replace(pattern, currentVal);
      }
    }

    // Add lighting style if not default
    const lighting = selectedValues["lightingStyle"] || defaultValues["lightingStyle"] || "Default";
    if (lighting === "Golden Hour") {
      customizedAdditions.push({
        label: "Lighting",
        text: ", warm golden hour sunlight, soft elongated shadows, warm amber illumination",
      });
    } else if (lighting === "Crisp Studio Daylight") {
      customizedAdditions.push({
        label: "Lighting",
        text: ", crisp balanced 5600K studio daylight, clean softbox illumination, minimal shadow clipping",
      });
    } else if (lighting === "Moody Cinematic Neon") {
      customizedAdditions.push({
        label: "Lighting",
        text: ", moody cinematic neon backlighting, vivid saturated reflections, high contrast shadows",
      });
    } else if (lighting === "Soft Diffused Overcast") {
      customizedAdditions.push({
        label: "Lighting",
        text: ", soft diffused overcast natural lighting, gentle even tone, no harsh glare",
      });
    }

    // Add camera lens if not default
    const camera = selectedValues["cameraLens"] || defaultValues["cameraLens"] || "Default";
    if (camera === "35mm Editorial") {
      customizedAdditions.push({
        label: "Camera",
        text: ", captured on 35mm lens, f/1.8 aperture, natural perspective",
      });
    } else if (camera === "50mm Prime") {
      customizedAdditions.push({
        label: "Camera",
        text: ", captured on 50mm f/1.4 prime lens, sharp focal plane, smooth creamy bokeh",
      });
    } else if (camera === "85mm f/1.4 Portrait") {
      customizedAdditions.push({
        label: "Camera",
        text: ", shot on 85mm f/1.4 portrait lens, compressed background, ultra shallow depth of field",
      });
    } else if (camera === "24mm Wide Angle") {
      customizedAdditions.push({
        label: "Camera",
        text: ", captured on 24mm wide angle lens, expansive dynamic framing",
      });
    }

    // Add model parameters
    const modelFmt = selectedValues["modelFormat"] || defaultValues["modelFormat"] || "Raw Prompt";
    const arVal = selectedValues["aspectRatio"] || defaultValues["aspectRatio"] || "9:16";

    let modelFlags = "";
    if (modelFmt === "Midjourney v6.1") {
      modelFlags = ` --v 6.1 --ar ${arVal}`;
    } else if (modelFmt === "Flux.1 Pro") {
      modelFlags = ` --ar ${arVal}`;
    }

    // Build plain assembled string
    let fullText = text;
    for (const add of customizedAdditions) {
      fullText += add.text;
    }
    if (modelFlags) {
      fullText += modelFlags;
    }

    // Build segments for highlighting
    const segs: Array<{ text: string; isHighlight: boolean; label?: string }> = [
      { text, isHighlight: false },
    ];

    for (const add of customizedAdditions) {
      segs.push({ text: add.text, isHighlight: true, label: add.label });
    }

    if (modelFlags) {
      const isParamModified =
        arVal !== defaultValues["aspectRatio"] ||
        modelFmt !== defaultValues["modelFormat"];
      segs.push({
        text: modelFlags,
        isHighlight: isParamModified,
        label: isParamModified ? "Format & Flags" : undefined,
      });
    }

    return { assembledPrompt: fullText, segments: segs };
  }, [basePrompt, resolvedVariables, selectedValues, defaultValues]);

  // Copy to clipboard helper
  const copyPromptText = useCallback(
    async (textToCopy: string, successLabel: string) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }
        setCopied(true);
        setCopyCount((c) => c + 1);
        setToastMessage(successLabel);
        if (slug) {
          incrementPromptCopyAction(slug).catch(() => {});
        }
        setTimeout(() => setCopied(false), 2200);
        setTimeout(() => setToastMessage(null), 3500);
      } catch {
        setToastMessage("Failed to copy. Please manually select the text.");
      }
    },
    [slug]
  );

  // Primary Copy CTA
  const handleCopyCustomized = () => {
    copyPromptText(
      assembledPrompt,
      "Customized prompt copied to clipboard! Ready to paste into your AI generator."
    );
  };

  // Quick-Launch AI Tools
  const handleLaunchTool = (toolName: "Midjourney" | "ChatGPT" | "Flux") => {
    copyPromptText(
      assembledPrompt,
      `Customized prompt copied! Opening ${toolName} in a new tab...`
    );

    let url = "";
    if (toolName === "Midjourney") {
      url = "https://www.midjourney.com/imagine";
    } else if (toolName === "ChatGPT") {
      url = "https://chatgpt.com";
    } else if (toolName === "Flux") {
      url = "https://fal.ai/models/fal-ai/flux/dev";
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      aria-labelledby="prompt-studio-heading"
      className="flex flex-col gap-5 rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-md p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Screen Reader Polite Live Region */}
      <div aria-live="polite" className="sr-only">
        {toastMessage}
      </div>

      {/* Header and Studio Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Wand2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 id="prompt-studio-heading" className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Interactive Prompt Studio</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Live Customizer
              </span>
            </h2>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Customize aspect ratio, lighting style, camera lens, and model output flags in real time.
          </p>
        </div>

        {/* Dual Mode Switch (if prompt has dual variant) */}
        {hasDualMode && (
          <div
            role="tablist"
            aria-label="Prompt customizer mode"
            className="flex rounded-xl bg-surface-raised p-1 border border-surface-border"
          >
            <button
              role="tab"
              aria-selected={activeTab === "single"}
              onClick={() => setActiveTab("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "single"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <span>Single Prompt</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "dual"}
              onClick={() => setActiveTab("dual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dual"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dual Ref (Mode B)</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Controls Panel */}
      <div className="rounded-xl border border-surface-border/80 bg-surface-raised/50 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-faint">
            <Sliders className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
            <span>Customize Prompt Variables</span>
          </div>

          {/* Reset to Tested Original Button */}
          {isModified && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-indigo-400 transition-colors"
              title="Reset all customized variables to author defaults"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Tested Original</span>
            </button>
          )}
        </div>

        {/* Dynamic Variable Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Aspect Ratio Control */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="select-ar" className="flex items-center gap-1 font-semibold text-text-muted">
              <Ratio className="h-3.5 w-3.5 text-indigo-400" />
              <span>Aspect Ratio</span>
            </label>
            <select
              id="select-ar"
              value={selectedValues["aspectRatio"] || "9:16"}
              onChange={(e) => handleVariableChange("aspectRatio", e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="9:16">9:16 (Reels &amp; Story)</option>
              <option value="2:3">2:3 (Classic Portrait)</option>
              <option value="4:5">4:5 (Social Feed)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Cinematic Landscape)</option>
            </select>
          </div>

          {/* 2. Lighting Style Control */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="select-lighting" className="flex items-center gap-1 font-semibold text-text-muted">
              <SunMedium className="h-3.5 w-3.5 text-amber-400" />
              <span>Lighting Style</span>
            </label>
            <select
              id="select-lighting"
              value={selectedValues["lightingStyle"] || "Default"}
              onChange={(e) => handleVariableChange("lightingStyle", e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Default">Default (As Authored)</option>
              <option value="Golden Hour">Golden Hour Sunlight</option>
              <option value="Crisp Studio Daylight">Crisp Studio Daylight</option>
              <option value="Moody Cinematic Neon">Moody Cinematic Neon</option>
              <option value="Soft Diffused Overcast">Soft Diffused Overcast</option>
            </select>
          </div>

          {/* 3. Camera Lens Control */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="select-camera" className="flex items-center gap-1 font-semibold text-text-muted">
              <Camera className="h-3.5 w-3.5 text-emerald-400" />
              <span>Camera Lens</span>
            </label>
            <select
              id="select-camera"
              value={selectedValues["cameraLens"] || "Default"}
              onChange={(e) => handleVariableChange("cameraLens", e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Default">Default (As Authored)</option>
              <option value="35mm Editorial">35mm Editorial (f/1.8)</option>
              <option value="50mm Prime">50mm Prime (f/1.4)</option>
              <option value="85mm f/1.4 Portrait">85mm Portrait (f/1.4)</option>
              <option value="24mm Wide Angle">24mm Wide Angle</option>
            </select>
          </div>

          {/* 4. Model Format Control */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="select-model-fmt" className="flex items-center gap-1 font-semibold text-text-muted">
              <Bot className="h-3.5 w-3.5 text-blue-400" />
              <span>Model Format</span>
            </label>
            <select
              id="select-model-fmt"
              value={selectedValues["modelFormat"] || "Midjourney v6.1"}
              onChange={(e) => handleVariableChange("modelFormat", e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Midjourney v6.1">Midjourney v6.1 (--v 6.1 --ar)</option>
              <option value="Flux.1 Pro">Flux.1 Pro (--ar)</option>
              <option value="DALL-E 3">DALL-E 3 (Natural Prompt)</option>
              <option value="Raw Prompt">Raw Prompt (No Flags)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Assembled Prompt Code Block with Highlighting */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>Live Assembled Prompt</span>
          {isModified && (
            <span className="text-[11px] text-indigo-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Customized overrides applied
            </span>
          )}
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="Customized Prompt Code Block"
          className="relative rounded-xl border border-surface-border bg-surface-raised/80 p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-foreground select-all break-words whitespace-pre-wrap max-h-72 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
        >
          {segments.map((seg, idx) =>
            seg.isHighlight ? (
              <mark
                key={idx}
                title={seg.label ? `Customized: ${seg.label}` : "Customized parameter"}
                className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold px-1 py-0.5 rounded not-italic inline"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={idx}>{seg.text}</span>
            )
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Primary CTA: Copy Customized Prompt */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCustomized}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
              copied
                ? "bg-emerald-600 shadow-emerald-500/25"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Customized Prompt Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Copy Customized Prompt</span>
              </>
            )}
          </button>

          {copyCount > 0 && (
            <span className="text-[11px] font-mono text-text-faint px-2 py-1 rounded bg-surface-raised border border-surface-border">
              {copyCount} {copyCount === 1 ? "copy" : "copies"}
            </span>
          )}
        </div>

        {/* Quick-Launch AI Tools */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-text-faint mr-1">Copy &amp; Open:</span>
          <button
            onClick={() => handleLaunchTool("Midjourney")}
            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-indigo-500/40 hover:text-foreground transition-colors"
            title="Copy customized prompt and open Midjourney"
          >
            <span>Midjourney</span>
            <ExternalLink className="h-3 w-3 text-text-faint" />
          </button>
          <button
            onClick={() => handleLaunchTool("ChatGPT")}
            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-emerald-500/40 hover:text-foreground transition-colors"
            title="Copy customized prompt and open ChatGPT"
          >
            <span>ChatGPT</span>
            <ExternalLink className="h-3 w-3 text-text-faint" />
          </button>
          <button
            onClick={() => handleLaunchTool("Flux")}
            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-purple-500/40 hover:text-foreground transition-colors"
            title="Copy customized prompt and open Flux"
          >
            <span>Flux</span>
            <ExternalLink className="h-3 w-3 text-text-faint" />
          </button>
        </div>
      </div>

      {/* Visual Toast Alert */}
      {toastMessage && (
        <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/30 p-2.5 text-xs text-indigo-300 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-indigo-400 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
