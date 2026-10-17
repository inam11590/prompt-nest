"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SubmissionItem } from "@/lib/data/submissions";
import {
  approveSubmissionAction,
  requestChangesSubmissionAction,
  rejectSubmissionAction,
} from "@/app/actions/moderation";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  ExternalLink,
  User,
  X,
} from "lucide-react";

interface AdminModerationClientProps {
  initialSubmissions: SubmissionItem[];
  currentStatus: string;
  total: number;
}

export function AdminModerationClient({
  initialSubmissions,
  currentStatus,
  total,
}: AdminModerationClientProps) {
  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  // Action states
  const [actionType, setActionType] = useState<"approve" | "changes" | "reject" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filterTabs = [
    { label: "Pending Review", value: "PENDING_REVIEW" },
    { label: "Changes Requested", value: "CHANGES_REQUESTED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Approved", value: "APPROVED" },
    { label: "All Submissions", value: "all" },
  ];

  const handleTabChange = (status: string) => {
    router.push(`/admin/submissions?status=${status}`);
  };

  const openActionDialog = (sub: SubmissionItem, type: "approve" | "changes" | "reject") => {
    setSelectedSubmission(sub);
    setActionType(type);
    setFeedbackText("");
    setInternalNotes("");
    setStatusMessage(null);
  };

  const closeDialog = () => {
    if (isProcessing) return;
    setActionType(null);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);
    setStatusMessage(null);

    const res = await approveSubmissionAction(
      selectedSubmission.id,
      selectedSubmission.revision,
      internalNotes
    );

    setIsProcessing(false);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: `Prompt published successfully as "${res.data?.slug}".`,
      });
      setTimeout(() => {
        closeDialog();
        setSelectedSubmission(null);
        router.refresh();
      }, 1500);
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to approve and publish submission.",
      });
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedSubmission) return;
    if (!feedbackText.trim() || feedbackText.trim().length < 10) {
      setStatusMessage({
        type: "error",
        text: "Please provide constructive editorial feedback (at least 10 characters).",
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    const res = await requestChangesSubmissionAction(
      selectedSubmission.id,
      selectedSubmission.revision,
      feedbackText.trim(),
      internalNotes
    );

    setIsProcessing(false);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: "Changes requested. The creator has been notified to revise their draft.",
      });
      setTimeout(() => {
        closeDialog();
        setSelectedSubmission(null);
        router.refresh();
      }, 1500);
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to request changes.",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    if (!feedbackText.trim() || feedbackText.trim().length < 10) {
      setStatusMessage({
        type: "error",
        text: "Please provide a rejection rationale for the creator (at least 10 characters).",
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    const res = await rejectSubmissionAction(
      selectedSubmission.id,
      selectedSubmission.revision,
      feedbackText.trim(),
      internalNotes
    );

    setIsProcessing(false);

    if (res.success) {
      setStatusMessage({
        type: "success",
        text: "Submission marked as rejected.",
      });
      setTimeout(() => {
        closeDialog();
        setSelectedSubmission(null);
        router.refresh();
      }, 1500);
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to reject submission.",
      });
    }
  };

  const getStatusBadge = (status: SubmissionItem["status"]) => {
    switch (status) {
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Under Review
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-300 border border-orange-500/20">
            <AlertCircle className="h-3 w-3" /> Changes Requested
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-border pb-4">
        {filterTabs.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-surface text-foreground-muted hover:text-white hover:bg-surface-raised border border-surface-border"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Submissions Table / Cards */}
      {initialSubmissions.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center">
          <Clock className="h-10 w-10 text-foreground-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No submissions found</h3>
          <p className="text-xs text-foreground-muted mt-1">
            There are currently no prompt submissions matching the status &ldquo;{currentStatus}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised/50 border-b border-surface-border text-foreground-muted font-medium uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Prompt</th>
                    <th className="py-3.5 px-4">Creator</th>
                    <th className="py-3.5 px-4">Category & Model</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {initialSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-surface-raised/30 transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-surface-border"
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
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold text-white line-clamp-1 max-w-[240px]">
                              {sub.title}
                            </p>
                            <p className="text-[11px] text-foreground-muted line-clamp-1 max-w-[240px]">
                              {sub.shortDescription}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="py-4 px-4">
                        {sub.creator?.username ? (
                          <Link
                            href={`/creators/${sub.creator.username}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            <User className="h-3 w-3" />
                            <span>@{sub.creator.username}</span>
                          </Link>
                        ) : (
                          <span className="text-foreground-muted">Unknown Creator</span>
                        )}
                        <p className="text-[10px] text-foreground-muted">Rev {sub.revision}</p>
                      </td>

                      {/* Category & Model */}
                      <td className="py-4 px-4">
                        <p className="text-foreground capitalize">{sub.category}</p>
                        <p className="text-[11px] text-foreground-muted">{sub.model}</p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">{getStatusBadge(sub.status)}</td>

                      {/* Date */}
                      <td className="py-4 px-4 text-foreground-muted whitespace-nowrap">
                        {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleDateString()
                          : new Date(sub.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-border transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </button>

                          {sub.status === "PENDING_REVIEW" && (
                            <>
                              <button
                                onClick={() => openActionDialog(sub, "approve")}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => openActionDialog(sub, "changes")}
                                className="inline-flex items-center gap-1 rounded-lg bg-orange-600/90 hover:bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                Changes
                              </button>
                            </>
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
            Showing {initialSubmissions.length} of {total} submissions
          </p>
        </div>
      )}

      {/* Inspect Modal / Full Submission Drawer */}
      {selectedSubmission && !actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4 bg-surface-raised/40">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white line-clamp-1">
                  {selectedSubmission.title}
                </h3>
                {getStatusBadge(selectedSubmission.status)}
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg p-1.5 text-foreground-muted hover:text-white hover:bg-surface-raised transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image side */}
                <div className="space-y-4">
                  <div
                    className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-surface-border"
                    style={{ backgroundColor: selectedSubmission.dominantColor || "#18181c" }}
                  >
                    {selectedSubmission.previewUrl ? (
                      <Image
                        src={selectedSubmission.previewUrl}
                        alt={selectedSubmission.imageAlt || selectedSubmission.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 500px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Creator:</span>
                      <span className="font-semibold text-indigo-400">
                        {selectedSubmission.creator?.username ? `@${selectedSubmission.creator.username}` : "Anonymous"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Dimensions:</span>
                      <span className="text-foreground">{selectedSubmission.width} × {selectedSubmission.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Aspect Ratio:</span>
                      <span className="text-foreground">{selectedSubmission.aspectRatioValue} ({selectedSubmission.aspectRatio})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Alt Text:</span>
                      <span className="text-foreground">{selectedSubmission.imageAlt || "None"}</span>
                    </div>
                  </div>
                </div>

                {/* Details side */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-foreground-muted text-[10px]">
                      Short Description
                    </label>
                    <p className="text-sm text-foreground mt-1">{selectedSubmission.shortDescription}</p>
                  </div>

                  <div>
                    <label className="font-semibold uppercase tracking-wider text-foreground-muted text-[10px]">
                      Prompt Instructions
                    </label>
                    <pre className="mt-1 rounded-xl border border-surface-border bg-surface-raised p-3 font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {selectedSubmission.prompt}
                    </pre>
                  </div>

                  {selectedSubmission.negativePrompt && (
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-foreground-muted text-[10px]">
                        Negative Prompt
                      </label>
                      <pre className="mt-1 rounded-xl border border-surface-border bg-surface-raised p-2.5 font-mono text-xs text-foreground-muted whitespace-pre-wrap">
                        {selectedSubmission.negativePrompt}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-border">
                    <div>
                      <label className="text-foreground-muted text-[10px] uppercase">Category</label>
                      <p className="font-medium text-foreground capitalize mt-0.5">{selectedSubmission.category}</p>
                    </div>
                    <div>
                      <label className="text-foreground-muted text-[10px] uppercase">Primary Model</label>
                      <p className="font-medium text-foreground mt-0.5">{selectedSubmission.model}</p>
                    </div>
                  </div>

                  {selectedSubmission.tags.length > 0 && (
                    <div>
                      <label className="text-foreground-muted text-[10px] uppercase">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-surface-border bg-surface-raised px-2 py-0.5 text-[10px] text-foreground-muted"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.reviewFeedback && (
                    <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
                      <p className="font-semibold text-amber-300 text-[11px] mb-1">Previous Review Feedback:</p>
                      <p className="text-foreground-muted leading-relaxed">{selectedSubmission.reviewFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-surface-border px-6 py-4 bg-surface-raised/40 flex items-center justify-between">
              <span className="text-xs text-foreground-muted">
                Revision {selectedSubmission.revision}
              </span>

              <div className="flex items-center gap-2">
                {selectedSubmission.status === "PENDING_REVIEW" && (
                  <>
                    <button
                      onClick={() => setActionType("reject")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => setActionType("changes")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition-colors"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      Request Changes
                    </button>
                    <button
                      onClick={() => setActionType("approve")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Publish
                    </button>
                  </>
                )}
                {selectedSubmission.status === "APPROVED" && selectedSubmission.publishedSlug && (
                  <Link
                    href={`/prompts/${selectedSubmission.publishedSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Live Prompt
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog (Approve, Request Changes, Reject) */}
      {selectedSubmission && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {actionType === "approve"
                    ? "Approve & Publish Prompt"
                    : actionType === "changes"
                    ? "Request Editorial Changes"
                    : "Reject Prompt Submission"}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Submission: &ldquo;{selectedSubmission.title}&rdquo; (Rev {selectedSubmission.revision})
                </p>
              </div>
              <button
                disabled={isProcessing}
                onClick={closeDialog}
                className="text-foreground-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {statusMessage && (
              <div
                className={`rounded-xl p-3 text-xs flex items-start gap-2 ${
                  statusMessage.type === "success"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {actionType === "approve" ? (
              <div className="space-y-4 text-xs text-foreground-muted">
                <p>
                  Approving this submission will atomically copy the staged image into the public image bucket, generate a unique SEO-friendly slug, and publish the prompt in the gallery with attribution to{" "}
                  <span className="text-white font-medium">@{selectedSubmission.creator?.username || "creator"}</span>.
                </p>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Internal Moderator Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g. Excellent lighting composition; verified on Midjourney v6.1"
                    className="w-full rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1.5">
                    Creator Feedback <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-[11px] text-foreground-muted mb-2">
                    {actionType === "changes"
                      ? "Explain clearly what modifications are required for this prompt to meet publication standards."
                      : "Provide a specific rationale explaining why this submission does not meet publication standards."}
                  </p>
                  <textarea
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      actionType === "changes"
                        ? "Please provide higher-resolution output imagery and specify the generation parameters used..."
                        : "Submission does not contain actionable prompt keywords or duplicates existing library entries..."
                    }
                    className="w-full rounded-xl border border-surface-border bg-surface-raised p-3 text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Internal Moderator Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Private notes for administrator audit log"
                    className="w-full rounded-xl border border-surface-border bg-surface-raised px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
              <button
                type="button"
                disabled={isProcessing}
                onClick={closeDialog}
                className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-border transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              {actionType === "approve" ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Confirm & Publish Prompt
                </button>
              ) : actionType === "changes" ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRequestChanges}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  Send Feedback
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReject}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  Reject Submission
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
