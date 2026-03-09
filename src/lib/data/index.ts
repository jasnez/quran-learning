/**
 * Data layer: uses API client (Next.js API routes + Supabase).
 * Replaces previous JSON file imports. All functions are async.
 */

import path from "path";
import fs from "fs";
import type { SurahSummary, SurahDetail, Ayah, Reciter } from "@/types/quran";
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
 * Returns all 114 surah summaries.
 */
export async function getAllSurahs(): Promise<SurahSummary[]> {
  return apiFetchSurahs();
}

/**
 * Returns surah detail (surah + ayahs with translations, transliterations, tajwid, audio).
 */
export async function getSurahByNumber(surahNumber: number): Promise<SurahDetail> {
  return apiFetchSurahDetail(surahNumber);
}

/**
 * Returns the ayahs array for a surah.
 */
export async function getAyahsBySurahNumber(surahNumber: number): Promise<Ayah[]> {
  const detail = await apiFetchSurahDetail(surahNumber);
  return detail.ayahs;
}

/**
 * Returns all active reciters.
 */
export async function getReciters(): Promise<Reciter[]> {
  return apiFetchReciters();
}
