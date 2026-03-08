/**
 * Resolves relative/placeholder audio paths to a public CDN so playback works
 * when app is deployed without hosting MP3s (e.g. Vercel).
 * Format in data: /audio/mishary-alafasy/001001.mp3 → file name 001001.mp3.
 * EveryAyah: https://everyayah.com/data/Alafasy_128kbps/001001.mp3
 */
const AUDIO_CDN_BASE = "https://everyayah.com/data/Alafasy_128kbps";

/** Extract SSSXXX.mp3 from path like /audio/mishary-alafasy/001001.mp3 */
const RELATIVE_AUDIO_MATCH = /\/audio\/[^/]+\/(\d{6}\.mp3)$/i;

export function getResolvedAudioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const match = trimmed.match(RELATIVE_AUDIO_MATCH);
  if (match) {
    return `${AUDIO_CDN_BASE}/${match[1]}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed;
}
