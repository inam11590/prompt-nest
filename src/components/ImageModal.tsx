"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ZoomIn, X } from "lucide-react";

interface ImageModalProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatioValue: string;
  dominantColor: string;
}

export function ImageModal({
  src,
  alt,
  width,
  height,
  aspectRatioValue,
  dominantColor,
}: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle opening modal and locking scroll
  const handleOpen = () => {
    setIsOpen(true);
  };

  // Handle closing modal and returning focus
  const handleClose = () => {
    setIsOpen(false);
  };

  // Lock scroll, manage focus trap, and handle Escape key
  useEffect(() => {
    if (!isOpen) {
      triggerRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus inside dialog to the close button
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      // Trap focus inside modal
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Primary Image Trigger */}
      <div className="relative group w-full overflow-hidden rounded-2xl border border-surface-border shadow-2xl bg-surface">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: aspectRatioValue,
            backgroundColor: dominantColor,
          }}
        >
          {!imgError ? (
            <Image
              src={src}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-raised text-foreground-muted p-6 text-center">
              <p className="text-xs font-semibold text-foreground">Asset Pending</p>
              <p className="text-[11px] text-foreground-muted mt-1 max-w-xs">
                Visual image asset is pending upload or generation.
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors pointer-events-none" />

          {/* Enlarge button overlay */}
          <button
            ref={triggerRef}
            type="button"
            onClick={handleOpen}
            aria-label={`Enlarge image: ${alt}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="absolute right-3.5 bottom-3.5 z-10 flex items-center gap-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white px-3 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer shadow-lg"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
            <span>Enlarge</span>
          </button>
        </div>
      </div>

      {/* Accessible Enlargement Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged view of ${alt}`}
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close enlarged image view (Press Escape)"
            className="absolute top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised border border-surface-border text-foreground hover:bg-surface hover:text-white transition-all shadow-xl focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Dialog Container */}
          <div
            className="relative max-h-[90vh] max-w-[92vw] overflow-hidden rounded-2xl border border-surface-border shadow-2xl flex items-center justify-center"
            style={{
              aspectRatio: aspectRatioValue,
              backgroundColor: dominantColor,
            }}
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="object-contain max-h-[85vh] max-w-[90vw] w-auto h-auto rounded-xl"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
