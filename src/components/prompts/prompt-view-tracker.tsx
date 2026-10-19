"use client";

import { useEffect, useRef } from "react";
import { incrementPromptViewAction } from "@/app/actions/engagement";

interface PromptViewTrackerProps {
  promptId: string;
}

export function PromptViewTracker({ promptId }: PromptViewTrackerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    if (typeof window === "undefined") return;

    const storageKey = `viewed_prompt_${promptId}`;
    try {
      const alreadyViewed = sessionStorage.getItem(storageKey);
      if (!alreadyViewed) {
        hasFired.current = true;
        sessionStorage.setItem(storageKey, "1");
        incrementPromptViewAction(promptId).catch((err) => {
          console.warn("View tracking failed silently:", err);
        });
      }
    } catch {
      // In private browsing mode where sessionStorage may fail
      if (!hasFired.current) {
        hasFired.current = true;
        incrementPromptViewAction(promptId).catch(() => {});
      }
    }
  }, [promptId]);

  return null;
}
