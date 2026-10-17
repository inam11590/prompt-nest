"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { PromptItem, PromptCategory, AIModel } from "@/data/prompts";
import {
  createPromptAction,
  updatePromptAction,
  uploadImageAction,
} from "@/app/actions/admin-prompts";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  Image as ImageIcon,
  ArrowLeft,
  Lock,
  RefreshCw,
  Eye,
} from "lucide-react";

interface PromptEditorFormProps {
  mode: "create" | "edit";
  initialPrompt?: PromptItem;
}

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: "photography", label: "Photography" },
  { value: "digital-art", label: "Digital Art" },
  { value: "architecture", label: "Architecture" },
  { value: "character-design", label: "Character Design" },
  { value: "nature", label: "Nature" },
  { value: "graphic-design", label: "Graphic Design" },
];

const AI_MODELS: AIModel[] = [
  "Midjourney v6.1",
  "DALL-E 3",
  "FLUX.1 [dev]",
  "Stable Diffusion XL",
  "ChatGPT-4o",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function PromptEditorForm({ mode, initialPrompt }: PromptEditorFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState(initialPrompt?.title || "");
  const [slug, setSlug] = useState(initialPrompt?.slug || "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [shortDescription, setShortDescription] = useState(initialPrompt?.shortDescription || "");
  const [promptText, setPromptText] = useState(initialPrompt?.prompt || "");
  const [category, setCategory] = useState<PromptCategory>(
    initialPrompt?.category || "photography"
  );
  const [primaryModel, setPrimaryModel] = useState<AIModel>(
    initialPrompt?.model || "Midjourney v6.1"
  );
  const [compatibleModels, setCompatibleModels] = useState<string[]>(
    initialPrompt?.compatibleModels || [initialPrompt?.model || "Midjourney v6.1"]
  );
  const [tags, setTags] = useState((initialPrompt?.tags || []).join(", "));
  const [negativePrompt, setNegativePrompt] = useState(initialPrompt?.negativePrompt || "");
  const [generationParameters, setGenerationParameters] = useState(
    initialPrompt?.generationParameters
      ? JSON.stringify(initialPrompt.generationParameters, null, 2)
      : ""
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialPrompt?.status || "draft"
  );

  // Image states
  const [imageUrl, setImageUrl] = useState(initialPrompt?.imageUrl || "");
  const [imageAlt, setImageAlt] = useState(initialPrompt?.imageAlt || "");
  const [width, setWidth] = useState(initialPrompt?.width || 1200);
  const [height, setHeight] = useState(initialPrompt?.height || 800);
  const [aspectRatio, setAspectRatio] = useState<"portrait" | "landscape" | "square">(
    initialPrompt?.aspectRatio || "landscape"
  );
  const [aspectRatioValue, setAspectRatioValue] = useState(
    initialPrompt?.aspectRatioValue || "3/2"
  );
  const [dominantColor, setDominantColor] = useState(
    initialPrompt?.dominantColor || "#18181c"
  );

  // Uploading and submission states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Concurrency tracker: store the exact timestamp of initial load
  const expectedUpdatedAt = initialPrompt?.updatedAt;

  // Slug immutability rule: If the prompt was published, the slug is permanently locked
  const isSlugLocked =
    mode === "edit" &&
    (initialPrompt?.status === "published" || initialPrompt?.status === "archived");

  // Auto-slugify when title changes in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    if (!slugManuallyEdited && mode === "create") {
      setSlug(slugify(val));
    }
  };

  // Warn on tab close with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Handle image file selection & upload pipeline
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadImageAction(formData);
    setIsUploading(false);

    if (res.success && res.data) {
      setImageUrl(res.data.imageUrl);
      setWidth(res.data.width);
      setHeight(res.data.height);
      setAspectRatio(res.data.aspectRatio);
      setAspectRatioValue(res.data.aspectRatioValue);
      setDominantColor(res.data.dominantColor);
      if (!imageAlt) {
        setImageAlt(title || file.name.replace(/\.[^/.]+$/, ""));
      }
      setIsDirty(true);
    } else {
      setErrorMessage(res.error || "Failed to process and upload image.");
    }
  };

  const toggleCompatibleModel = (m: AIModel) => {
    setIsDirty(true);
    setCompatibleModels((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

  // Handle Form Submission
  const handleSubmit = async (targetStatus?: "draft" | "published" | "archived") => {
    const finalStatus = targetStatus || status;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("shortDescription", shortDescription);
    formData.append("prompt", promptText);
    formData.append("category", category);
    formData.append("model", primaryModel);
    for (const m of compatibleModels) {
      formData.append("compatibleModels", m);
    }
    formData.append("tags", tags);
    formData.append("imageUrl", imageUrl);
    formData.append("imageAlt", imageAlt || title);
    formData.append("width", String(width));
    formData.append("height", String(height));
    formData.append("aspectRatio", aspectRatio);
    formData.append("aspectRatioValue", aspectRatioValue);
    formData.append("dominantColor", dominantColor);
    formData.append("status", finalStatus);
    if (negativePrompt) formData.append("negativePrompt", negativePrompt);
    if (generationParameters) formData.append("generationParameters", generationParameters);

    let res;
    if (mode === "create") {
      res = await createPromptAction(formData);
    } else if (initialPrompt) {
      res = await updatePromptAction(initialPrompt.id, formData, expectedUpdatedAt);
    }

    setIsSubmitting(false);

    if (res?.success && res.data) {
      setIsDirty(false);
      setSuccessMessage(
        mode === "create"
          ? `Prompt "${title}" successfully created.`
          : `Prompt "${title}" updated successfully.`
      );

      // Navigate appropriately
      setTimeout(() => {
        if (finalStatus === "published") {
          router.push(`/prompts/${res.data?.slug || slug}`);
        } else {
          router.push("/admin");
        }
      }, 1000);
    } else {
      setErrorMessage(res?.error || "An error occurred while saving prompt.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-surface-border bg-surface p-2.5 text-foreground-muted hover:text-white hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {mode === "create" ? "Create New Prompt" : `Edit Prompt: ${initialPrompt?.title}`}
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              {mode === "create"
                ? "Add a new AI prompt with server-side image processing and publication controls."
                : `ID: ${initialPrompt?.id} • Slug: /${initialPrompt?.slug}`}
            </p>
          </div>
        </div>

        {mode === "edit" && initialPrompt && (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/prompts/${initialPrompt.id}/preview`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:text-indigo-400 hover:border-indigo-500/30 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Page
            </Link>
          </div>
        )}
      </div>

      {/* Alert Notices */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Unable to save prompt</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">Success</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Prompt Data & Text (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              General Information
            </h2>

            <div>
              <label htmlFor="prompt-title" className="block text-xs font-medium text-foreground mb-1.5">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="prompt-title"
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Cyberpunk Street in Tokyo Rain"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="prompt-slug" className="block text-xs font-medium text-foreground">
                  URL Slug <span className="text-rose-400">*</span>
                </label>
                {isSlugLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                    <Lock className="h-3 w-3" />
                    Locked (Published)
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-surface-border bg-surface px-3 py-2.5 text-xs text-foreground-muted font-mono">
                  /prompts/
                </span>
                <input
                  id="prompt-slug"
                  type="text"
                  required
                  disabled={isSlugLocked}
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(slugify(e.target.value));
                    setIsDirty(true);
                  }}
                  placeholder="cyberpunk-street-tokyo"
                  className={`w-full rounded-r-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isSlugLocked ? "opacity-60 cursor-not-allowed bg-surface" : ""
                  }`}
                />
              </div>
              <p className="text-[11px] text-foreground-muted mt-1.5">
                {isSlugLocked
                  ? "Slugs are permanently immutable once a prompt has been published to safeguard bookmarks, social shares, and SEO rankings."
                  : "Lowercase alphanumeric characters and hyphens only."}
              </p>
            </div>

            <div>
              <label htmlFor="prompt-short-desc" className="block text-xs font-medium text-foreground mb-1.5">
                Short Description <span className="text-rose-400">*</span>
              </label>
              <input
                id="prompt-short-desc"
                type="text"
                required
                value={shortDescription}
                onChange={(e) => {
                  setShortDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="A high-contrast cinematic portrait featuring vibrant neon reflections..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Prompt Content */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Prompt Instructions
            </h2>

            <div>
              <label htmlFor="prompt-main-text" className="block text-xs font-medium text-foreground mb-1.5">
                Complete Prompt Text <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="prompt-main-text"
                rows={5}
                required
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Enter complete prompt instructions, style descriptors, lighting parameters, and aspect ratios..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-4 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="prompt-negative-text" className="block text-xs font-medium text-foreground mb-1.5">
                Negative Prompt (Optional)
              </label>
              <textarea
                id="prompt-negative-text"
                rows={2}
                value={negativePrompt}
                onChange={(e) => {
                  setNegativePrompt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="blurry, distorted anatomy, watermark, low quality, oversaturated..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="prompt-gen-params" className="block text-xs font-medium text-foreground mb-1.5">
                Generation Parameters (Optional JSON)
              </label>
              <textarea
                id="prompt-gen-params"
                rows={3}
                value={generationParameters}
                onChange={(e) => {
                  setGenerationParameters(e.target.value);
                  setIsDirty(true);
                }}
                placeholder='{\n  "sampler": "DPM++ 2M Karras",\n  "steps": 30,\n  "cfg_scale": 7\n}'
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>
          </div>

          {/* Taxonomy & AI Models */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Classification & Compatibility
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prompt-category" className="block text-xs font-medium text-foreground mb-1.5">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  id="prompt-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as PromptCategory);
                    setIsDirty(true);
                  }}
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prompt-primary-model" className="block text-xs font-medium text-foreground mb-1.5">
                  Primary AI Model <span className="text-rose-400">*</span>
                </label>
                <select
                  id="prompt-primary-model"
                  value={primaryModel}
                  onChange={(e) => {
                    const m = e.target.value as AIModel;
                    setPrimaryModel(m);
                    if (!compatibleModels.includes(m)) {
                      setCompatibleModels((prev) => [...prev, m]);
                    }
                    setIsDirty(true);
                  }}
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {AI_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-2">
                Compatible Models
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AI_MODELS.map((m) => {
                  const checked = compatibleModels.includes(m);
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => toggleCompatibleModel(m)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-colors text-left ${
                        checked
                          ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
                          : "border-surface-border bg-surface-raised text-foreground-muted hover:border-surface-border/80"
                      }`}
                    >
                      <span
                        className={`h-3 w-3 rounded-md border flex items-center justify-center text-[10px] ${
                          checked
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "border-surface-border"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="truncate">{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="prompt-tags" className="block text-xs font-medium text-foreground mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                id="prompt-tags"
                type="text"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="cinematic, neon, cyberpunk, tokyo, rain, 8k"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Image Upload & Publication Lifecycle (1 col) */}
        <div className="space-y-6">
          {/* Publication Lifecycle Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Publication Status
            </h2>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStatus("draft");
                  setIsDirty(true);
                }}
                className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                  status === "draft"
                    ? "border-amber-500/60 bg-amber-500/10 shadow-sm text-amber-300"
                    : "border-surface-border bg-surface-raised text-foreground-muted hover:border-surface-border/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Draft</p>
                    <p className="text-[11px] text-foreground-muted">
                      Hidden from public gallery & search
                    </p>
                  </div>
                </div>
                {status === "draft" && <span className="text-amber-400 text-xs font-bold">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus("published");
                  setIsDirty(true);
                }}
                className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                  status === "published"
                    ? "border-emerald-500/60 bg-emerald-500/10 shadow-sm text-emerald-300"
                    : "border-surface-border bg-surface-raised text-foreground-muted hover:border-surface-border/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Published</p>
                    <p className="text-[11px] text-foreground-muted">
                      Publicly visible, bookmarked & indexed
                    </p>
                  </div>
                </div>
                {status === "published" && (
                  <span className="text-emerald-400 text-xs font-bold">✓</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus("archived");
                  setIsDirty(true);
                }}
                className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                  status === "archived"
                    ? "border-zinc-500/60 bg-zinc-500/10 shadow-sm text-zinc-300"
                    : "border-surface-border bg-surface-raised text-foreground-muted hover:border-surface-border/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Archived</p>
                    <p className="text-[11px] text-foreground-muted">
                      Hidden & retired, preserved in history
                    </p>
                  </div>
                </div>
                {status === "archived" && (
                  <span className="text-zinc-400 text-xs font-bold">✓</span>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-surface-border space-y-2">
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit("published")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Publish Live
              </button>

              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit("draft")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-surface-raised border border-surface-border px-4 py-2.5 text-xs font-medium text-foreground hover:bg-surface-border disabled:opacity-50 transition-colors"
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Save as Draft
              </button>
            </div>
          </div>

          {/* Image Asset & Storage Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Image Asset
            </h2>

            {/* Image Preview */}
            <div
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-surface-border flex items-center justify-center group"
              style={{ backgroundColor: dominantColor }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt || "Uploaded prompt preview"}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-foreground-muted/60 p-4 text-center">
                  <ImageIcon className="h-10 w-10 mb-2 stroke-[1.5]" />
                  <p className="text-xs">No image uploaded yet</p>
                  <p className="text-[10px] mt-0.5">JPEG, PNG, WebP up to 10 MiB</p>
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                  <p className="text-xs text-foreground font-medium">Processing & uploading...</p>
                </div>
              )}
            </div>

            {/* File Upload Trigger */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border bg-surface-raised px-4 py-3 text-xs font-medium text-foreground hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors"
            >
              <UploadCloud className="h-4 w-4 text-indigo-400" />
              <span>{imageUrl ? "Replace Image File" : "Upload Image File"}</span>
            </button>

            {/* Image Properties */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label htmlFor="prompt-image-url" className="block text-[11px] font-medium text-foreground-muted mb-1">
                  Image URL
                </label>
                <input
                  id="prompt-image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label htmlFor="prompt-image-alt" className="block text-[11px] font-medium text-foreground-muted mb-1">
                  Alt Text (Accessibility)
                </label>
                <input
                  id="prompt-image-alt"
                  type="text"
                  value={imageAlt}
                  onChange={(e) => {
                    setImageAlt(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Descriptive text for screen readers"
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="prompt-width" className="block text-[10px] text-foreground-muted mb-0.5">
                    Width: {width}px
                  </label>
                  <input
                    id="prompt-width"
                    type="number"
                    value={width}
                    onChange={(e) => {
                      setWidth(parseInt(e.target.value, 10) || 1200);
                      setIsDirty(true);
                    }}
                    className="w-full rounded-lg border border-surface-border bg-surface-raised px-2 py-1 text-xs font-mono text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="prompt-height" className="block text-[10px] text-foreground-muted mb-0.5">
                    Height: {height}px
                  </label>
                  <input
                    id="prompt-height"
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(parseInt(e.target.value, 10) || 800);
                      setIsDirty(true);
                    }}
                    className="w-full rounded-lg border border-surface-border bg-surface-raised px-2 py-1 text-xs font-mono text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-foreground-muted">Dominant Color:</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-4 w-4 rounded-md border border-surface-border"
                    style={{ backgroundColor: dominantColor }}
                  />
                  <input
                    type="text"
                    value={dominantColor}
                    onChange={(e) => {
                      setDominantColor(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-20 rounded-md border border-surface-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
