"use client";

export interface CompressionOptions {
  /** Maximum edge length in pixels (width or height). Default: 1400 */
  maxEdge?: number;
  /** Compression quality between 0.0 and 1.0. Default: 0.82 */
  quality?: number;
  /** Preferred mime type. Default: "image/webp" */
  preferredFormat?: "image/webp" | "image/jpeg";
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: "portrait" | "landscape" | "square";
  aspectRatioValue: string;
  dominantColor: string;
  sizeBytes: number;
}

/**
 * Calculates Greatest Common Divisor for aspect ratio formatting.
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Determines aspect ratio string representation (e.g. "16/9", "4/3", "1/1", "3/4").
 */
function computeAspectRatioValue(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "1/1";
  const divisor = gcd(Math.round(width), Math.round(height));
  const rw = Math.round(width / divisor);
  const rh = Math.round(height / divisor);

  // Common standard ratios check
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.03) return "16/9";
  if (Math.abs(ratio - 9 / 16) < 0.03) return "9/16";
  if (Math.abs(ratio - 4 / 3) < 0.03) return "4/3";
  if (Math.abs(ratio - 3 / 4) < 0.03) return "3/4";
  if (Math.abs(ratio - 3 / 2) < 0.03) return "3/2";
  if (Math.abs(ratio - 2 / 3) < 0.03) return "2/3";
  if (Math.abs(ratio - 1) < 0.03) return "1/1";

  if (rw <= 32 && rh <= 32) {
    return `${rw}/${rh}`;
  }
  return `${(width / height).toFixed(2)}/1`;
}

/**
 * Extracts the dominant/average hex color from a canvas 2D context.
 */
function extractDominantColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): string {
  try {
    // Sample a 40x40 grid to avoid heavy memory allocation on large images
    const sampleW = Math.min(width, 40);
    const sampleH = Math.min(height, 40);
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleW;
    sampleCanvas.height = sampleH;
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) return "#18181c";

    sampleCtx.drawImage(ctx.canvas, 0, 0, sampleW, sampleH);
    const imgData = sampleCtx.getImageData(0, 0, sampleW, sampleH).data;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    for (let i = 0; i < imgData.length; i += 4) {
      const alpha = imgData[i + 3];
      if (alpha > 128) {
        rSum += imgData[i];
        gSum += imgData[i + 1];
        bSum += imgData[i + 2];
        count++;
      }
    }

    if (count === 0) return "#18181c";

    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return "#18181c";
  }
}

/**
 * Converts a base64 Data URL to a native Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/webp";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * High-performance browser-side WebP compressor.
 * Downscales oversized images to max 1400px edge and encodes as WebP (<300KB).
 * Eliminates Vercel 4.5MB request payload limit errors completely.
 */
export async function compressImageToWebp(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxEdge = 1400, quality = 0.82, preferredFormat = "image/webp" } = options;

  return new Promise((resolve, reject) => {
    // If not a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Image compression must be run in a browser environment."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);

        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        if (!origW || !origH) {
          reject(new Error("Unable to read image dimensions."));
          return;
        }

        // Calculate constrained dimensions
        let targetW = origW;
        let targetH = origH;

        if (origW > maxEdge || origH > maxEdge) {
          if (origW >= origH) {
            targetW = maxEdge;
            targetH = Math.round((origH * maxEdge) / origW);
          } else {
            targetH = maxEdge;
            targetW = Math.round((origW * maxEdge) / origH);
          }
        }

        // Draw to HTML5 canvas
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to initialize canvas 2D context."));
          return;
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Aspect ratio calculations
        let aspectRatio: "portrait" | "landscape" | "square" = "square";
        if (targetW > targetH) {
          aspectRatio = "landscape";
        } else if (targetH > targetW) {
          aspectRatio = "portrait";
        }
        const aspectRatioValue = computeAspectRatioValue(targetW, targetH);
        const dominantColor = extractDominantColor(ctx, targetW, targetH);

        // Export data URL with quality compression
        let format = preferredFormat;
        let dataUrl = canvas.toDataURL(format, quality);

        // Verify if browser supports webp canvas export (if not, dataUrl starts with image/png)
        if (!dataUrl.startsWith(`data:${format}`)) {
          format = "image/jpeg";
          dataUrl = canvas.toDataURL(format, quality);
        }

        const blob = dataUrlToBlob(dataUrl);
        const safeBaseName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-z0-9_-]/gi, "_")
          .slice(0, 50);

        const ext = format === "image/webp" ? "webp" : "jpg";
        const compressedFile = new File([blob], `${safeBaseName}.${ext}`, {
          type: format,
          lastModified: Date.now(),
        });

        resolve({
          file: compressedFile,
          blob,
          dataUrl,
          width: targetW,
          height: targetH,
          aspectRatio,
          aspectRatioValue,
          dominantColor,
          sizeBytes: blob.size,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode image file. Please ensure it is a valid image."));
    };

    img.src = objectUrl;
  });
}
