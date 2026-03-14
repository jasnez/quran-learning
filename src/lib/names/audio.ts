/**
 * Base URL za audio fajlove 99 Allahovih imena.
 * Koristi se GitHub repo soachishti/Asma-ul-Husna (raw.githubusercontent.com).
 * Za vlastiti hosting postavite NEXT_PUBLIC_NAMES_AUDIO_BASE_URL u .env.
 */
const ENV_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_NAMES_AUDIO_BASE_URL ?? "").trim()
    : "";

export const NAMES_AUDIO_BASE_URL =
  ENV_BASE ||
  "https://raw.githubusercontent.com/soachishti/Asma-ul-Husna/master/audio";

/** Vraća URL za audio imena po indeksu (1–99). */
export function getNamesAudioUrl(index: number): string {
  return `${NAMES_AUDIO_BASE_URL}/${index}.mp3`;
}
