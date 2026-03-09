import type { Word, TajwidRule } from "@/types/quran";

/**
 * Normalize word timings to be relative to the start of the ayah.
 * Word data from the API/DB is often stored with timings relative to the whole surah
 * (e.g. ayah 2 words start at 2500ms). When we play a single ayah, audio currentTime
 * starts at 0, so we need 0-based timings for the active word check.
 */
export function normalizeWordsToAyahRelative(words: Word[]): Word[] {
  if (words.length === 0) return [];
  const offsetMs = Math.min(...words.map((w) => w.startTimeMs));
  if (offsetMs === 0) return words;
  return words.map((w) => ({
    ...w,
    startTimeMs: w.startTimeMs - offsetMs,
    endTimeMs: w.endTimeMs - offsetMs,
  }));
}

const TAJWID_RULES: TajwidRule[] = ["normal", "mad", "ghunnah", "ikhfa", "qalqalah"];

/** Normalize API response row to Word (handles snake_case from API/cache). */
export function normalizeWordFromApi(row: Record<string, unknown>): Word {
  const rawRule = String(row.tajwidRule ?? row.tajwid_rule ?? "normal");
  const tajwidRule: TajwidRule = TAJWID_RULES.includes(rawRule as TajwidRule)
    ? (rawRule as TajwidRule)
    : "normal";
  return {
    id: Number(row.id ?? row.word_id ?? 0),
    ayahId: Number(row.ayahId ?? row.ayah_id ?? 0),
    ayahKey:
      typeof row.ayahKey === "string"
        ? row.ayahKey
        : typeof row.ayah_key === "string"
          ? row.ayah_key
          : undefined,
    wordOrder: Number(row.wordOrder ?? row.word_order ?? 0),
    textArabic: String(row.textArabic ?? row.text_arabic ?? ""),
    transliteration:
      row.transliteration != null ? String(row.transliteration) : undefined,
    translationShort:
      row.translationShort != null || row.translation_short != null
        ? String(row.translationShort ?? row.translation_short ?? "")
        : undefined,
    startTimeMs: Number(row.startTimeMs ?? row.start_time_ms ?? 0),
    endTimeMs: Number(row.endTimeMs ?? row.end_time_ms ?? 0),
    tajwidRule,
  };
}
