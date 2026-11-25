/**
 * Reading and listening count together (Phase 4, D9): an ayah is done when it was read (2 s on
 * screen, see AyahUnit) or heard. The progress store keeps the two sets apart and is not
 * changed; the union is computed when a number is shown.
 */
export type AyahSets =
  | {
      ayahsListened?: Iterable<number>;
      /** Missing in progress stored before reading was tracked. */
      ayahsRead?: Iterable<number>;
    }
  | undefined;

/** Ayah numbers of one surah that were read or heard. */
export function ayahsDone(progress: AyahSets): Set<number> {
  return new Set<number>([...(progress?.ayahsListened ?? []), ...(progress?.ayahsRead ?? [])]);
}

export function ayahsDoneCount(progress: AyahSets): number {
  return ayahsDone(progress).size;
}
