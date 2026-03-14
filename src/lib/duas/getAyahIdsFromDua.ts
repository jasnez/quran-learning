import type { DisplayDua } from "@/types/duas";

/**
 * Vraća niz ayah id-eva (npr. ["3:191", "3:192"]) za dovu.
 * Jedan ajet → jedan id; spojena dova (ayahEnd) → raspon id-eva.
 */
export function getAyahIdsFromDua(dua: DisplayDua): string[] {
  const { surahNumber, ayahNumber, ayahEnd } = dua;
  const end = ayahEnd ?? ayahNumber;
  const ids: string[] = [];
  for (let a = ayahNumber; a <= end; a++) {
    ids.push(`${surahNumber}:${a}`);
  }
  return ids;
}
