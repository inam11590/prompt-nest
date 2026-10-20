"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) {
    return (
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface text-text-muted ${className}`}
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-2 rounded-full border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted transition-all hover:border-surface-border-subtle hover:bg-surface-raised hover:text-foreground focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${className}`}
      aria-label={isDark ? "Switch to Pure White Light Mode" : "Switch to Burgundy Dark Mode"}
      title={isDark ? "Switch to Pure White Light Mode" : "Switch to Burgundy Dark Mode"}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-rose-600 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="capitalize">{isDark ? "Pure White Light" : "Burgundy Dark"}</span>
      )}
    </button>
  );
}
