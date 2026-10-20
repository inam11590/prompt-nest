"use client";

import React, { useState, useMemo, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { PromptItem } from "@/data/prompts";
import { setPromptStatusAction } from "@/app/actions/admin-prompts";
import {
  Search,
  Plus,
  ExternalLink,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  MoreVertical,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  History,
} from "lucide-react";
import type { AdminAuditLogEntry } from "@/lib/data/prompts";

interface AdminDashboardClientProps {
  prompts: PromptItem[];
  totalMatching: number;
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  auditLogs: AdminAuditLogEntry[];
  initialStatus: string;
  initialQuery: string;
  initialCategory: string;
  initialModel: string;
  initialSort: string;
  currentPage: number;
  pageSize: number;
}

function subscribeToOverrides(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOverridesSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("promptnest_admin_overrides") || "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

export function AdminDashboardClient({
  prompts,
  totalMatching,
  stats,
  auditLogs,
  initialStatus,
  initialQuery,
  initialCategory,
  initialModel,
  initialSort,
  currentPage,
  pageSize,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialQuery);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const rawOverrides = useSyncExternalStore(subscribeToOverrides, getOverridesSnapshot, getServerSnapshot);

  const displayPrompts = useMemo(() => {
    if (!rawOverrides) return prompts;
    try {
      const overrides = JSON.parse(rawOverrides);
      if (!overrides || typeof overrides !== "object") return prompts;
      return prompts.map((p) => {
        const override = overrides[p.id] || overrides[p.slug];
        return override ? { ...p, ...override } : p;
      });
    } catch {
      return prompts;
    }
  }, [prompts, rawOverrides]);

  // Helper to update URL params
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    for (const [key, val] of Object.entries(newParams)) {
      if (val === null || val === "" || (key === "page" && val === "1") || (key === "status" && val === "all")) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    startTransition(() => {
      router.push(`/admin?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: search.trim() || null, page: "1" });
  };

  const handleStatusChange = async (
    promptId: string,
    newStatus: "draft" | "published" | "archived"
  ) => {
    setActiveMenuId(null);
    setStatusMessage(null);

    const res = await setPromptStatusAction(promptId, newStatus);
    if (res.success) {
      setStatusMessage({
        type: "success",
        text: `Prompt status updated to "${newStatus}".`,
      });
      router.refresh();
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to update prompt status.",
      });
    }
  };

  const totalPages = Math.ceil(totalMatching / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Prompts Management
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage your AI image generation prompt library, publication lifecycle, and assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/prompts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Prompt
          </Link>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => updateParams({ status: "all", page: "1" })}
          className={`flex flex-col text-left rounded-2xl border p-5 transition-all ${
            initialStatus === "all"
              ? "border-indigo-500/60 bg-indigo-500/5 shadow-md shadow-indigo-500/10"
              : "border-surface-border bg-surface hover:border-surface-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Total Prompts</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="mt-3 text-2xl font-bold tracking-tight text-white">
            {stats.total}
          </span>
          <span className="mt-1 text-[11px] text-foreground-muted">All catalog entries</span>
        </button>

        <button
          onClick={() => updateParams({ status: "published", page: "1" })}
          className={`flex flex-col text-left rounded-2xl border p-5 transition-all ${
            initialStatus === "published"
              ? "border-emerald-500/60 bg-emerald-500/5 shadow-md shadow-emerald-500/10"
              : "border-surface-border bg-surface hover:border-surface-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Published</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
            {stats.published}
          </span>
          <span className="mt-1 text-[11px] text-foreground-muted">Live on public gallery</span>
        </button>

        <button
          onClick={() => updateParams({ status: "draft", page: "1" })}
          className={`flex flex-col text-left rounded-2xl border p-5 transition-all ${
            initialStatus === "draft"
              ? "border-amber-500/60 bg-amber-500/5 shadow-md shadow-amber-500/10"
              : "border-surface-border bg-surface hover:border-surface-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Drafts</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <span className="mt-3 text-2xl font-bold tracking-tight text-amber-400">
            {stats.draft}
          </span>
          <span className="mt-1 text-[11px] text-foreground-muted">Hidden from public</span>
        </button>

        <button
          onClick={() => updateParams({ status: "archived", page: "1" })}
          className={`flex flex-col text-left rounded-2xl border p-5 transition-all ${
            initialStatus === "archived"
              ? "border-zinc-500/60 bg-zinc-500/5 shadow-md shadow-zinc-500/10"
              : "border-surface-border bg-surface hover:border-surface-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Archived</span>
            <Archive className="h-4 w-4 text-zinc-400" />
          </div>
          <span className="mt-3 text-2xl font-bold tracking-tight text-zinc-300">
            {stats.archived}
          </span>
          <span className="mt-1 text-[11px] text-foreground-muted">Preserved & retired</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-surface-border bg-surface p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts by title, slug, or content..."
              className="w-full rounded-xl border border-surface-border bg-surface-raised pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </form>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-foreground-muted hidden sm:block" />
            <select
              value={initialCategory}
              onChange={(e) => updateParams({ category: e.target.value, page: "1" })}
              className="rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Categories</option>
              <option value="photography">Photography</option>
              <option value="digital-art">Digital Art</option>
              <option value="architecture">Architecture</option>
              <option value="character-design">Character Design</option>
              <option value="nature">Nature</option>
              <option value="graphic-design">Graphic Design</option>
            </select>

            {/* Model Filter */}
            <select
              value={initialModel}
              onChange={(e) => updateParams({ model: e.target.value, page: "1" })}
              className="rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="All Models">All Models</option>
              <option value="Midjourney v6.1">Midjourney v6.1</option>
              <option value="DALL-E 3">DALL-E 3</option>
              <option value="FLUX.1 [dev]">FLUX.1 [dev]</option>
              <option value="Stable Diffusion XL">Stable Diffusion XL</option>
              <option value="ChatGPT-4o">ChatGPT-4o</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 pl-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-foreground-muted hidden sm:block" />
              <select
                value={initialSort}
                onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
                className="rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips & Matching Count */}
        <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-surface-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-white">{prompts.length}</strong> of{" "}
              <strong className="text-white">{totalMatching}</strong> prompts
            </span>
            {initialStatus !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-foreground border border-surface-border">
                Status: {initialStatus}
                <button
                  onClick={() => updateParams({ status: "all", page: "1" })}
                  className="hover:text-rose-400 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {initialCategory !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-foreground border border-surface-border">
                Category: {initialCategory}
                <button
                  onClick={() => updateParams({ category: "all", page: "1" })}
                  className="hover:text-rose-400 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {initialModel !== "All Models" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-foreground border border-surface-border">
                Model: {initialModel}
                <button
                  onClick={() => updateParams({ model: "All Models", page: "1" })}
                  className="hover:text-rose-400 ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {initialQuery && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-foreground border border-surface-border">
                Search: &quot;{initialQuery}&quot;
                <button
                  onClick={() => {
                    setSearch("");
                    updateParams({ q: null, page: "1" });
                  }}
                  className="hover:text-rose-400 ml-1"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {(initialStatus !== "all" ||
            initialCategory !== "all" ||
            initialModel !== "All Models" ||
            initialQuery) && (
            <button
              onClick={() => {
                setSearch("");
                startTransition(() => router.push("/admin"));
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Prompts Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border bg-surface-raised text-xs uppercase text-foreground-muted">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Prompt
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Category & Model
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Dates
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {displayPrompts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised border border-surface-border text-foreground-muted mb-3">
                        <Layers className="h-6 w-6" />
                      </div>
                      <p className="text-base font-medium text-white">No prompts found</p>
                      <p className="text-xs text-foreground-muted mt-1 max-w-sm">
                        No prompts match the active filters or search terms. Try clearing filters or create a new prompt.
                      </p>
                      <Link
                        href="/admin/prompts/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Prompt
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                displayPrompts.map((prompt) => {
                  const status = prompt.status || "published";
                  const isMenuOpen = activeMenuId === prompt.id;

                  return (
                    <tr
                      key={prompt.id}
                      className="hover:bg-surface-raised/40 transition-colors group"
                    >
                      {/* Image & Title Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-surface-border"
                            style={{ backgroundColor: prompt.dominantColor || "#18181c" }}
                          >
                            <Image
                              src={prompt.imageUrl}
                              alt={prompt.imageAlt || prompt.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 max-w-xs md:max-w-md">
                            <p className="font-semibold text-white truncate text-sm">
                              {prompt.title}
                            </p>
                            <p className="text-xs text-foreground-muted truncate font-mono mt-0.5">
                              /{prompt.slug}
                            </p>
                            <p className="text-xs text-foreground-muted/80 line-clamp-1 mt-1">
                              {prompt.shortDescription}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Model Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex rounded-md bg-surface-raised border border-surface-border px-2 py-0.5 text-xs text-foreground font-medium capitalize">
                            {prompt.category.replace("-", " ")}
                          </span>
                          <span className="inline-flex rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-medium">
                            {prompt.model}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {status === "published" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Published
                          </span>
                        )}
                        {status === "draft" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400">
                            <Clock className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                        {status === "archived" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 px-2.5 py-1 text-xs font-semibold text-zinc-400">
                            <Archive className="h-3 w-3" />
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Dates Column */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-foreground-muted">
                        <div className="flex flex-col gap-0.5">
                          <span>
                            Pub: {new Date(prompt.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          {prompt.updatedAt && (
                            <span className="text-[10px] text-foreground-muted/70">
                              Upd: {new Date(prompt.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <Link
                            href={`/admin/prompts/${prompt.id}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised p-2 text-foreground-muted hover:text-white hover:border-surface-border/80 transition-colors"
                            title="Edit Prompt"
                            aria-label={`Edit ${prompt.title}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>

                          <Link
                            href={`/admin/prompts/${prompt.id}/preview`}
                            className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised p-2 text-foreground-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-colors"
                            title="Admin Preview"
                            aria-label={`Preview ${prompt.title}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>

                          {status === "published" && (
                            <Link
                              href={`/prompts/${prompt.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised p-2 text-foreground-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                              title="View Live Public Page"
                              aria-label={`View live ${prompt.title}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}

                          {/* Quick Lifecycle Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : prompt.id)}
                              className="inline-flex items-center justify-center rounded-lg border border-surface-border bg-surface-raised p-2 text-foreground-muted hover:text-white transition-colors"
                              title="Status Actions"
                              aria-label="More actions"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-surface-border bg-surface-raised p-1.5 shadow-xl z-30 text-left">
                                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-foreground-muted">
                                  Set Status
                                </div>
                                {status !== "published" && (
                                  <button
                                    onClick={() => handleStatusChange(prompt.id, "published")}
                                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Publish Live
                                  </button>
                                )}
                                {status !== "draft" && (
                                  <button
                                    onClick={() => handleStatusChange(prompt.id, "draft")}
                                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    Move to Draft
                                  </button>
                                )}
                                {status !== "archived" && (
                                  <button
                                    onClick={() => handleStatusChange(prompt.id, "archived")}
                                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-500/10 transition-colors"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                    Archive Prompt
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-border bg-surface-raised/40 px-5 py-3 text-xs text-foreground-muted">
            <div>
              Page <strong className="text-white">{currentPage}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1 || isPending}
                onClick={() => updateParams({ page: String(currentPage - 1) })}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages || isPending}
                onClick={() => updateParams({ page: String(currentPage + 1) })}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised disabled:opacity-40 transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit History Activity Section */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Recent Audit History</h2>
          </div>
          <span className="text-xs text-foreground-muted">
            Tracking immutable security and mutation events
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-foreground-muted py-4">
            No audit events recorded yet. Mutations to prompts will appear here automatically.
          </p>
        ) : (
          <div className="divide-y divide-surface-border">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 font-semibold">{log.action}</span>
                  {log.prompt_id && (
                    <span className="text-foreground-muted font-mono">({log.prompt_id})</span>
                  )}
                  {log.changed_fields?.length > 0 && (
                    <span className="text-foreground-muted/70 text-[11px]">
                      fields: {log.changed_fields.join(", ")}
                    </span>
                  )}
                </div>
                <span className="text-foreground-muted text-[11px]">
                  {new Date(log.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
