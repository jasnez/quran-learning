import type { QuranicDua, DisplayDua } from "@/types/duas";

/**
 * Grupira uzastopne ajete iste sure u jednu prikaznu dovu (DisplayDua).
 * Npr. 3:191, 3:192, 3:193, 3:194 → jedna dova s id "3:191-194" i spojenim tekstovima.
 */
export function mergeConsecutiveDuas(duas: QuranicDua[]): DisplayDua[] {
  if (duas.length === 0) return [];

  const sorted = [...duas].sort(
    (a, b) =>
      a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber
  );

  const result: DisplayDua[] = [];
  let group: QuranicDua[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const isConsecutive =
      curr.surahNumber === prev.surahNumber &&
      curr.ayahNumber === prev.ayahNumber + 1;

    if (isConsecutive) {
      group.push(curr);
    } else {
      result.push(buildDisplayDua(group));
      group = [curr];
    }
  }
  result.push(buildDisplayDua(group));
  return result;
}

function buildDisplayDua(group: QuranicDua[]): DisplayDua {
  if (group.length === 1) {
    return { ...group[0] };
  }
  const first = group[0];
  const last = group[group.length - 1];
  const separator = " ";
  return {
    ...first,
    id: `${first.surahNumber}:${first.ayahNumber}-${last.ayahNumber}`,
    ayahEnd: last.ayahNumber,
    arabic: group.map((d) => d.arabic).join(separator),
    transliteration: group.map((d) => d.transliteration).join(separator),
    translationBosnian: group.map((d) => d.translationBosnian).join(separator),
  };
}
