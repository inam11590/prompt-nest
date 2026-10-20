import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get("title") || "Elite AI Prompt Showcase";
    const model = searchParams.get("model") || "Midjourney v6.1";
    const category = searchParams.get("category") || "Curated Prompt";
    const author = searchParams.get("author") || "PromptNest";
    const rawLikes = searchParams.get("likes");
    const likes = rawLikes ? parseInt(rawLikes, 10) : 142;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#090A0F",
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 45%), linear-gradient(145deg, #090A0F 0%, #121521 100%)",
            padding: "56px 64px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#FFFFFF",
            position: "relative",
          }}
        >
          {/* Subtle Grid Pattern Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Top Row: Model Badge + Category Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(99, 102, 241, 0.18)",
                  border: "1px solid rgba(129, 140, 248, 0.45)",
                  color: "#A5B4FC",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                ✦ {model}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#E2E8F0",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {category}
              </div>
            </div>

            {/* Verified Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(16, 185, 129, 0.14)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                color: "#34D399",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ✓ Tested & Production Ready
            </div>
          </div>

          {/* Main Content: Title & Card Frame */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              zIndex: 1,
              maxWidth: "1000px",
            }}
          >
            <h1
              style={{
                fontSize: title.length > 50 ? 52 : 62,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                color: "#F8FAFC",
                margin: 0,
                textShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: 22,
                color: "#94A3B8",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Copy prompt, customize variables, and explore reproduction parameters live on PromptNest.
            </p>
          </div>

          {/* Footer Bar: Brand Logo + Author + Likes */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              zIndex: 1,
            }}
          >
            {/* Logo Mark */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "#FFFFFF",
                }}
              >
                P
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#FFFFFF",
                }}
              >
                Prompt<span style={{ color: "#818CF8" }}>Nest</span>
              </div>
            </div>

            {/* Author Attribution */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: 16,
                color: "#94A3B8",
              }}
            >
              <span>Curated by</span>
              <span
                style={{
                  color: "#E2E8F0",
                  fontWeight: 600,
                }}
              >
                @{author}
              </span>
            </div>

            {/* Engagement Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: 15,
                color: "#F43F5E",
                fontWeight: 600,
              }}
            >
              <span>♥</span>
              <span style={{ color: "#E2E8F0" }}>{likes.toLocaleString()} saves</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OpenGraph image:", error);
    return new Response("Failed to generate OpenGraph image", { status: 500 });
  }
}
