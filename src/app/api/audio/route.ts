import { NextRequest, NextResponse } from "next/server";

const CDN_BASE = (process.env.NEXT_PUBLIC_AUDIO_CDN_URL ?? "").replace(/\/$/, "");
const FALLBACK_BASE = "https://everyayah.com/data/Alafasy_128kbps";

/** Path must be reciterId/filename.mp3 (e.g. mishary-alafasy/001001.mp3), no traversal. */
function isValidPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (trimmed.includes("..") || trimmed.startsWith("/")) return false;
  return /^[a-z0-9-]+\/\d{6}\.mp3$/i.test(trimmed);
}

/**
 * GET /api/audio?path=reciterId/001001.mp3
 * Streams audio s fallback chain-om. Postavi NEXT_PUBLIC_AUDIO_VIA_PROXY=1 da koristi
 * ovu rutu umjesto direktnog CDN URL-a (za CORS bypass).
 * Order: NEXT_PUBLIC_AUDIO_CDN_URL → everyayah.com (default).
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || !isValidPath(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const urls: string[] = [];
  if (CDN_BASE) {
    urls.push(`${CDN_BASE}/${path}`);
  }
  const fileMatch = path.match(/^[a-z0-9-]+\/(\d{6}\.mp3)$/i);
  if (fileMatch) {
    urls.push(`${FALLBACK_BASE}/${fileMatch[1]}`);
  }
  if (urls.length === 0) {
    return NextResponse.json(
      { error: "Audio backend not configured" },
      { status: 500 }
    );
  }
  try {
    let lastStatus = 0;
    for (const url of urls) {
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) {
        const contentType = res.headers.get("content-type") ?? "audio/mpeg";
        const body = res.body;
        if (!body) {
          continue;
        }
        return new NextResponse(body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
      lastStatus = res.status;
    }
    return NextResponse.json(
      { error: "Upstream error", status: lastStatus || 502 },
      { status: lastStatus === 404 ? 404 : 502 }
    );
  } catch (e) {
    console.error("Audio proxy error:", e);
    return NextResponse.json(
      { error: "Proxy failed" },
      { status: 502 }
    );
  }
}
