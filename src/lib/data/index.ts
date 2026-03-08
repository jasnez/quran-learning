import path from "path";
import fs from "fs";
import type { SurahSummary, SurahDetail, Ayah, Reciter } from "@/types/quran";

import surahsData from "@/data/surahs.json";
import recitersData from "@/data/reciters.json";

const surahs = surahsData as SurahSummary[];
const reciters = recitersData as Reciter[];

/**
 * Returns all 114 surah summaries. Data source: src/data/surahs.json.
 * Replace with API/CMS call later without refactoring UI.
 */
export function getAllSurahs(): SurahSummary[] {
  return surahs;
}

/**
 * Returns surah detail (surah + ayahs) for a given surah number.
 * Loads from src/data/ayahs/NNN-slug.json when available.
 * For surahs without a detail file, returns the surah summary with empty ayahs array.
 */
export function getSurahByNumber(surahNumber: number): SurahDetail {
  const surah = surahs.find((s) => s.surahNumber === surahNumber);
  if (!surah) {
    throw new RangeError(
      `Invalid surah number: ${surahNumber}. Must be between 1 and 114.`
    );
  }

  const padded = String(surahNumber).padStart(3, "0");
  const filename = `${padded}-${surah.slug}.json`;
  const filePath = path.join(
    process.cwd(),
    "src",
    "data",
    "ayahs",
    filename
  );

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as { surah: SurahSummary; ayahs: Ayah[] };
    return { surah: data.surah, ayahs: data.ayahs };
  } catch {
    return { surah, ayahs: [] };
  }
}

/**
 * Returns the ayahs array for a surah. Empty array if no detail file exists.
 */
export function getAyahsBySurahNumber(surahNumber: number): Ayah[] {
  return getSurahByNumber(surahNumber).ayahs;
}

/**
 * Returns all reciters. Data source: src/data/reciters.json.
 * Replace with API/CMS call later without refactoring UI.
 */
export function getReciters(): Reciter[] {
  return reciters;
}
