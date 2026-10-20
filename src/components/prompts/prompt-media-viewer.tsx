"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Split,
  Image as ImageIcon,
  Layers,
  MoveHorizontal,
} from "lucide-react";

interface PromptMediaViewerProps {
  imageUrl: string;
  imageAlt: string;
  referenceImageUrl?: string | null;
  referenceImageAlt?: string;
  width: number;
  height: number;
  aspectRatioValue: string;
  dominantColor: string;
  model: string;
}

export function PromptMediaViewer({
  imageUrl,
  imageAlt,
  referenceImageUrl,
  referenceImageAlt = "Reference input image",
  width,
  height,
  aspectRatioValue,
  dominantColor,
  model,
}: PromptMediaViewerProps) {
  // Before/After comparison slider state (0% to 100%)
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"slider" | "output">("slider");

  // Lightbox fullscreen inspection modal state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 2>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const hasReference = Boolean(referenceImageUrl && referenceImageUrl.trim().length > 0);

  const handleOpenFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setZoomLevel(1);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setZoomLevel(1);
    triggerButtonRef.current?.focus();
  }, []);

  // Keyboard shortcut: Press "Z" to toggle fullscreen inspection
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.key === "z" || e.key === "Z") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (isFullscreen) {
          handleCloseFullscreen();
        } else {
          handleOpenFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isFullscreen, handleCloseFullscreen, handleOpenFullscreen]);

  // Lightbox focus trap, scroll lock, and Escape key dismissal
  useEffect(() => {
    if (!isFullscreen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseFullscreen();
        return;
      }

      // Focus trap inside modal
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, handleCloseFullscreen]);

  // Handle pointer/touch drag calculation
  const updateSliderFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already lost
    }
  };

  // Keyboard navigation for slider handle
  const handleSliderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 5));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setSliderPosition(100);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* If reference image exists, render Mode Toggle Bar */}
      {hasReference && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Image Display Mode:</span>
          </div>

          <div
            role="tablist"
            aria-label="Image display options"
            className="flex rounded-xl bg-surface-raised p-1 border border-surface-border text-xs"
          >
            <button
              role="tab"
              aria-selected={viewMode === "slider"}
              onClick={() => setViewMode("slider")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewMode === "slider"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              <span>Before / After Slider</span>
            </button>
            <button
              role="tab"
              aria-selected={viewMode === "output"}
              onClick={() => setViewMode("output")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewMode === "output"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Output Only</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Image Container (aspect-ratio locked for CLS = 0) */}
      <div
        ref={containerRef}
        onPointerDown={hasReference && viewMode === "slider" ? handlePointerDown : undefined}
        onPointerMove={hasReference && viewMode === "slider" ? handlePointerMove : undefined}
        onPointerUp={hasReference && viewMode === "slider" ? handlePointerUp : undefined}
        className="relative group w-full overflow-hidden rounded-2xl border border-surface-border shadow-2xl bg-surface select-none touch-none"
        style={{
          aspectRatio: aspectRatioValue,
          backgroundColor: dominantColor,
        }}
      >
        {/* Layer 1: AI Generated Output (Full Image) */}
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />

        {/* Layer 2: Reference Image Overlay (Clipped to sliderPosition when in Slider Mode) */}
        {hasReference && viewMode === "slider" && referenceImageUrl && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <Image
              src={referenceImageUrl}
              alt={referenceImageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Draggable Divider Handle Line (only in Comparison Slider Mode) */}
        {hasReference && viewMode === "slider" && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          >
            {/* Vertical Line */}
            <div className="h-full w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)]" />

            {/* Central Slider Handle Button */}
            <button
              type="button"
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sliderPosition)}
              aria-label="Comparison slider position (ArrowLeft / ArrowRight to adjust)"
              onKeyDown={handleSliderKeyDown}
              className="pointer-events-auto absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-900 shadow-xl border border-zinc-200 cursor-ew-resize hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform"
            >
              <MoveHorizontal className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Comparison Labels Overlay */}
        {hasReference && viewMode === "slider" && (
          <>
            {sliderPosition > 12 && (
              <div className="absolute top-3 left-3 pointer-events-none rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20 shadow-md">
                Before (Reference)
              </div>
            )}
            {sliderPosition < 88 && (
              <div className="absolute top-3 right-3 pointer-events-none rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20 shadow-md">
                After (AI Output)
              </div>
            )}
          </>
        )}

        {/* Top-Left Floating Metadata Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-10">
          <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-white/90 border border-white/10 shadow-sm">
            {width} × {height}
          </span>
          <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-white/90 border border-white/10 shadow-sm">
            {aspectRatioValue}
          </span>
          <span className="rounded-md bg-indigo-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 shadow-sm">
            {model}
          </span>
        </div>

        {/* Floating "Inspect Fullscreen (Z)" Button */}
        <button
          ref={triggerButtonRef}
          onClick={handleOpenFullscreen}
          aria-label="Inspect Fullscreen (Press Z)"
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-black/75 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/20 shadow-lg hover:bg-black/90 hover:scale-105 active:scale-95 transition-all"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Inspect Fullscreen (Z)</span>
        </button>
      </div>

      {/* Accessible Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="High-Resolution Artwork Inspection"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Top Bar Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/80 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
                {model} • {width} × {height}
              </span>
              <button
                onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-semibold text-white border border-white/10 transition-colors"
                aria-label={`Toggle zoom magnification (Current: ${zoomLevel}x)`}
              >
                {zoomLevel === 1 ? (
                  <>
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span>2x Zoom</span>
                  </>
                ) : (
                  <>
                    <ZoomOut className="h-3.5 w-3.5" />
                    <span>1x Fit</span>
                  </>
                )}
              </button>
            </div>

            <button
              ref={closeButtonRef}
              onClick={handleCloseFullscreen}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors border border-white/10"
              aria-label="Close fullscreen inspection"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Image Area */}
          <div
            onClick={() => setZoomLevel((z) => (z === 1 ? 2 : 1))}
            className={`relative max-h-[85vh] max-w-[90vw] overflow-auto cursor-zoom-in rounded-xl transition-transform duration-200 ${
              zoomLevel === 2 ? "scale-125 cursor-zoom-out" : "scale-100"
            }`}
            style={{
              aspectRatio: aspectRatioValue,
              width: "auto",
              height: "auto",
            }}
          >
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={width || 1200}
              height={height || 800}
              sizes="(max-width: 1200px) 90vw, 1200px"
              quality={90}
              className="h-full w-full object-contain max-h-[85vh]"
            />
          </div>

          {/* Bottom Hint */}
          <div className="absolute bottom-4 text-center text-xs text-white/60 pointer-events-none">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/90">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/90">Z</kbd> to exit • Click image to toggle 2x zoom
          </div>
        </div>
      )}
    </div>
  );
}
