/**
 * Returns relative time in Bosnian (e.g. "prije 2 dana", "danas", "jučer").
 */
export function getRelativeTimeBosnian(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffMins = Math.floor(diffMs / (60 * 1000));

  if (diffMins < 1) return "upravo sada";
  if (diffMins < 60) return `prije ${diffMins} ${diffMins === 1 ? "minute" : "minuta"}`;
  if (diffHours < 24 && date.getDate() === now.getDate()) return `prije ${diffHours} ${diffHours === 1 ? "sata" : "sati"}`;
  if (diffDays === 0) return "danas";
  if (diffDays === 1) return "jučer";
  if (diffDays < 7) return `prije ${diffDays} dana`;
  if (diffDays < 30) return `prije ${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? "nedjelje" : "nedjelja"}`;
  if (diffDays < 365) return `prije ${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? "mjeseca" : "mjeseci"}`;
  return `prije ${Math.floor(diffDays / 365)} ${Math.floor(diffDays / 365) === 1 ? "godine" : "godina"}`;
}
