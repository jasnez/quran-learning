/**
 * Reading and listening count together (Phase 4, D9): an ayah is done when it was read (2 s on
 * screen) or heard. Nothing changes in storage; the union is computed when shown.
 */
import { describe, it, expect } from "vitest";
import { ayahsDone, ayahsDoneCount } from "../ayahsDone";

describe("ayahsDone", () => {
  it("is the union of heard and read ayahs", () => {
    const done = ayahsDone({ ayahsListened: new Set([1, 2]), ayahsRead: new Set([2, 3]) });
    expect([...done].sort()).toEqual([1, 2, 3]);
    expect(ayahsDoneCount({ ayahsListened: new Set([1, 2]), ayahsRead: new Set([2, 3]) })).toBe(3);
  });

  it("is empty for a surah with no progress", () => {
    expect(ayahsDone(undefined).size).toBe(0);
    expect(ayahsDoneCount(undefined)).toBe(0);
  });

  it("counts an entry stored before reading was tracked (no ayahsRead)", () => {
    expect(ayahsDoneCount({ ayahsListened: new Set([4, 5, 6]) })).toBe(3);
  });

  it("counts an entry with only read ayahs", () => {
    expect(ayahsDoneCount({ ayahsRead: [7, 8] })).toBe(2);
  });

  it("accepts the stored arrays as well as the in-memory sets", () => {
    expect(ayahsDoneCount({ ayahsListened: [1, 1, 2], ayahsRead: [2] })).toBe(2);
  });
});
