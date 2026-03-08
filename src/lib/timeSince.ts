/**
 * Returns a short "time since" string in Bosnian, e.g. "prije 3 sata", "prije 5 minuta".
 */
export function timeSince(isoTimestamp: string): string {
  if (!isoTimestamp) return "";
  const then = new Date(isoTimestamp).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffD >= 1) return `prije ${diffD} ${diffD === 1 ? "dan" : "dana"}`;
  if (diffH >= 1) return `prije ${diffH} ${diffH === 1 ? "sat" : diffH < 5 ? "sata" : "sati"}`;
  if (diffMin >= 1) return `prije ${diffMin} ${diffMin === 1 ? "minuta" : diffMin < 5 ? "minute" : "minuta"}`;
  return "upravo sad";
}
