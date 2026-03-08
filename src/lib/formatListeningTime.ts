/**
 * Formats milliseconds as "2h 34min" or "45 min" or "0 min".
 */
export function formatListeningTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0 min";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  return `${totalMinutes} min`;
}
