import { NextRequest, NextResponse } from "next/server";

const CDN_BASE = (process.env.NEXT_PUBLIC_AUDIO_CDN_URL ?? "").replace(/\/$/, "");
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const BUCKET = "audio";

/** Path must be reciterId/filename.mp3 (e.g. mishary-alafasy/001001.mp3), no traversal. */
function isValidPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (trimmed.includes("..") || trimmed.startsWith("/")) return false;
  return /^[a-z0-9-]+\/\d{6}\.mp3$/i.test(trimmed);
}

/**
 * GET /api/audio?path=reciterId/001001.mp3
 * Streams audio from Supabase Storage. Use when CORS blocks direct CDN playback.
 * Set NEXT_PUBLIC_AUDIO_VIA_PROXY=1 to use this route instead of direct CDN URL.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || !isValidPath(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  let url: string | null = null;
  if (CDN_BASE) {
    url = `${CDN_BASE}/${path}`;
  } else if (SUPABASE_URL) {
    url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  } else {
    return NextResponse.json(
      { error: "Audio backend not configured" },
      { status: 500 }
    );
  }
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: res.status },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const contentType = res.headers.get("content-type") ?? "audio/mpeg";
    const body = res.body;
    if (!body) {
      return NextResponse.json({ error: "No body" }, { status: 502 });
    }
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("Audio proxy error:", e);
    return NextResponse.json(
      { error: "Proxy failed" },
      { status: 502 }
    );
  }
}
