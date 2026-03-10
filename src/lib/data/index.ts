/**
 * Data layer: Server Components use Supabase directly; client/API use fetch to API routes.
 */

import path from "path";
import fs from "fs";
import type { SurahSummary, SurahDetail, Ayah, Reciter } from "@/types/quran";
import { fetchSurahsFromDb, fetchSurahDetailFromDb } from "@/lib/supabase/surahs-data";
import {
  fetchSurahs as apiFetchSurahs,
  fetchSurahDetail as apiFetchSurahDetail,
  fetchReciters as apiFetchReciters,
} from "@/lib/api/client";

/** Sync load of surahs from JSON (for legacy getSearchIndex only). */
export function getSurahsSync(): SurahSummary[] {
  const filePath = path.join(process.cwd(), "src", "data", "surahs.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SurahSummary[];
}

/**
 * Returns all 114 surah summaries. Uses Supabase directly on server (no self-fetch on Vercel).
 */
export async function getAllSurahs(): Promise<SurahSummary[]> {
  if (typeof window === "undefined") return fetchSurahsFromDb();
  return apiFetchSurahs();
}

/**
 * Returns surah detail (surah + ayahs). Uses Supabase directly on server (no self-fetch on Vercel).
 */
export async function getSurahByNumber(surahNumber: number): Promise<SurahDetail> {
  if (typeof window === "undefined") return fetchSurahDetailFromDb(surahNumber);
  return apiFetchSurahDetail(surahNumber);
}

/**
 * Returns the ayahs array for a surah.
 */
export async function getAyahsBySurahNumber(surahNumber: number): Promise<Ayah[]> {
  const detail = await getSurahByNumber(surahNumber);
  return detail.ayahs;
}

/**
 * Returns all active reciters.
 */
export async function getReciters(): Promise<Reciter[]> {
  return apiFetchReciters();
}

/** Segment of a juz: one surah with only the ayahs that fall in the juz. */
export type JuzSegment = { surah: SurahSummary; ayahs: Ayah[] };

/**
 * Returns all ayahs for a juz, grouped by surah (only the range within the juz).
 * For server/juz page only.
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
