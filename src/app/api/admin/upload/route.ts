import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  validateAndProcessImage,
  uploadToStorage,
  generateStorageKey,
} from "@/lib/storage/image";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & Authorize as verified admin
    await requireAdmin();

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    const folder = (formData.get("folder") as string) || "";
    const prefix = folder ? `${folder}/` : "";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Process image with sharp pipeline:
    // auto-orients EXIF, validates minimum dimensions, strips metadata, converts to WebP
    const processed = await validateAndProcessImage(buffer, {
      maxSizeBytes: 10 * 1024 * 1024,
      minDimension: 512,
      maxMegapixels: 40_000_000,
      maxEdge: 2560,
    });

    // 4. Generate collision-resistant storage key and upload
    const baseSlug = file.name.replace(/\.[^/.]+$/, "");
    const storageKey = `${prefix}${generateStorageKey(baseSlug)}`;

    const { publicUrl } = await uploadToStorage(
      processed.buffer,
      storageKey,
      "prompt-images",
      processed.contentType
    );

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: publicUrl,
        width: processed.width,
        height: processed.height,
        aspectRatio: processed.aspectRatio,
        aspectRatioValue: processed.aspectRatioValue,
        dominantColor: processed.dominantColor,
      },
    });
  } catch (err) {
    console.error("API /api/admin/upload error:", err);
    const message =
      err instanceof Error ? err.message : "Image processing failed.";
    const status = message.includes("UNAUTHORIZED")
      ? 401
      : message.includes("FORBIDDEN")
      ? 403
      : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
