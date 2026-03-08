/**
 * @vitest-environment node
 */
import { describe, it, expect, afterEach } from "vitest";
import { getSearchIndex, clearSearchIndex } from "../searchIndex";

describe("searchIndex", () => {
  afterEach(() => {
    clearSearchIndex();
  });

  it("returns an array of SurahDetail for all loaded surah data files", () => {
    const index = getSearchIndex();
    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBeGreaterThanOrEqual(1);
    index.forEach((detail) => {
      expect(detail).toHaveProperty("surah");
      expect(detail).toHaveProperty("ayahs");
      expect(detail.surah).toHaveProperty("surahNumber");
      expect(detail.surah).toHaveProperty("nameLatin");
      expect(detail.surah).toHaveProperty("nameArabic");
      expect(detail.surah).toHaveProperty("nameBosnian");
      expect(Array.isArray(detail.ayahs)).toBe(true);
    });
  });

  it("includes surah 1 (Al-Fatiha) when ayah file exists", () => {
    const index = getSearchIndex();
    const fatiha = index.find((d) => d.surah.surahNumber === 1);
    expect(fatiha).toBeDefined();
    expect(fatiha!.surah.slug).toBe("al-fatiha");
    expect(fatiha!.ayahs.length).toBeGreaterThanOrEqual(7);
  });

  it("caches the index in memory (second call returns same data)", () => {
    const first = getSearchIndex();
    const second = getSearchIndex();
    expect(second).toBe(first);
  });

  it("after clear, rebuilds index on next getSearchIndex", () => {
    const first = getSearchIndex();
    clearSearchIndex();
    const second = getSearchIndex();
    expect(Array.isArray(second)).toBe(true);
    expect(second.length).toBe(first.length);
  });
});
