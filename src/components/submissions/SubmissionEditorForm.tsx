"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { PromptCategory, AIModel } from "@/data/prompts";
import type { SubmissionItem } from "@/lib/data/submissions";
import {
  createSubmissionAction,
  updateSubmissionAction,
  uploadCreatorStagingImageAction,
} from "@/app/actions/submissions";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  Send,
  Save,
} from "lucide-react";

interface SubmissionEditorFormProps {
  mode: "create" | "edit";
  initialSubmission?: SubmissionItem;
  hasActiveProfile: boolean;
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

export function SubmissionEditorForm({
  mode,
  initialSubmission,
  hasActiveProfile,
}: SubmissionEditorFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState(initialSubmission?.title || "");
  const [shortDescription, setShortDescription] = useState(initialSubmission?.shortDescription || "");
  const [promptText, setPromptText] = useState(initialSubmission?.prompt || "");
  const [category, setCategory] = useState<PromptCategory>(
    (initialSubmission?.category as PromptCategory) || "photography"
  );
  const [primaryModel, setPrimaryModel] = useState<AIModel>(
    (initialSubmission?.model as AIModel) || "Midjourney v6.1"
  );
  const [compatibleModels, setCompatibleModels] = useState<string[]>(
    initialSubmission?.compatibleModels || ["Midjourney v6.1"]
  );
  const [tags, setTags] = useState((initialSubmission?.tags || []).join(", "));
  const [negativePrompt, setNegativePrompt] = useState(initialSubmission?.negativePrompt || "");
  const [generationParameters, setGenerationParameters] = useState(
    initialSubmission?.generationParameters
      ? JSON.stringify(initialSubmission.generationParameters, null, 2)
      : ""
  );

  // Staged image states
  const [stagedImagePath, setStagedImagePath] = useState(initialSubmission?.stagedImagePath || "");
  const [previewUrl, setPreviewUrl] = useState(initialSubmission?.previewUrl || "");
  const [imageAlt, setImageAlt] = useState(initialSubmission?.imageAlt || "");
  const [width, setWidth] = useState(initialSubmission?.width || 1200);
  const [height, setHeight] = useState(initialSubmission?.height || 800);
  const [aspectRatio, setAspectRatio] = useState<"portrait" | "landscape" | "square">(
    (initialSubmission?.aspectRatio as "portrait" | "landscape" | "square") || "landscape"
  );
  const [aspectRatioValue, setAspectRatioValue] = useState(
    initialSubmission?.aspectRatioValue || "3/2"
  );
  const [dominantColor, setDominantColor] = useState(
    initialSubmission?.dominantColor || "#18181c"
  );

  // Uploading and submission status
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Warn on leave with unsaved changes
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

  // Handle image upload into private staging
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadCreatorStagingImageAction(formData);
    setIsUploading(false);

    if (res.success && res.data) {
      setStagedImagePath(res.data.stagedPath);
      setPreviewUrl(res.data.previewUrl);
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
      setErrorMessage(res.error || "Failed to process and stage image.");
    }
  };

