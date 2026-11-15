import type { VerseTimestamp } from "@/types/wordByWord";

/** One recited word occurrence, in ms relative to the start of the per-ayah audio file. */
export type AyahWordTiming = { wordIndex: number; startMs: number; endMs: number };

/** Last segment may end at most this long before the verse end (else the verse is shifted/truncated). */
const MAX_TAIL_GAP_MS = 1500;
/** Last segment may end at most this long after the verse end. */
const MAX_TAIL_OVERRUN_MS = 300;

/**
 * Converts a verse's chapter-relative word segments (Quran.com QDC data) into an
 * ayah-relative timeline for the everyayah per-ayah file of the same recording.
 * The per-ayah file is cut at `timestampFrom` (measured 2026-11-15), so
 * file time = chapter time - timestampFrom.
 *
 * Returns null when the segments cannot be trusted for this verse; the caller must
 * then show the plain text instead of highlighting a wrong word.
 */
export function buildAyahWordTimeline(
  verse: VerseTimestamp,
  wordCount: number,
): AyahWordTiming[] | null {
  const segs = verse.segments;
  if (segs.length === 0) return null;
  for (let i = 1; i < segs.length; i++) {
    if (segs[i].startMs < segs[i - 1].startMs) return null;
  }
  const lastEnd = segs[segs.length - 1].endMs;
  if (lastEnd < verse.timestampTo - MAX_TAIL_GAP_MS) return null;
  if (lastEnd > verse.timestampTo + MAX_TAIL_OVERRUN_MS) return null;
  // The file starts at timestampFrom, so only the first word can start before it (it is clamped to 0).
  // A second word starting there too means the verse is shifted early: word 1 would never light up.
  if (segs.length > 1 && segs[1].startMs <= verse.timestampFrom) return null;

  const timeline: AyahWordTiming[] = [];
  for (const s of segs) {
    if (s.wordPosition < 1 || s.wordPosition > wordCount) continue;
    timeline.push({
      wordIndex: s.wordPosition - 1,
      startMs: Math.max(0, s.startMs - verse.timestampFrom),
      endMs: Math.max(0, s.endMs - verse.timestampFrom),
    });
  }
  return timeline.length > 0 ? timeline : null;
}

/**
 * Index of the word being recited at `timeMs` (ayah-relative): the last timeline
 * entry that has started. Gaps keep the previous word; repeats re-activate it.
 * Returns -1 before the first word starts.
 */
export function findActiveWordIndex(timeline: AyahWordTiming[], timeMs: number): number {
  let active = -1;
  for (const t of timeline) {
    if (t.startMs > timeMs) break;
    active = t.wordIndex;
  }
  return active;
}
