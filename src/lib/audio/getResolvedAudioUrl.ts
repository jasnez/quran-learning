/**
 * Resolves relative/placeholder audio paths to a public CDN so playback works
 * when app is deployed without hosting MP3s. Uses buildAudioUrl (NEXT_PUBLIC_AUDIO_CDN_URL).
 * Falls back to everyayah.com for both relative /audio/reciter/SSSXXX.mp3 paths and
 * legacy Supabase Storage URLs (audio bucket was deleted to stay on free tier).
 */
import { buildAudioUrl } from "./reciterUtils";

const FALLBACK_CDN_BASE = "https://everyayah.com/data/Alafasy_128kbps";
const RELATIVE_AUDIO_MATCH = /\/audio\/[^/]+\/(\d{6}\.mp3)$/i;
const SUPABASE_AUDIO_MATCH = /\/storage\/v1\/object\/public\/audio\/[^/]+\/(\d{6}\.mp3)$/i;

export function getResolvedAudioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Mrtve Supabase Storage URL-ove (bucket je obrisan) preusmjeri na everyayah.
  const supabaseMatch = trimmed.match(SUPABASE_AUDIO_MATCH);
  if (supabaseMatch) {
    return `${FALLBACK_CDN_BASE}/${supabaseMatch[1]}`;
  }

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
