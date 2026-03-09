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
