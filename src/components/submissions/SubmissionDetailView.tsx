"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { SubmissionItem } from "@/lib/data/submissions";
import { withdrawSubmissionAction } from "@/app/actions/submissions";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  ExternalLink,
  Undo2,
  RefreshCw,
} from "lucide-react";

interface SubmissionDetailViewProps {
  submission: SubmissionItem;
}

export function SubmissionDetailView({ submission }: SubmissionDetailViewProps) {
  const router = useRouter();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw this submission back to Draft? It will be removed from the review queue.")) {
      return;
    }

    setIsWithdrawing(true);
    setError(null);

    const res = await withdrawSubmissionAction(submission.id);
    setIsWithdrawing(false);

    if (res.success) {
      router.refresh();
    } else {
      setError(res.error || "Failed to withdraw submission.");
    }
  };

  const getStatusBadge = (status: SubmissionItem["status"]) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-500/20">
            <FileEdit className="h-3 w-3" /> Draft
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Under Review
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300 border border-orange-500/20">
            <AlertCircle className="h-3 w-3" /> Changes Requested
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Approved & Published
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Return Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/submissions"
            className="inline-flex items-center justify-center rounded-xl border border-surface-border bg-surface p-2.5 text-foreground-muted hover:text-white hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {submission.title}
              </h1>
              {getStatusBadge(submission.status)}
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              Revision {submission.revision} • Submitted{" "}
              {submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleDateString()
                : new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2.5">
          {submission.status === "PENDING_REVIEW" && (
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-border transition-colors disabled:opacity-50"
            >
              {isWithdrawing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Undo2 className="h-3.5 w-3.5 text-foreground-muted" />
              )}
              Withdraw to Draft
            </button>
          )}

          {submission.status === "APPROVED" && submission.publishedSlug && (
            <Link
              href={`/prompts/${submission.publishedSlug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Published Prompt
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Editorial Feedback if Changes Requested or Rejected */}
      {submission.reviewFeedback && (
        <div
          className={`rounded-2xl border p-5 space-y-2 ${
            submission.status === "CHANGES_REQUESTED"
              ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
              : submission.status === "REJECTED"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
              : "border-surface-border bg-surface text-foreground"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="h-4 w-4" />
            <span>Editorial Feedback from Moderator</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {submission.reviewFeedback}
          </p>
        </div>
      )}

      {/* Submission Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Prompt Instructions
            </h2>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground-muted uppercase">Short Description</label>
              <p className="text-sm text-foreground">{submission.shortDescription}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground-muted uppercase">Full Prompt</label>
              <pre className="rounded-xl border border-surface-border bg-surface-raised p-4 font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {submission.prompt}
              </pre>
            </div>

            {submission.negativePrompt && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground-muted uppercase">Negative Prompt</label>
                <pre className="rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground-muted whitespace-pre-wrap leading-relaxed">
                  {submission.negativePrompt}
                </pre>
              </div>
            )}

            {submission.generationParameters && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground-muted uppercase">Generation Parameters</label>
                <pre className="rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground-muted whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(submission.generationParameters, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Metadata & Compatibility
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-foreground-muted">Category:</span>
                <p className="font-medium text-foreground capitalize mt-0.5">{submission.category}</p>
              </div>
              <div>
                <span className="text-foreground-muted">Primary Model:</span>
                <p className="font-medium text-foreground mt-0.5">{submission.model}</p>
              </div>
            </div>

            {submission.compatibleModels.length > 0 && (
              <div>
                <span className="text-[11px] text-foreground-muted">Compatible Models:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {submission.compatibleModels.map((m) => (
                    <span
                      key={m}
                      className="rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-foreground-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {submission.tags.length > 0 && (
              <div>
                <span className="text-[11px] text-foreground-muted">Tags:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {submission.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-foreground-muted"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right col: Staged media */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Staged Output Image
            </h2>

            <div
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-surface-border"
              style={{ backgroundColor: submission.dominantColor || "#18181c" }}
            >
              {submission.previewUrl ? (
                <Image
                  src={submission.previewUrl}
                  alt={submission.imageAlt || submission.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-foreground-muted">
                  No preview available
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs border-t border-surface-border pt-3">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Dimensions:</span>
                <span className="font-medium text-foreground">{submission.width} × {submission.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Aspect Ratio:</span>
                <span className="font-medium text-foreground">{submission.aspectRatioValue} ({submission.aspectRatio})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Dominant Color:</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-white/20"
                    style={{ backgroundColor: submission.dominantColor }}
                  />
                  {submission.dominantColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
