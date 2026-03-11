/**
 * Resolves relative/placeholder audio paths to a public CDN so playback works
 * when app is deployed without hosting MP3s. Uses buildAudioUrl (NEXT_PUBLIC_AUDIO_CDN_URL).
 * Falls back to everyayah.com when CDN is not set and path is /audio/reciter/SSSXXX.mp3.
 */
import { buildAudioUrl } from "./reciterUtils";

const FALLBACK_CDN_BASE = "https://everyayah.com/data/Alafasy_128kbps";
const RELATIVE_AUDIO_MATCH = /\/audio\/[^/]+\/(\d{6}\.mp3)$/i;

export function getResolvedAudioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const resolved = buildAudioUrl(trimmed);
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }
  if (resolved.startsWith("/api/audio")) {
    return resolved;
  }
  const match = trimmed.match(RELATIVE_AUDIO_MATCH);
  if (match) {
    return `${FALLBACK_CDN_BASE}/${match[1]}`;
  }
  return resolved || null;
}
