import { describe, it, expect } from "vitest";
import { QURANIC_DUAS, getDuasByCategory, DUAS_BY_CATEGORY } from "../data";
import { AYAH_COUNT_PER_SURAH } from "@/lib/quran/constants";
import { fetchVerseContentByKey } from "@/lib/quran/fetch-verse-by-key";
import type { DuaCategory } from "@/types/duas";

const VALID_CATEGORIES: DuaCategory[] = [
  "forgiveness",
  "knowledge",
  "guidance",
  "patience",
  "family",
  "rabbana",
];

describe("QURANIC_DUAS data", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(QURANIC_DUAS)).toBe(true);
    expect(QURANIC_DUAS.length).toBeGreaterThan(0);
  });

  it("each item has required fields: id, surahNumber, ayahNumber, arabic, transliteration, translationBosnian, category", () => {
    QURANIC_DUAS.forEach((dua, i) => {
      expect(dua, `dua ${i}`).toHaveProperty("id");
      expect(dua, `dua ${i}`).toHaveProperty("surahNumber");
      expect(dua, `dua ${i}`).toHaveProperty("ayahNumber");
      expect(dua, `dua ${i}`).toHaveProperty("arabic");
      expect(dua, `dua ${i}`).toHaveProperty("transliteration");
      expect(dua, `dua ${i}`).toHaveProperty("translationBosnian");
      expect(dua, `dua ${i}`).toHaveProperty("category");
      expect(typeof dua.id).toBe("string");
      expect(dua.id.length).toBeGreaterThan(0);
      expect(Number.isInteger(dua.surahNumber)).toBe(true);
      expect(Number.isInteger(dua.ayahNumber)).toBe(true);
      expect(typeof dua.arabic).toBe("string");
      expect(typeof dua.transliteration).toBe("string");
      expect(typeof dua.translationBosnian).toBe("string");
    });
  });

  it("each dua has valid category", () => {
    QURANIC_DUAS.forEach((dua) => {
      expect(VALID_CATEGORIES).toContain(dua.category);
    });
  });

  it("surahNumber is between 1 and 114", () => {
    QURANIC_DUAS.forEach((dua) => {
      expect(dua.surahNumber).toBeGreaterThanOrEqual(1);
      expect(dua.surahNumber).toBeLessThanOrEqual(114);
    });
  });

  it("ayahNumber is within surah ayah count", () => {
    QURANIC_DUAS.forEach((dua) => {
      const maxAyah = AYAH_COUNT_PER_SURAH[dua.surahNumber - 1];
      expect(dua.ayahNumber).toBeGreaterThanOrEqual(1);
      expect(dua.ayahNumber).toBeLessThanOrEqual(maxAyah);
    });
  });

  it("ids are unique", () => {
    const ids = QURANIC_DUAS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("id format is surah:ayah", () => {
    QURANIC_DUAS.forEach((dua) => {
      expect(dua.id).toBe(`${dua.surahNumber}:${dua.ayahNumber}`);
    });
  });

  it("each dua translationBosnian matches Besim Korkut translation from Quran.com API (sura/verse)", async () => {
    for (const dua of QURANIC_DUAS) {
      const content = await fetchVerseContentByKey(dua.id);
      expect(
        dua.translationBosnian,
        `Dua ${dua.id} translation should match API (Besim Korkut). Run: npx tsx scripts/sync-dua-translations.ts`
      ).toBe(content.translationBosnian);
    }
  }, 60000);
});

describe("getDuasByCategory", () => {
  it("returns only duas of the given category", () => {
    VALID_CATEGORIES.forEach((cat) => {
      const list = getDuasByCategory(cat);
      list.forEach((dua) => expect(dua.category).toBe(cat));
    });
  });

  it("returns array (possibly empty) for each category", () => {
    VALID_CATEGORIES.forEach((cat) => {
      const list = getDuasByCategory(cat);
      expect(Array.isArray(list)).toBe(true);
    });
  });
});

describe("DUAS_BY_CATEGORY", () => {
  it("has all valid categories as keys", () => {
    VALID_CATEGORIES.forEach((cat) => {
      expect(DUAS_BY_CATEGORY).toHaveProperty(cat);
      expect(Array.isArray(DUAS_BY_CATEGORY[cat])).toBe(true);
    });
  });

  it("each category array matches getDuasByCategory", () => {
    VALID_CATEGORIES.forEach((cat) => {
      expect(DUAS_BY_CATEGORY[cat]).toEqual(getDuasByCategory(cat));
    });
  });
});
