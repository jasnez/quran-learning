import type { Word, TajwidRule } from "@/types/quran";
import type { WordData } from "@/types/wordByWord";

export type WordDataWithTajwid = WordData & { tajwidRule?: TajwidRule };

/**
 * Map tajwidRule from local DB words (Word[]) to Quran.com WordData
 * by matching 1-based word positions. This relies on both datasets
 * using the same word ordering within an ayah.
 */
export function mapDbWordsToQuranComWords(
  dbWords: Word[] | undefined,
  apiWords: WordData[]
): WordDataWithTajwid[] {
  if (!dbWords || dbWords.length === 0 || apiWords.length === 0) {
    // Return shallow copy so callers can safely mutate if needed
    return apiWords.map((w) => ({ ...w }));
  }

  const byPosition = new Map<number, TajwidRule>();
  for (const w of dbWords) {
    const pos = Number(w.wordOrder);
    if (!Number.isNaN(pos) && pos > 0 && !byPosition.has(pos)) {
      byPosition.set(pos, w.tajwidRule);
    }
  }

  return apiWords.map((w) => {
    const rule = byPosition.get(w.position);
    return rule ? { ...w, tajwidRule: rule } : { ...w };
  });
}