  const toggleCompatibleModel = (m: AIModel) => {
    setIsDirty(true);
    setCompatibleModels((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

  const handleSubmit = async (targetStatus: "DRAFT" | "PENDING_REVIEW") => {
    if (targetStatus === "PENDING_REVIEW" && !hasActiveProfile) {
      setErrorMessage(
        "Creator Profile Required: Please activate your public creator profile in Profile Settings before submitting for review."
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("shortDescription", shortDescription);
    formData.append("prompt", promptText);
    formData.append("category", category);
    formData.append("model", primaryModel);
    for (const m of compatibleModels) {
      formData.append("compatibleModels", m);
    }
    formData.append("tags", tags);
    formData.append("stagedImagePath", stagedImagePath);
    formData.append("imageAlt", imageAlt || title);
    formData.append("width", String(width));
    formData.append("height", String(height));
    formData.append("aspectRatio", aspectRatio);
    formData.append("aspectRatioValue", aspectRatioValue);
    formData.append("dominantColor", dominantColor);
    if (negativePrompt) formData.append("negativePrompt", negativePrompt);
    if (generationParameters) formData.append("generationParameters", generationParameters);

    let res;
    if (mode === "create") {
      res = await createSubmissionAction(formData, targetStatus);
    } else if (initialSubmission) {
      res = await updateSubmissionAction(initialSubmission.id, formData, targetStatus);
    }

    setIsSubmitting(false);

    if (res?.success) {
      setIsDirty(false);
      setSuccessMessage(
        targetStatus === "PENDING_REVIEW"
          ? "Prompt submitted for editorial review. An administrator will review your submission shortly."
          : "Draft saved successfully."
      );

      setTimeout(() => {
        router.push("/dashboard/submissions");
      }, 1000);
    } else {
      setErrorMessage(res?.error || "Failed to save submission.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Return */}
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/submissions"
            className="inline-flex items-center justify-center rounded-xl border border-surface-border bg-surface p-2.5 text-foreground-muted hover:text-white hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {mode === "create" ? "New Prompt Submission" : `Edit Submission: ${initialSubmission?.title}`}
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Submit tested AI prompt instructions to the community. Submissions are reviewed by administrators before public publication.
            </p>
          </div>
        </div>
      </div>

      {!hasActiveProfile && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-amber-300 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-bold text-amber-200">Creator Profile Required for Submission</p>
            <p className="text-foreground-muted leading-relaxed">
              You can save drafts freely, but submitting prompts for editorial review requires an activated public creator profile.
            </p>
          </div>
          <Link
            href="/settings/profile"
            className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
          >
            Activate Profile
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Action Failed</p>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              General Information
            </h2>

            <div>
              <label htmlFor="sub-title" className="block text-xs font-medium text-foreground mb-1.5">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="sub-title"
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g., Ethereal Glass Greenhouse at Sunrise"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label htmlFor="sub-short-desc" className="block text-xs font-medium text-foreground mb-1.5">
                Short Description <span className="text-rose-400">*</span>
              </label>
              <input
                id="sub-short-desc"
                type="text"
                required
                value={shortDescription}
                onChange={(e) => {
                  setShortDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="A warm and detailed architectural study of glasshouse structures..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Prompt Instructions */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Prompt Instructions
            </h2>

            <div>
              <label htmlFor="sub-prompt" className="block text-xs font-medium text-foreground mb-1.5">
                Complete Prompt Text <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="sub-prompt"
                rows={5}
                required
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Enter exact prompt keywords, style references, composition cues, and parameters..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-4 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="sub-neg-prompt" className="block text-xs font-medium text-foreground mb-1.5">
                Negative Prompt (Optional)
              </label>
              <textarea
                id="sub-neg-prompt"
                rows={2}
                value={negativePrompt}
                onChange={(e) => {
                  setNegativePrompt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="blurry, distorted anatomy, watermark, text, low quality..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="sub-gen-params" className="block text-xs font-medium text-foreground mb-1.5">
                Generation Parameters (Optional JSON)
              </label>
              <textarea
                id="sub-gen-params"
                rows={3}
                value={generationParameters}
                onChange={(e) => {
                  setGenerationParameters(e.target.value);
                  setIsDirty(true);
                }}
                placeholder='{\n  "sampler": "DPM++ 2M",\n  "steps": 28,\n  "cfg": 6\n}'
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>
          </div>

          {/* Classification & Models */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Classification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sub-category" className="block text-xs font-medium text-foreground mb-1.5">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  id="sub-category"
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
                <label htmlFor="sub-model" className="block text-xs font-medium text-foreground mb-1.5">
                  Primary AI Model <span className="text-rose-400">*</span>
                </label>
                <select
                  id="sub-model"
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
              <label htmlFor="sub-tags" className="block text-xs font-medium text-foreground mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                id="sub-tags"
                type="text"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="architecture, greenhouse, glass, lighting, cinematic"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Image Staging & Actions */}
        <div className="space-y-6">
          {/* Submission Actions Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Submit Prompt
            </h2>

            <p className="text-xs text-foreground-muted leading-relaxed">
              You can save your progress as a private draft anytime, or submit it to the editorial team for review.
            </p>

            <div className="space-y-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit("PENDING_REVIEW")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit for Editorial Review
              </button>

              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit("DRAFT")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-surface-raised border border-surface-border px-4 py-2.5 text-xs font-medium text-foreground hover:bg-surface-border disabled:opacity-50 transition-colors"
              >
                <Save className="h-3.5 w-3.5 text-foreground-muted" />
                Save as Draft
              </button>
            </div>
          </div>

          {/* Staged Image Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Prompt Output Image
            </h2>

            {/* Preview Box */}
            <div
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-surface-border flex items-center justify-center group"
              style={{ backgroundColor: dominantColor }}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={imageAlt || "Staged prompt image preview"}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-foreground-muted/60 p-4 text-center">
                  <ImageIcon className="h-10 w-10 mb-2 stroke-[1.5]" />
                  <p className="text-xs">No image staged yet</p>
                  <p className="text-[10px] mt-0.5">JPEG, PNG, WebP up to 10 MiB</p>
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                  <p className="text-xs text-foreground font-medium">Validating & staging media...</p>
                </div>
              )}
            </div>

            {/* File Input */}
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
              <span>{stagedImagePath ? "Replace Staged Image" : "Upload Output Image"}</span>
            </button>

            <div>
              <label htmlFor="sub-image-alt" className="block text-[11px] font-medium text-foreground-muted mb-1">
                Image Description (Alt Text)
              </label>
              <input
                id="sub-image-alt"
                type="text"
                value={imageAlt}
                onChange={(e) => {
                  setImageAlt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Descriptive text of the image visual contents"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
