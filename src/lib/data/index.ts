/**
 * Data layer: Server reads static JSON via static-quran; client fetches API routes.
 */

import type { SurahSummary, SurahDetail, Ayah, Reciter } from "@/types/quran";
import {
  getAllSurahs as staticGetAllSurahs,
  getSurahDetail as staticGetSurahDetail,
  getAllReciters as staticGetAllReciters,
} from "@/lib/data/static-quran";
import {
  fetchSurahs as apiFetchSurahs,
  fetchSurahDetail as apiFetchSurahDetail,
  fetchReciters as apiFetchReciters,
} from "@/lib/api/client";

/** Sync load of surahs (for search index and similar). */
export function getSurahsSync(): SurahSummary[] {
  return staticGetAllSurahs();
}

/** Returns all 114 surah summaries. */
export async function getAllSurahs(): Promise<SurahSummary[]> {
  if (typeof window === "undefined") return staticGetAllSurahs();
  return apiFetchSurahs();
}

/** Returns surah detail (surah + ayahs). */
export async function getSurahByNumber(surahNumber: number): Promise<SurahDetail> {
  if (typeof window === "undefined") {
    const detail = await staticGetSurahDetail(surahNumber);
    if (!detail) throw new Error("Surah not found");
    return detail;
  }
  return apiFetchSurahDetail(surahNumber);
}

/** Returns the ayahs array for a surah. */
export async function getAyahsBySurahNumber(surahNumber: number): Promise<Ayah[]> {
  const detail = await getSurahByNumber(surahNumber);
  return detail.ayahs;
}

/** Returns all reciters. */
export async function getReciters(): Promise<Reciter[]> {
  if (typeof window === "undefined") return staticGetAllReciters();
  return apiFetchReciters();
}

/** Segment of a juz: one surah with only the ayahs that fall in the juz. */
export type JuzSegment = { surah: SurahSummary; ayahs: Ayah[] };

/**
 * Returns all ayahs for a juz, grouped by surah (only the range within the juz).
 */
export async function getAyahsForJuz(juzNumber: number): Promise<JuzSegment[]> {
  const { getJuzByNumber } = await import("@/lib/data/juzUtils");
  const juz = getJuzByNumber(juzNumber);
  if (!juz) return [];

  const segments: JuzSegment[] = [];

  for (const surahNum of juz.surahsIncluded) {
    const isStartSurah = surahNum === juz.startSurah;
    const isEndSurah = surahNum === juz.endSurah;
    const startAyah = isStartSurah ? juz.startAyah : 1;

    const detail = await getSurahByNumber(surahNum);
    const endAyah = isEndSurah ? juz.endAyah : detail.surah.ayahCount;
    const ayahs = detail.ayahs;
    const slice = ayahs.filter((a) => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah);
    if (slice.length > 0) {
      segments.push({ surah: detail.surah, ayahs: slice });
    }
  }

  return segments;
}
