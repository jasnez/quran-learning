import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDailyDua } from "../dailyDua";
import { QURANIC_DUAS } from "../data";
import type { QuranicDua } from "@/types/duas";

describe("getDailyDua", () => {
  const singleDua: QuranicDua[] = [
    {
      id: "2:201",
      surahNumber: 2,
      ayahNumber: 201,
      arabic: "رَبَّنَا آتِنَا",
      transliteration: "Rabbana atina",
      translationBosnian: "Gospodaru naš, daj nam",
      category: "rabbana",
    },
  ];

  it("returns one dua from the list", () => {
    const result = getDailyDua(QURANIC_DUAS);
    expect(result).toBeDefined();
    expect(QURANIC_DUAS).toContain(result);
  });

  it("returns the only dua when list has one item", () => {
    const result = getDailyDua(singleDua);
    expect(result).toEqual(singleDua[0]);
  });

  it("same date returns same dua (deterministic)", () => {
    const date = new Date("2025-06-15T12:00:00Z");
    const a = getDailyDua(QURANIC_DUAS, date);
    const b = getDailyDua(QURANIC_DUAS, date);
    expect(a).toEqual(b);
  });

  it("different day of year can return different dua", () => {
    const jan1 = new Date("2025-01-01T12:00:00Z");
    const jan2 = new Date("2025-01-02T12:00:00Z");
    const a = getDailyDua(QURANIC_DUAS, jan1);
    const b = getDailyDua(QURANIC_DUAS, jan2);
    // Day-of-year 0 = Jan 1 UTC, 1 = Jan 2 UTC → index = dayOfYear % length
    const idx0 = 0 % QURANIC_DUAS.length;
    const idx1 = 1 % QURANIC_DUAS.length;
    expect(getDailyDua(QURANIC_DUAS, jan1)).toEqual(QURANIC_DUAS[idx0]);
    expect(getDailyDua(QURANIC_DUAS, jan2)).toEqual(QURANIC_DUAS[idx1]);
  });

  it("when no date given, uses current date (no throw)", () => {
    expect(() => getDailyDua(QURANIC_DUAS)).not.toThrow();
    const result = getDailyDua(QURANIC_DUAS);
    expect(result).toBeDefined();
  });

  it("empty array returns undefined", () => {
    const empty: QuranicDua[] = [];
    const result = getDailyDua(empty);
    expect(result).toBeUndefined();
  });
});
