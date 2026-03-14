import type { QuranicDua } from "@/types/duas";

/**
 * Returns the "daily dua" for the given date: one dua from the list,
 * chosen deterministically by day-of-year so the same date always shows the same dua.
 * @param duas - Full list of Quranic duas
 * @param date - Date to use (default: current date)
 */
const ONE_DAY_MS = 86400000;

export function getDailyDua(
  duas: QuranicDua[],
  date: Date = new Date()
): QuranicDua | undefined {
  if (duas.length === 0) return undefined;
  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const diff = date.getTime() - startOfYear;
  const dayOfYear = Math.floor(diff / ONE_DAY_MS);
  const index = Math.max(0, dayOfYear) % duas.length;
  return duas[index];
}
