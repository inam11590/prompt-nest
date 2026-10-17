import sharp, { type Metadata } from "sharp";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: "jpeg" | "png" | "webp";
  contentType: string;
  aspectRatio: "portrait" | "landscape" | "square";
  aspectRatioValue: string;
  dominantColor: string;
}

export interface ImageValidationOptions {
  maxSizeBytes?: number; // default: 10 MiB
  minDimension?: number; // default: 512 px
  maxMegapixels?: number; // default: 40 MP
  maxEdge?: number; // default: 2560 px
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MiB
  minDimension: 512,
  maxMegapixels: 40_000_000,
  maxEdge: 2560,
};

/**
 * Validates, strips metadata, auto-orients, and resizes an uploaded image buffer.
 */
export async function validateAndProcessImage(
  inputBuffer: Buffer,
  options: ImageValidationOptions = {}
): Promise<ProcessedImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. File size check
  if (inputBuffer.length > opts.maxSizeBytes) {
    throw new Error(
      `File size exceeds maximum allowed limit of ${(opts.maxSizeBytes / (1024 * 1024)).toFixed(1)} MiB.`
    );
  }

  // 2. Inspect with sharp (verifies magic bytes & decode capability)
  let metadata: Metadata;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch (err) {
    throw new Error(
      `Invalid or corrupted image file: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const { width: rawWidth, height: rawHeight, format } = metadata;

  if (!rawWidth || !rawHeight) {
    throw new Error("Unable to read image dimensions.");
  }

  // 3. Format check
  if (!format || !["jpeg", "png", "webp"].includes(format)) {
    throw new Error(
      `Unsupported image format (${format || "unknown"}). Allowed formats: JPEG, PNG, WebP.`
    );
  }

  // 4. Dimension & Megapixel checks
  if (rawWidth < opts.minDimension || rawHeight < opts.minDimension) {
    throw new Error(
      `Image dimensions (${rawWidth}x${rawHeight}) are below minimum required size of ${opts.minDimension}x${opts.minDimension} pixels.`
    );
  }

  const totalPixels = rawWidth * rawHeight;
  if (totalPixels > opts.maxMegapixels) {
    throw new Error(
      `Image resolution (${(totalPixels / 1_000_000).toFixed(1)} MP) exceeds maximum allowed limit of ${(opts.maxMegapixels / 1_000_000).toFixed(0)} MP.`
    );
  }

  // 5. Process image with sharp:
  // - auto-orient EXIF
  // - resize if max edge exceeds maxEdge
  // - strip EXIF/metadata
  let pipeline = sharp(inputBuffer).rotate();

  if (rawWidth > opts.maxEdge || rawHeight > opts.maxEdge) {
    pipeline = pipeline.resize({
      width: opts.maxEdge,
      height: opts.maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to WebP for optimal compression and consistency while stripping metadata
  const processedBuffer = await pipeline
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  const processedMeta = await sharp(processedBuffer).metadata();
  const width = processedMeta.width || rawWidth;
  const height = processedMeta.height || rawHeight;

  // 6. Calculate aspect ratio
  let aspectRatio: "portrait" | "landscape" | "square" = "square";
  if (width > height) {
    aspectRatio = "landscape";
  } else if (height > width) {
    aspectRatio = "portrait";
  }

  // Aspect ratio value string (e.g. "16/9", "4/3", "4/5", or calculated ratio)
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;
  const aspectRatioValue =
    ratioW <= 32 && ratioH <= 32 ? `${ratioW}/${ratioH}` : `${(width / height).toFixed(3)}`;

  // 7. Calculate dominant color
  const stats = await sharp(processedBuffer).stats();
  let dominantHex = "#18181c";
  if (stats.dominant) {
    const { r, g, b } = stats.dominant;
    dominantHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } else if (stats.channels && stats.channels.length >= 3) {
    const r = Math.round(stats.channels[0].mean);
    const g = Math.round(stats.channels[1].mean);
    const b = Math.round(stats.channels[2].mean);
    dominantHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  return {
    buffer: processedBuffer,
    width,
    height,
    format: "webp",
    contentType: "image/webp",
    aspectRatio,
    aspectRatioValue,
    dominantColor: dominantHex,
  };
}

/**
 * Generates a collision-resistant storage path for prompt images.
 */
export function generateStorageKey(slug: string, ext = "webp"): string {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  return `${safeSlug}-${timestamp}-${randomSuffix}.${ext}`;
}

/**
 * Uploads a processed image buffer to Supabase Storage.
 */
export async function uploadToStorage(
  buffer: Buffer,
  objectKey: string,
  bucket: "prompt-images" | "prompt-staging" = "prompt-images",
  contentType = "image/webp"
): Promise<{ publicUrl: string; objectKey: string }> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase client not available.");
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectKey, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.error(`Storage upload error (${bucket}/${objectKey}):`, uploadError);
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectKey);

  return { publicUrl, objectKey };
}
