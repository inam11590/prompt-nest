"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { SubmissionItem } from "@/lib/data/submissions";
import { withdrawSubmissionAction } from "@/app/actions/submissions";
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface SubmissionsListClientProps {
  submissions: SubmissionItem[];
  total: number;
  initialStatus: string;
  currentPage: number;
  pageSize: number;
  hasActiveProfile: boolean;
}

export function SubmissionsListClient({
  submissions,
  total,
  initialStatus,
  currentPage,
  pageSize,
  hasActiveProfile,
}: SubmissionsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const updateStatus = (status: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/dashboard/submissions?${params.toString()}`);
    });
  };

  const handleWithdraw = async (submissionId: string) => {
    if (!confirm("Are you sure you want to withdraw this submission back to Draft?")) {
      return;
    }
    setFeedbackNotice(null);

    const res = await withdrawSubmissionAction(submissionId);
    if (res.success) {
      setFeedbackNotice({
        type: "success",
        text: "Submission withdrawn back to Draft. You can now edit and resubmit it.",
      });
      router.refresh();
    } else {
      setFeedbackNotice({
        type: "error",
        text: res.error || "Failed to withdraw submission.",
      });
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Your Submissions
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 leading-relaxed">
            Manage your AI prompt drafts and monitor review status from the PromptNest editorial team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/submissions/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Submission
          </Link>
        </div>
      </div>

      {!hasActiveProfile && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-amber-300 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-bold text-amber-200">Public Creator Profile Required</p>
            <p className="text-foreground-muted leading-relaxed">
              To have your prompt submissions reviewed and published under your name, activate your public profile with a unique username.
            </p>
          </div>
          <Link
            href="/settings/profile"
            className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
          >
            Set Up Profile
          </Link>
        </div>
      )}

      {feedbackNotice && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
            feedbackNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedbackNotice.text}</span>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-[11px] underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: "all", label: "All" },
          { key: "DRAFT", label: "Drafts" },
          { key: "PENDING_REVIEW", label: "Pending Review" },
          { key: "CHANGES_REQUESTED", label: "Changes Requested" },
          { key: "APPROVED", label: "Approved" },
          { key: "REJECTED", label: "Rejected" },
        ].map((tab) => {
          const active = initialStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => updateStatus(tab.key)}
              className={`rounded-xl px-3.5 py-2 font-medium transition-colors whitespace-nowrap ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-surface-border bg-surface text-foreground-muted hover:bg-surface-raised hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Submissions List */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm">
        {submissions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised border border-surface-border text-foreground-muted">
              <Layers className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-white">No submissions found</p>
            <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
              {initialStatus === "all"
                ? "You have not created any prompt submissions yet. Create your first draft to get started!"
                : `No submissions with status "${initialStatus}".`}
            </p>
            <Link
              href="/dashboard/submissions/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Draft
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {submissions.map((sub) => {
              const isEditable = sub.status === "DRAFT" || sub.status === "CHANGES_REQUESTED";
              const isPendingReview = sub.status === "PENDING_REVIEW";
              const isApproved = sub.status === "APPROVED";

              return (
                <div
                  key={sub.id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-raised/30 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-surface-border"
                      style={{ backgroundColor: sub.dominantColor || "#18181c" }}
                    >
                      {sub.previewUrl ? (
                        <Image
                          src={sub.previewUrl}
                          alt={sub.imageAlt || sub.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-foreground-muted text-[10px]">
                          Staged
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate max-w-md">
                          {sub.title}
                        </h3>
                        <span className="font-mono text-[10px] text-foreground-muted border border-surface-border px-1.5 py-0.5 rounded">
                          rev {sub.revision}
                        </span>
                      </div>

                      <p className="text-xs text-foreground-muted line-clamp-1">
                        {sub.shortDescription}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-foreground-muted pt-1 flex-wrap">
                        <span className="capitalize">{sub.category.replace("-", " ")}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-medium">{sub.model}</span>
                        <span>•</span>
                        <span>
                          Created:{" "}
                          {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Review Feedback Alert */}
                      {sub.reviewFeedback && (
                        <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-300 flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-200">Editorial Feedback:</p>
                            <p className="mt-0.5 text-foreground-muted">{sub.reviewFeedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div>
                      {sub.status === "DRAFT" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised border border-surface-border px-2.5 py-1 text-xs font-semibold text-foreground-muted">
                          <FileEdit className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                      {sub.status === "PENDING_REVIEW" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </span>
                      )}
                      {sub.status === "CHANGES_REQUESTED" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-400">
                          <AlertCircle className="h-3 w-3" />
                          Changes Requested
                        </span>
                      )}
                      {sub.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved
                        </span>
                      )}
                      {sub.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </span>
                      )}
                    </div>

                    {isEditable && (
                      <Link
                        href={`/dashboard/submissions/${sub.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-border transition-colors"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-indigo-400" />
                        Edit
                      </Link>
                    )}

                    {isPendingReview && (
                      <button
                        onClick={() => handleWithdraw(sub.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                        title="Withdraw back to draft"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Withdraw
                      </button>
                    )}

                    {isApproved && sub.publishedSlug && (
                      <Link
                        href={`/prompts/${sub.publishedSlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Live
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border pt-4 text-xs text-foreground-muted">
          <div>
            Page <strong className="text-white">{currentPage}</strong> of{" "}
            <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams?.toString() || "");
                  p.set("page", String(currentPage - 1));
                  router.push(`/dashboard/submissions?${p.toString()}`);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
            )}
            {currentPage < totalPages && (
              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams?.toString() || "");
                  p.set("page", String(currentPage + 1));
                  router.push(`/dashboard/submissions?${p.toString()}`);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
