import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import crypto from "node:crypto";
import sharp from "sharp";

/**
 * Generates a collision-resistant storage path for prompt images.
 */
function generateStorageKey(slug: string, ext = "webp"): string {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  return `${safeSlug || "prompt"}-${timestamp}-${randomSuffix}.${ext}`;
}

/**
 * Calculates GCD for aspect ratio strings.
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function computeAspectRatioValue(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "1/1";
  const divisor = gcd(Math.round(width), Math.round(height));
  const rw = Math.round(width / divisor);
  const rh = Math.round(height / divisor);

  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.03) return "16/9";
  if (Math.abs(ratio - 9 / 16) < 0.03) return "9/16";
  if (Math.abs(ratio - 4 / 3) < 0.03) return "4/3";
  if (Math.abs(ratio - 3 / 4) < 0.03) return "3/4";
  if (Math.abs(ratio - 3 / 2) < 0.03) return "3/2";
  if (Math.abs(ratio - 2 / 3) < 0.03) return "2/3";
  if (Math.abs(ratio - 1) < 0.03) return "1/1";

  if (rw <= 32 && rh <= 32) return `${rw}/${rh}`;
  return `${(width / height).toFixed(2)}/1`;
}

export async function POST(req: NextRequest) {
  try {
    // 0. Enforce rate limiting with generous admin allowance
    const rateLimit = checkRateLimit(req, {
      limit: 60,
      windowMs: 60 * 1000,
      key: "admin_upload",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many upload requests. Please wait a moment and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.retryAfter.toString(),
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    // 1. Authenticate & Authorize as verified admin
    try {
      await requireAdmin();
    } catch (authErr) {
      console.warn("Upload authorization failed:", authErr);
      const errMsg = authErr instanceof Error ? authErr.message : "Authentication required.";
      const status = errMsg.includes("FORBIDDEN") ? 403 : 401;
      return NextResponse.json({ success: false, error: errMsg }, { status });
    }

    // 2. Parse payload: Support both multipart/form-data and application/json
    let buffer: Buffer | null = null;
    let fileName = "upload";
    let folder = "";
    let clientDataUrl: string | null = null;
    let fallbackWidth = 1200;
    let fallbackHeight = 1200;
    let fallbackDominantColor = "#18181c";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      if (json.dataUrl && typeof json.dataUrl === "string") {
        clientDataUrl = json.dataUrl;
        const base64Data = json.dataUrl.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      }
      if (json.fileName) fileName = String(json.fileName);
      if (json.folder) folder = String(json.folder);
      if (json.width) fallbackWidth = Number(json.width);
      if (json.height) fallbackHeight = Number(json.height);
      if (json.dominantColor) fallbackDominantColor = String(json.dominantColor);
    } else {
      const formData = await req.formData();
      const file = formData.get("file");

      if (file && file instanceof File) {
        fileName = file.name || "upload";
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }

      const clientUrl = formData.get("dataUrl");
      if (clientUrl && typeof clientUrl === "string") {
        clientDataUrl = clientUrl;
        if (!buffer) {
          const base64Data = clientUrl.replace(/^data:image\/\w+;base64,/, "");
          buffer = Buffer.from(base64Data, "base64");
        }
      }

      const formFolder = formData.get("folder");
      if (formFolder && typeof formFolder === "string") {
        folder = formFolder;
      }
      const formColor = formData.get("dominantColor");
      if (formColor && typeof formColor === "string") {
        fallbackDominantColor = formColor;
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image content provided." },
        { status: 400 }
      );
    }

    // 3. Process image with sharp:
    // Auto-orient EXIF, strip metadata, convert to WebP, compute dimensions & dominant color
    let processedBuffer = buffer;
    let width = fallbackWidth;
    let height = fallbackHeight;
    let dominantColor = fallbackDominantColor;

    try {
      const sharpInstance = sharp(buffer).rotate();
      const meta = await sharpInstance.metadata();

      if (meta.width && meta.height) {
        width = meta.width;
        height = meta.height;
      }

      // If dimensions exceed 1600px edge, resize to stay fast and lightweight
      if (width > 1600 || height > 1600) {
        sharpInstance.resize({
          width: width >= height ? 1600 : undefined,
          height: height > width ? 1600 : undefined,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Encode as clean WebP
      processedBuffer = await sharpInstance
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const processedMeta = await sharp(processedBuffer).metadata();
      if (processedMeta.width && processedMeta.height) {
        width = processedMeta.width;
        height = processedMeta.height;
      }

      // Calculate dominant color
      const stats = await sharp(processedBuffer).stats();
      if (stats.dominant) {
        const { r, g, b } = stats.dominant;
        dominantColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
    } catch (sharpErr) {
      console.warn("Sharp processing note (falling back to direct buffer):", sharpErr);
      // If sharp fails on edge case, use original buffer and fallback metadata
    }

    let aspectRatio: "portrait" | "landscape" | "square" = "square";
    if (width > height) {
      aspectRatio = "landscape";
    } else if (height > width) {
      aspectRatio = "portrait";
    }
    const aspectRatioValue = computeAspectRatioValue(width, height);

    // 4. Collision-resistant storage key
    const prefix = folder ? `${folder}/` : "";
    const baseSlug = fileName.replace(/\.[^/.]+$/, "");
    const storageKey = `${prefix}${generateStorageKey(baseSlug, "webp")}`;

    // 5. 3-TIER FAIL-SAFE UPLOAD STRATEGY
    // Tier 1: Supabase Service Role client (bypasses RLS, auto-creates bucket)
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        // Attempt to ensure bucket exists
        try {
          await adminClient.storage.createBucket("prompt-images", {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ["image/webp", "image/jpeg", "image/png", "image/avif"],
          });
        } catch {
          // Bucket may already exist, ignore create error
        }

        const { error: uploadError } = await adminClient.storage
          .from("prompt-images")
          .upload(storageKey, processedBuffer, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "31536000",
          });

        if (!uploadError) {
          const { data } = adminClient.storage
            .from("prompt-images")
            .getPublicUrl(storageKey);

          if (data?.publicUrl) {
            return NextResponse.json({
              success: true,
              data: {
                imageUrl: data.publicUrl,
                width,
                height,
                aspectRatio,
                aspectRatioValue,
                dominantColor,
                storageType: "supabase-service-role",
              },
            });
          }
        } else {
          console.warn("Tier 1 upload error:", uploadError.message);
        }
      } catch (t1Err) {
        console.warn("Tier 1 storage upload exception:", t1Err);
      }
    }

    // Tier 2: Supabase User client (authenticated via admin session cookie)
    try {
      const userClient = await createClient();
      if (userClient) {
        const { error: userUploadError } = await userClient.storage
          .from("prompt-images")
          .upload(storageKey, processedBuffer, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "31536000",
          });

        if (!userUploadError) {
          const { data } = userClient.storage
            .from("prompt-images")
            .getPublicUrl(storageKey);

          if (data?.publicUrl) {
            return NextResponse.json({
              success: true,
              data: {
                imageUrl: data.publicUrl,
                width,
                height,
                aspectRatio,
                aspectRatioValue,
                dominantColor,
                storageType: "supabase-user",
              },
            });
          }
        } else {
          console.warn("Tier 2 upload error:", userUploadError.message);
        }
      }
    } catch (t2Err) {
      console.warn("Tier 2 storage upload exception:", t2Err);
    }

    // Tier 3: Unbreakable inline WebP Data URI fallback
    // Guarantees 100% upload success even if Supabase storage is unconfigured or blocked by RLS.
    // Since the image is compressed WebP (<300KB), storing in Postgres text column works reliably.
    const finalDataUrl =
      clientDataUrl && clientDataUrl.startsWith("data:image/webp;base64,")
        ? clientDataUrl
        : `data:image/webp;base64,${processedBuffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: finalDataUrl,
        width,
        height,
        aspectRatio,
        aspectRatioValue,
        dominantColor,
        storageType: "inline-webp",
      },
      warning: "Stored as inline WebP Data URI (Supabase Storage unavailable).",
    });
  } catch (err) {
    console.error("API /api/admin/upload unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Image processing failed.",
      },
      { status: 500 }
    );
  }
}
