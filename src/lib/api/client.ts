/**
 * Thin compatibility layer that imports static Quran data directly. Pre-export
 * versions of this file fetched /api/surahs etc.; in the static-export build
 * there are no API routes, so we just defer to the static-quran loader.
 *
 * Note: these functions can be called from server components (where they use
 * fs reads via static-quran) but should not be called from client components
 * since static-quran is server-only. All app routes are SSG so client never
 * needs to call these — kept for back-compat with lib/data/index.ts.
 */

import type { SurahSummary, SurahDetail, Reciter } from "@/types/quran";
import {
  getAllSurahs as staticGetAllSurahs,
  getSurahDetail as staticGetSurahDetail,
  getAllReciters as staticGetAllReciters,
} from "@/lib/data/static-quran";

export async function fetchSurahs(): Promise<SurahSummary[]> {
  return staticGetAllSurahs();
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const detail = await staticGetSurahDetail(surahNumber);
  if (!detail) throw new Error(`Surah ${surahNumber} not found`);
  return detail;
}

export async function fetchReciters(): Promise<Reciter[]> {
  return staticGetAllReciters();
}
