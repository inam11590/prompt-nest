"use client";

import React, { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";

interface CopyPromptButtonProps {
  promptText: string;
  className?: string;
}

export function CopyPromptButton({ promptText, className = "" }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={
        copied
          ? "Prompt copied to clipboard successfully"
          : error
          ? "Failed to copy prompt, click to retry"
          : "Copy full prompt to clipboard"
      }
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 ${
        copied
          ? "bg-emerald-600 text-white"
          : error
          ? "bg-red-600/90 text-white"
          : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 active:scale-95"
      } px-4 py-2.5 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied to Clipboard!</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Copy Failed (Click to Retry)</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy Full Prompt</span>
        </>
      )}
    </button>
  );
}
