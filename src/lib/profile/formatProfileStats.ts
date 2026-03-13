/**
 * Returns formatted streak value for profile display (label is "Najduži niz dana zaredom" on page).
 * E.g. "0 dana" | "1 dan" | "5 dana".
 */
export function formatLongestStreak(days: number): string {
  if (!Number.isInteger(days) || days < 0) {
    return "0 dana";
  }
  return days === 1 ? "1 dan" : `${days} dana`;
}
