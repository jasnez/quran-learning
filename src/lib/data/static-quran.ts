/**
 * Static Quran data loader. Reads from src/data/{surahs,ayahs,words,reciters}.json
 * No database, no network — works at build time (SSG) and runtime (API routes).
 */

import { promises as fs } from "fs";
import path from "path";
import surahsJson from "@/data/surahs.json";
import recitersJson from "@/data/reciters.json";
import type {
  SurahSummary,
  SurahDetail,
  Ayah,
  Reciter,
  Word,
  TajwidRule,
} from "@/types/quran";

const SURAHS = surahsJson as SurahSummary[];
const RECITERS = recitersJson as Array<{
  id: string;
  name: string;
  arabicName: string;
  isDefault?: boolean;
}>;

const AYAHS_DIR = path.join(process.cwd(), "src", "data", "ayahs");
// Words/chapter-audio live in public/ so they're also accessible to the client
// (fetch /data/words/... and /data/chapter-audio/...) under static export.
const WORDS_DIR = path.join(process.cwd(), "public", "data", "words");

type AyahFilePayload = {
  surah: SurahSummary;
  ayahs: Ayah[];
};

type WordJson = {
  ayahNumberGlobal: number;
  wordOrder: number;
  textArabic: string;
  transliteration?: string;
  translationShort?: string;
  startTimeMs: number;
  endTimeMs: number;
  tajwidRule?: string;
};

function paddedSurah(n: number): string {
  return String(n).padStart(3, "0");
}

export function getAllSurahs(): SurahSummary[] {
  return SURAHS;
}

export function getSurahSummary(surahNumber: number): SurahSummary | null {
  return SURAHS.find((s) => s.surahNumber === surahNumber) ?? null;
}

export async function getSurahDetail(surahNumber: number): Promise<SurahDetail | null> {
  const surah = getSurahSummary(surahNumber);
  if (!surah) return null;
  const filePath = path.join(AYAHS_DIR, `${paddedSurah(surahNumber)}-${surah.slug}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as AyahFilePayload;
    return { surah: data.surah, ayahs: data.ayahs };
  } catch {
    return null;
  }
}

/** Word-by-word data for a surah. Currently only Al-Fatiha (surah 1) has a JSON file. */
export async function getWordsForSurah(surahNumber: number): Promise<Word[]> {
  const surah = getSurahSummary(surahNumber);
  if (!surah) return [];
  const filePath = path.join(WORDS_DIR, `${paddedSurah(surahNumber)}-${surah.slug}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const wordsArr = JSON.parse(raw) as WordJson[];
    const detail = await getSurahDetail(surahNumber);
    const globalToAyahNumber = new Map<number, number>();
    detail?.ayahs.forEach((a) => globalToAyahNumber.set(a.ayahNumberGlobal, a.ayahNumber));
    return wordsArr.map((w, idx) => {
      const ayahNum = globalToAyahNumber.get(w.ayahNumberGlobal);
      return {
        id: idx + 1,
        ayahId: w.ayahNumberGlobal,
        ayahKey: ayahNum != null ? `${surahNumber}:${ayahNum}` : undefined,
        wordOrder: w.wordOrder,
        textArabic: w.textArabic,
        transliteration: w.transliteration ?? undefined,
        translationShort: w.translationShort ?? undefined,
        startTimeMs: w.startTimeMs,
        endTimeMs: w.endTimeMs,
        tajwidRule: ((w.tajwidRule as TajwidRule) || "normal"),
      };
    });
  } catch {
    return [];
  }
}

export function getAllReciters(): Reciter[] {
  return RECITERS.map((r) => ({
    id: r.id,
    name: r.name,
    arabicName: r.arabicName,
    isDefault: r.isDefault === true,
  }));
}

/**
 * Loads all ayahs across all surahs. Used by search.
 * Caches result in module scope after first call.
 */
let allDetailsCache: SurahDetail[] | null = null;

export async function getAllSurahDetails(): Promise<SurahDetail[]> {
  if (allDetailsCache) return allDetailsCache;
  const details = await Promise.all(
    SURAHS.map((s) => getSurahDetail(s.surahNumber))
  );
  allDetailsCache = details.filter((d): d is SurahDetail => d != null);
  return allDetailsCache;
}
