"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { sanitizeReturnUrl } from "@/lib/navigation";

export function ReturnButton() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const safeReturnUrl = sanitizeReturnUrl(from);

  return (
    <Link
      href={safeReturnUrl}
      className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-muted transition-all hover:bg-surface-raised hover:text-foreground focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
      aria-label="Return to gallery with preserved search and filters"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>Back to Gallery</span>
    </Link>
  );
}
