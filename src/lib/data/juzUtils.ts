/**
 * Juz (جزء) utilities: 30 portions of the Quran. Data from src/data/juz.json.
 * Safe for server and client (uses static JSON import, no fs).
 */

import juzData from "@/data/juz.json";
import type { JuzInfo, SurahSummary } from "@/types/quran";

type JuzRaw = { juz: number; name: string; nameArabic: string; start: string; end: string };

function parseSurahAyah(surahAyah: string): { surah: number; ayah: number } {
  const [s, a] = surahAyah.split(":").map((x) => parseInt(x, 10));
  return { surah: s!, ayah: a! };
}

function computeSurahsIncluded(startSurah: number, _startAyah: number, endSurah: number, _endAyah: number): number[] {
  const list: number[] = [];
  for (let s = startSurah; s <= endSurah; s++) {
    list.push(s);
  }
  return list;
}

const cachedJuzList: JuzInfo[] = (juzData as JuzRaw[]).map((row) => {
  const start = parseSurahAyah(row.start);
  const end = parseSurahAyah(row.end);
  return {
    juz: row.juz,
    name: row.name,
    nameArabic: row.nameArabic,
    start: row.start,
    end: row.end,
    startSurah: start.surah,
    startAyah: start.ayah,
    endSurah: end.surah,
    endAyah: end.ayah,
    surahsIncluded: computeSurahsIncluded(start.surah, start.ayah, end.surah, end.ayah),
  };
});

/** Returns all 30 Juz with parsed start/end and surahsIncluded. */
export function getAllJuz(): JuzInfo[] {
  return cachedJuzList;
}

/** Returns a single Juz by number (1–30). */
export function getJuzByNumber(juzNumber: number): JuzInfo | undefined {
  return cachedJuzList.find((j) => j.juz === juzNumber);
}

/** Returns which Juz (1–30) contains the given surah:ayah. */
export function getJuzForAyah(surahNumber: number, ayahNumber: number): number | undefined {
  for (const j of cachedJuzList) {
    if (surahNumber < j.startSurah || (surahNumber === j.startSurah && ayahNumber < j.startAyah)) continue;
    if (surahNumber > j.endSurah || (surahNumber === j.endSurah && ayahNumber > j.endAyah)) continue;
    return j.juz;
  }
  return undefined;
}

/** Returns surah summaries that have at least one ayah in this juz. Order preserved from allSurahs. */
export function getSurahsInJuz(juzNumber: number, allSurahs: SurahSummary[]): SurahSummary[] {
  const juz = getJuzByNumber(juzNumber);
  if (!juz) return [];
  const set = new Set(juz.surahsIncluded);
  return allSurahs.filter((s) => set.has(s.surahNumber));
}

/** Progress for a juz: total ayahs in juz and how many listened (if getSurahProgress provided). */
export type JuzProgressResult = { totalAyahs: number; listened: number; percent: number };

export type GetSurahProgress = (surahNumber: number) => { ayahsListened: Set<number> } | undefined;

/** Returns total ayahs in juz and, if getSurahProgress is provided, listened count and percent. */
export function getJuzProgress(
  juzNumber: number,
  getSurahProgress?: GetSurahProgress,
  allSurahs?: SurahSummary[]
): JuzProgressResult {
  const juz = getJuzByNumber(juzNumber);
  if (!juz) return { totalAyahs: 0, listened: 0, percent: 0 };

  let totalAyahs = 0;
  let listened = 0;

  for (const surahNum of juz.surahsIncluded) {
    const isStartSurah = surahNum === juz.startSurah;
    const isEndSurah = surahNum === juz.endSurah;
    const startAyah = isStartSurah ? juz.startAyah : 1;
    const endAyah = isEndSurah ? juz.endAyah : (allSurahs?.find((s) => s.surahNumber === surahNum)?.ayahCount ?? 286);
    const count = endAyah - startAyah + 1;
    totalAyahs += count;

    if (getSurahProgress) {
      const progress = getSurahProgress(surahNum);
      if (progress) {
        for (let a = startAyah; a <= endAyah; a++) {
          if (progress.ayahsListened.has(a)) listened++;
        }
      }
    }
  }

  const percent = totalAyahs > 0 ? Math.round((listened / totalAyahs) * 100) : 0;
  return { totalAyahs, listened, percent };
}
