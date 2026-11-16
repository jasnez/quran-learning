import type { SurahSummary } from "@/types/quran";

/**
 * The common form of a surah name, to show next to the main ("specijal") name.
 * Null when the Pravila give a single form, so the same name is not shown twice.
 */
export function commonSurahName(surah: Pick<SurahSummary, "nameLatin" | "nameBosnian">): string | null {
  const common = surah.nameBosnian?.trim();
  return common && common !== surah.nameLatin ? common : null;
}

/** Main name followed by the common form in parentheses, e.g. "El-Beqare (Bekara)". */
export function surahNameWithCommon(surah: Pick<SurahSummary, "nameLatin" | "nameBosnian">): string {
  const common = commonSurahName(surah);
  return common ? `${surah.nameLatin} (${common})` : surah.nameLatin;
}
