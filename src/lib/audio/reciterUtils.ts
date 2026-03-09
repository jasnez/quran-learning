/**
 * Builds a full audio URL from a relative path or returns absolute URLs unchanged.
 * Uses NEXT_PUBLIC_AUDIO_CDN_URL when set (e.g. Supabase Storage public URL).
 * Relative paths like /audio/mishary-alafasy/001001.mp3 become CDN_BASE/mishary-alafasy/001001.mp3.
 */

const CDN_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_AUDIO_CDN_URL ?? "").replace(/\/$/, "")
    : "";

/** Strip leading slashes and optional "audio/" so path is reciterId/file.mp3 for CDN. */
function relativePathForCdn(url: string): string {
  let p = url.trim().replace(/^\/+/, "");
  if (p.startsWith("audio/")) p = p.slice(6);
  return p;
}

/**
 * Returns the URL to use for audio playback.
 * - If url is already absolute (http/https), returns it unchanged.
 * - If NEXT_PUBLIC_AUDIO_CDN_URL is set and url is relative, returns CDN_BASE + path (path = reciter/file.mp3).
 * - Otherwise returns url as-is (relative path for same-origin).
 */
export function buildAudioUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = relativePathForCdn(trimmed);
  if (CDN_BASE) {
    return path ? `${CDN_BASE}/${path}` : CDN_BASE;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
