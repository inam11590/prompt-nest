"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ArticleItem } from "@/lib/data/articles";
import { setArticleStatusAction } from "@/app/actions/articles";
import {
  BookOpen,
  PlusCircle,
  Search,
  ExternalLink,
  Edit3,
  Eye,
  Archive,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";

interface AdminArticlesListClientProps {
  initialArticles: ArticleItem[];
  total: number;
  currentStatus: string;
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
}

export function AdminArticlesListClient({
  initialArticles,
  total,
  currentStatus,
  stats,
}: AdminArticlesListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const statusTabs = [
    { label: "All Articles", value: "all", count: stats.total },
    { label: "Published", value: "PUBLISHED", count: stats.published },
    { label: "Drafts", value: "DRAFT", count: stats.draft },
    { label: "Archived", value: "ARCHIVED", count: stats.archived },
  ];

  const handleTabChange = (val: string) => {
    router.push(`/admin/articles?status=${val}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (currentStatus !== "all") params.set("status", currentStatus);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    router.push(`/admin/articles?${params.toString()}`);
  };

  const handleStatusChange = async (
    article: ArticleItem,
    targetStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ) => {
    setProcessingId(article.id);
    setStatusMessage(null);

    const res = await setArticleStatusAction(article.id, article.concurrencyVersion, targetStatus);
    setProcessingId(null);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: `Article "${article.title}" marked as ${targetStatus}.`,
      });
      router.refresh();
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to update status.",
      });
    }
  };

  const getStatusBadge = (status: ArticleItem["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Published
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Draft
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-500/20">
            <Archive className="h-3 w-3" /> Archived
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-purple-400" />
            Articles & Editorial Guides
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Write, manage, and publish guides, prompt engineering tutorials, and technical articles.
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-surface-border bg-surface p-4">
          <p className="text-xs text-foreground-muted uppercase font-medium tracking-wider">Total Articles</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-surface p-4">
          <p className="text-xs text-emerald-400 uppercase font-medium tracking-wider">Published</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-surface p-4">
          <p className="text-xs text-amber-400 uppercase font-medium tracking-wider">Drafts</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{stats.draft}</p>
        </div>
        <div className="rounded-2xl border border-slate-500/20 bg-surface p-4">
          <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Archived</p>
          <p className="text-2xl font-bold text-slate-300 mt-1">{stats.archived}</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {statusTabs.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-surface text-foreground-muted hover:text-white hover:bg-surface-raised border border-surface-border"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-raised text-foreground-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, slug..."
            className="w-full rounded-xl border border-surface-border bg-surface pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </form>
      </div>

      {/* Articles Table */}
      {initialArticles.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center">
          <FileText className="h-10 w-10 text-foreground-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No articles found</h3>
          <p className="text-xs text-foreground-muted mt-1">
            There are no articles matching the selected filter. Create a new guide to get started.
          </p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Write First Article
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised/50 border-b border-surface-border text-foreground-muted font-medium uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Article</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Published / Modified</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {initialArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-surface-raised/30 transition-colors">
                      {/* Title & Cover */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-surface-border"
                            style={{ backgroundColor: art.coverImageDominantColor || "#18181c" }}
                          >
                            {art.coverImageUrl ? (
                              <Image
                                src={art.coverImageUrl}
                                alt={art.coverImageAlt || art.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-foreground-muted/40">
                                <BookOpen className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white line-clamp-1 max-w-[280px]">
                              {art.title}
                            </p>
                            <p className="text-[11px] font-mono text-foreground-muted line-clamp-1 max-w-[280px]">
                              /blog/{art.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="capitalize text-foreground font-medium">{art.category}</span>
                        <p className="text-[10px] text-foreground-muted">Rev v{art.concurrencyVersion}</p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">{getStatusBadge(art.status)}</td>

                      {/* Dates */}
                      <td className="py-4 px-4 text-foreground-muted whitespace-nowrap text-[11px]">
                        <div>
                          {art.publishedAt ? (
                            <span className="text-white">Pub: {new Date(art.publishedAt).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-amber-400">Unpublished</span>
                          )}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          Edit: {new Date(art.lastEditedAt || art.updatedAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            href={`/admin/articles/${art.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-border transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </Link>

                          <Link
                            href={`/admin/articles/${art.id}/preview`}
                            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-border transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Link>

                          {art.status === "PUBLISHED" ? (
                            <>
                              <button
                                disabled={processingId === art.id}
                                onClick={() => handleStatusChange(art, "DRAFT")}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                title="Unpublish back to draft"
                              >
                                {processingId === art.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Unpublish"
                                )}
                              </button>
                              <Link
                                href={`/blog/${art.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg border border-surface-border bg-surface-raised text-foreground-muted hover:text-white hover:bg-surface-border transition-colors"
                                title="View public article"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </>
                          ) : art.status === "DRAFT" ? (
                            <>
                              <button
                                disabled={processingId === art.id}
                                onClick={() => handleStatusChange(art, "PUBLISHED")}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                              >
                                {processingId === art.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Publish
                              </button>
                              <button
                                disabled={processingId === art.id}
                                onClick={() => handleStatusChange(art, "ARCHIVED")}
                                className="p-1.5 rounded-lg border border-surface-border bg-surface-raised text-foreground-muted hover:text-slate-300 hover:bg-surface-border transition-colors disabled:opacity-50"
                                title="Archive article"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={processingId === art.id}
                              onClick={() => handleStatusChange(art, "DRAFT")}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-500/30 bg-slate-500/10 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-500/20 transition-colors disabled:opacity-50"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-foreground-muted text-right">
            Showing {initialArticles.length} of {total} articles
          </p>
        </div>
      )}
    </div>
  );
}
