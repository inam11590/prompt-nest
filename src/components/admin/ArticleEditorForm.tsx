"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ArticleItem, ArticleAuthor } from "@/lib/data/articles";
import {
  createArticleAction,
  updateArticleAction,
  uploadArticleCoverImageAction,
} from "@/app/actions/articles";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  Send,
  Save,
  Lock,
  Sparkles,
  Search,
  Check,
  Eye,
} from "lucide-react";

interface ArticleEditorFormProps {
  mode: "create" | "edit";
  initialArticle?: ArticleItem;
  initialPromptIds?: string[];
  availableAuthors?: ArticleAuthor[];
  availablePrompts?: Array<{ id: string; title: string; category: string; model: string }>;
}

const CATEGORIES = [
  { value: "guide", label: "Guide" },
  { value: "tutorial", label: "Tutorial" },
  { value: "prompt-engineering", label: "Prompt Engineering" },
  { value: "case-study", label: "Case Study" },
  { value: "overview", label: "Overview" },
];

export function ArticleEditorForm({
  mode,
  initialArticle,
  initialPromptIds = [],
  availableAuthors = [],
  availablePrompts = [],
}: ArticleEditorFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || "");
  const [content, setContent] = useState(initialArticle?.content || "");
  const [category, setCategory] = useState(initialArticle?.category || "guide");
  const [tags, setTags] = useState((initialArticle?.tags || []).join(", "));
  const [authorId, setAuthorId] = useState(initialArticle?.authorId || "");
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>(initialPromptIds);

  // Cover image states
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.coverImageUrl || "");
  const [coverImageAlt, setCoverImageAlt] = useState(initialArticle?.coverImageAlt || "");
  const [coverImageWidth, setCoverImageWidth] = useState(initialArticle?.coverImageWidth || 1200);
  const [coverImageHeight, setCoverImageHeight] = useState(initialArticle?.coverImageHeight || 630);
  const [coverImageDominantColor, setCoverImageDominantColor] = useState(
    initialArticle?.coverImageDominantColor || "#18181c"
  );

  // UI & Mutation states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [promptFilter, setPromptFilter] = useState("");

  const isSlugLocked = mode === "edit" && Boolean(initialArticle?.publishedAt);

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

  const handleGenerateSlug = () => {
    if (isSlugLocked) return;
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
    setSlug(generated);
    setIsDirty(true);
  };

  // Upload Cover Image via validated Sharp pipeline
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "articles");

      let res: {
        success: boolean;
        data?: {
          imageUrl: string;
          width: number;
          height: number;
          aspectRatio?: string;
          dominantColor: string;
        };
        error?: string;
      };

      try {
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        res = await response.json();
      } catch (fetchErr) {
        console.warn("Direct upload endpoint failed, falling back to server action:", fetchErr);
        res = await uploadArticleCoverImageAction(formData);
      }

      if (res.success && res.data) {
        setCoverImageUrl(res.data.imageUrl);
        setCoverImageWidth(res.data.width);
        setCoverImageHeight(res.data.height);
        setCoverImageDominantColor(res.data.dominantColor);
        if (!coverImageAlt) {
          setCoverImageAlt(title || file.name.replace(/\.[^/.]+$/, ""));
        }
        setIsDirty(true);
      } else {
        setErrorMessage(res.error || "Failed to upload cover image.");
      }
    } catch (err) {
      console.error("handleCoverUpload error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Network error during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const togglePromptAssociation = (pId: string) => {
    setIsDirty(true);
    setSelectedPromptIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("excerpt", excerpt);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("tags", tags);
    if (coverImageUrl) formData.append("coverImageUrl", coverImageUrl);
    if (coverImageAlt) formData.append("coverImageAlt", coverImageAlt);
    formData.append("coverImageWidth", String(coverImageWidth));
    formData.append("coverImageHeight", String(coverImageHeight));
    formData.append("coverImageDominantColor", coverImageDominantColor);
    if (authorId) formData.append("authorId", authorId);

    for (const pId of selectedPromptIds) {
      formData.append("promptIds", pId);
    }

    let res;
    if (mode === "create") {
      res = await createArticleAction(formData, targetStatus);
    } else if (initialArticle) {
      res = await updateArticleAction(
        initialArticle.id,
        initialArticle.concurrencyVersion,
        formData,
        targetStatus
      );
    }

    setIsSubmitting(false);

    if (res?.success) {
      setIsDirty(false);
      setSuccessMessage(
        targetStatus === "PUBLISHED"
          ? "Article published successfully."
          : "Draft saved successfully."
      );

      setTimeout(() => {
        router.push("/admin/articles");
      }, 1000);
    } else {
      setErrorMessage(res?.error || "Failed to save article.");
    }
  };

  const filteredPrompts = availablePrompts.filter((p) =>
    p.title.toLowerCase().includes(promptFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(promptFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header and Return Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles"
            className="inline-flex items-center justify-center rounded-xl border border-surface-border bg-surface p-2.5 text-foreground-muted hover:text-white hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {mode === "create" ? "Write New Article" : `Edit Article: ${initialArticle?.title}`}
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Draft comprehensive guides, tutorials, and prompt techniques. Content is safely rendered using server-side markdown.
            </p>
          </div>
        </div>

        {mode === "edit" && initialArticle && (
          <Link
            href={`/admin/articles/${initialArticle.id}/preview`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface-border transition-colors shrink-0"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            Private Preview
          </Link>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Save Failed</p>
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Title, Excerpt, Content Markdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="art-title" className="block text-xs font-medium text-foreground">
                  Title <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-foreground-muted">{title.length} / 150</span>
              </div>
              <input
                id="art-title"
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Mastering Lighting and Optics in Midjourney v6"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="art-slug" className="block text-xs font-medium text-foreground">
                  URL Slug <span className="text-rose-400">*</span>
                  {isSlugLocked && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-400">
                      <Lock className="h-2.5 w-2.5" /> Locked (Published)
                    </span>
                  )}
                </label>
                {!isSlugLocked && (
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-generate
                  </button>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs">
                <span className="text-foreground-muted mr-1">/blog/</span>
                <input
                  id="art-slug"
                  type="text"
                  required
                  disabled={isSlugLocked}
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="mastering-lighting-and-optics"
                  className="w-full bg-transparent font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="art-excerpt" className="block text-xs font-medium text-foreground">
                  Short Excerpt <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-foreground-muted">{excerpt.length} / 300</span>
              </div>
              <textarea
                id="art-excerpt"
                rows={3}
                required
                maxLength={300}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="A concise summary of key concepts covered in this guide for search snippets and preview cards..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised p-3 text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              />
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="art-content" className="block text-xs font-medium text-foreground">
                Article Body (Markdown) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-foreground-muted">
                Supports ## Headings, lists, `code`, blockquotes & links
              </span>
            </div>

            <textarea
              id="art-content"
              rows={16}
              required
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              placeholder="## Introduction&#10;&#10;Write clear, actionable steps for artists and prompt engineers...&#10;&#10;### Key Techniques&#10;&#10;- Aperture settings: f/1.4 for shallow depth of field&#10;- Volumetric fog: adds cinematic atmospheric separation&#10;&#10;```&#10;cinematic 35mm street portrait, Kodachrome, f/1.4 aperture --v 6.1&#10;```"
              className="w-full rounded-xl border border-surface-border bg-surface-raised p-4 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
            />
          </div>

          {/* Associated Contextual Prompts Picker */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
                Contextual Prompt Associations
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Select published prompts referenced in this article. They will appear as interactive cards at the bottom of the article and link back to this guide on their detail pages.
              </p>
            </div>

            {/* Prompt Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground-muted" />
              <input
                type="text"
                value={promptFilter}
                onChange={(e) => setPromptFilter(e.target.value)}
                placeholder="Filter prompts by title or category..."
                className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Prompts Selection List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-xl border border-surface-border bg-surface-raised p-2">
              {filteredPrompts.length === 0 ? (
                <p className="text-xs text-foreground-muted text-center py-4">No matching prompts found.</p>
              ) : (
                filteredPrompts.map((p) => {
                  const isSelected = selectedPromptIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePromptAssociation(p.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                          : "hover:bg-surface text-foreground-muted hover:text-foreground border border-transparent"
                      }`}
                    >
                      <div className="truncate pr-3">
                        <span className="font-medium text-white">{p.title}</span>
                        <span className="text-[10px] text-foreground-muted ml-2">({p.model} • {p.category})</span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                          isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "border-surface-border"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <p className="text-[11px] text-foreground-muted">
              {selectedPromptIds.length} prompt{selectedPromptIds.length === 1 ? "" : "s"} selected.
            </p>
          </div>
        </div>

        {/* Right 1 Col: Publishing Actions, Cover Image & Metadata */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Publishing Actions
            </h2>

            <div className="space-y-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit("PUBLISHED")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Publish Article
              </button>

              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => handleSubmit("DRAFT")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-surface-raised border border-surface-border px-4 py-2.5 text-xs font-medium text-foreground hover:bg-surface-border disabled:opacity-50 transition-colors"
              >
                <Save className="h-3.5 w-3.5 text-foreground-muted" />
                Save Draft
              </button>
            </div>
          </div>

          {/* Cover Image Upload Card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Cover Image (Optional)
            </h2>

            <div
              className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-surface-border flex items-center justify-center group"
              style={{ backgroundColor: coverImageDominantColor }}
            >
              {coverImageUrl ? (
                <Image
                  src={coverImageUrl}
                  alt={coverImageAlt || "Article cover"}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-foreground-muted/60 p-4 text-center">
                  <ImageIcon className="h-8 w-8 mb-2 stroke-[1.5]" />
                  <p className="text-xs">No cover image uploaded</p>
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                  <p className="text-xs text-foreground font-medium">Processing cover...</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border bg-surface-raised px-4 py-2.5 text-xs font-medium text-foreground hover:border-indigo-500/50 transition-colors"
            >
              <UploadCloud className="h-4 w-4 text-indigo-400" />
              <span>{coverImageUrl ? "Replace Cover Image" : "Upload Cover Image"}</span>
            </button>

            {coverImageUrl && (
              <div>
                <label htmlFor="art-cover-alt" className="block text-[11px] font-medium text-foreground-muted mb-1">
                  Cover Alt Text <span className="text-rose-400">*</span>
                </label>
                <input
                  id="art-cover-alt"
                  type="text"
                  value={coverImageAlt}
                  onChange={(e) => {
                    setCoverImageAlt(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Descriptive alt text for the cover image"
                  className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}
          </div>

          {/* Classification & Assigned Author */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Metadata & Attribution
            </h2>

            <div>
              <label htmlFor="art-category" className="block text-xs font-medium text-foreground mb-1.5">
                Category
              </label>
              <select
                id="art-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="art-author" className="block text-xs font-medium text-foreground mb-1.5">
                Assigned Author (Optional)
              </label>
              <select
                id="art-author"
                value={authorId}
                onChange={(e) => {
                  setAuthorId(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">PromptNest Editorial Team (Default)</option>
                {availableAuthors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName || a.username} (@{a.username})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-foreground-muted mt-1">
                Only active public creator accounts are eligible for editorial attribution.
              </p>
            </div>

            <div>
              <label htmlFor="art-tags" className="block text-xs font-medium text-foreground mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                id="art-tags"
                type="text"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="midjourney, lighting, optics, flux"
                className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
