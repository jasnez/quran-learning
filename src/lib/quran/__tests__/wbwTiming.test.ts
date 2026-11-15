import { describe, it, expect } from "vitest";
import type { VerseTimestamp } from "@/types/wordByWord";
import { buildAyahWordTimeline, findActiveWordIndex } from "../wbwTiming";

function verse(
  verseKey: string,
  timestampFrom: number,
  timestampTo: number,
  segs: [number, number, number][],
): VerseTimestamp {
  return {
    verseKey,
    timestampFrom,
    timestampTo,
    segments: segs.map(([wordPosition, startMs, endMs]) => ({ wordPosition, startMs, endMs })),
  };
}

// Real data from public/data/chapter-audio/001-al-fatiha.json
const v1_2 = verse("1:2", 6090, 11680, [
  [1, 6025, 7025],
  [2, 7025, 7885],
  [3, 7885, 8515],
  [4, 8515, 11550],
]);

describe("buildAyahWordTimeline", () => {
  it("converts 1:2 to ayah-relative times", () => {
    expect(buildAyahWordTimeline(v1_2, 4)).toEqual([
      { wordIndex: 0, startMs: 0, endMs: 935 },
      { wordIndex: 1, startMs: 935, endMs: 1795 },
      { wordIndex: 2, startMs: 1795, endMs: 2425 },
      { wordIndex: 3, startMs: 2425, endMs: 5460 },
    ]);
  });

  it("keeps repeated words (2:14 style)", () => {
    const v = verse("2:14", 0, 6100, [
      [1, 0, 1000],
      [2, 1000, 2000],
      [3, 2000, 3000],
      [2, 3000, 4000],
      [3, 4000, 5000],
      [4, 5000, 6000],
    ]);
    const timeline = buildAyahWordTimeline(v, 4);
    expect(timeline?.map((t) => t.wordIndex)).toEqual([0, 1, 2, 1, 2, 3]);
  });

  it("returns null for a shifted verse (5:20)", () => {
    const v = verse("5:20", 868030, 900320, [
      [1, 865645, 866405],
      [2, 866405, 867065],
      [3, 867065, 897890],
    ]);
    expect(buildAyahWordTimeline(v, 3)).toBeNull();
  });

  it("returns null for a truncated verse (7:159)", () => {
    const v = verse("7:159", 3694070, 3707710, [
      [1, 3694100, 3695000],
      [2, 3695000, 3699750],
    ]);
    expect(buildAyahWordTimeline(v, 2)).toBeNull();
  });

  it("clamps only the first word when it starts far too early (6:93)", () => {
    const v = verse("6:93", 2209650, 2211400, [
      [1, 2187736, 2210440],
      [2, 2210440, 2211342],
    ]);
    expect(buildAyahWordTimeline(v, 2)?.[0]).toEqual({ wordIndex: 0, startMs: 0, endMs: 790 });
  });

  it("returns null when the first two words both start too early", () => {
    const v = verse("x:1", 10000, 13000, [
      [1, 9000, 9600],
      [2, 9600, 12000],
      [3, 12000, 12900],
    ]);
    expect(buildAyahWordTimeline(v, 3)).toBeNull();
  });

  // 3:6-like: word 1 is 545 ms and word 2 is 65 ms before the cut; both would clamp to 0,
  // so word 1 would never light up and the verse would run early.
  it("returns null when the second word also starts at or before the verse start", () => {
    const v = verse("3:6", 10000, 14000, [
      [1, 9455, 9935],
      [2, 9935, 11000],
      [3, 11000, 13800],
    ]);
    expect(buildAyahWordTimeline(v, 3)).toBeNull();
  });

  it("returns null for non-monotonic segments", () => {
    const v = verse("x:1", 0, 3100, [
      [1, 0, 1000],
      [2, 2000, 3000],
      [3, 1000, 2000],
    ]);
    expect(buildAyahWordTimeline(v, 3)).toBeNull();
  });

  it("returns null for empty segments", () => {
    expect(buildAyahWordTimeline(verse("x:1", 0, 1000, []), 3)).toBeNull();
  });

  it("drops positions beyond wordCount", () => {
    const v = verse("x:1", 0, 3100, [
      [1, 0, 1000],
      [2, 1000, 2000],
      [3, 2000, 3000],
    ]);
    expect(buildAyahWordTimeline(v, 2)?.map((t) => t.wordIndex)).toEqual([0, 1]);
  });
});

describe("findActiveWordIndex", () => {
  const gapped = [
    { wordIndex: 0, startMs: 100, endMs: 500 },
    { wordIndex: 1, startMs: 600, endMs: 900 },
    { wordIndex: 2, startMs: 900, endMs: 1500 },
  ];

  it("returns -1 before the first word starts", () => {
    expect(findActiveWordIndex(gapped, 50)).toBe(-1);
  });

  it("returns the word containing the time", () => {
    expect(findActiveWordIndex(gapped, 700)).toBe(1);
  });

  it("keeps the previous word in a gap", () => {
    expect(findActiveWordIndex(gapped, 550)).toBe(0);
  });

  it("stays on the last word after it ends", () => {
    expect(findActiveWordIndex(gapped, 4000)).toBe(2);
  });

  it("re-activates a repeated word", () => {
    const repeat = [
      { wordIndex: 0, startMs: 0, endMs: 1000 },
      { wordIndex: 1, startMs: 1000, endMs: 2000 },
      { wordIndex: 2, startMs: 2000, endMs: 3000 },
      { wordIndex: 1, startMs: 3000, endMs: 4000 },
    ];
    expect(findActiveWordIndex(repeat, 3500)).toBe(1);
  });
});
