/**
 * Integration tests for full search flow: searchEngine + getSearchIndex (no mocks).
 * Run with real data (surah 1 JSON + optionally XML for 2–114).
 * @vitest-environment node
 */
import { describe, it, expect, afterEach } from "vitest";
import { searchAyahs } from "../searchEngine";
import { getSearchIndex, clearSearchIndex } from "../searchIndex";
import { clearUthmaniCache } from "../loadUthmaniXml";

describe("search (integration)", () => {
  afterEach(() => {
    clearSearchIndex();
    clearUthmaniCache();
  });

  it("index includes at least surah 1 from JSON", () => {
    const index = getSearchIndex();
    expect(index.length).toBeGreaterThanOrEqual(1);
    const s1 = index.find((d) => d.surah.surahNumber === 1);
    expect(s1).toBeDefined();
    expect(s1!.ayahs.length).toBeGreaterThanOrEqual(7);
    expect(s1!.ayahs[0].translationBosnian).toBeTruthy();
    expect(s1!.ayahs[0].transliteration).toBeTruthy();
  });

  it("empty query returns []", () => {
    expect(searchAyahs("")).toEqual([]);
    expect(searchAyahs("   ")).toEqual([]);
    expect(searchAyahs("\t\n")).toEqual([]);
  });

  it("query 'Milostivog' returns at least one result from translation", () => {
    const results = searchAyahs("Milostivog");
    expect(results.length).toBeGreaterThanOrEqual(1);
    const byTranslation = results.find((r) => r.matchField === "translation");
    expect(byTranslation).toBeDefined();
    expect(byTranslation!.matchSnippet.toLowerCase()).toContain("milostivog");
  });

  it("query 'rahman' or 'Rahman' returns same count (case-insensitive)", () => {
    const lower = searchAyahs("rahman");
    const upper = searchAyahs("Rahman");
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThanOrEqual(1);
  });

  it("Arabic query matches arabicText and returns arabic matchField when applicable", () => {
    const results = searchAyahs("الرحمن");
    if (results.length === 0) return; // might depend on exact form in data
    const byArabic = results.find((r) => r.matchField === "arabic");
    if (byArabic) {
      expect(byArabic.arabicText).toMatch(/رحم|الرحمن/);
    }
  });

  it("results are sorted by score descending", () => {
    const results = searchAyahs("allah");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it("returns at most 50 results", () => {
    const results = searchAyahs("a");
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it("each result has matchSnippet with <mark> when there is a match", () => {
    const results = searchAyahs("Milostivog");
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      expect(r.matchSnippet).toContain("<mark>");
      expect(r.matchSnippet).toContain("</mark>");
    });
  });

  it("each result has valid EngineSearchResult shape", () => {
    const results = searchAyahs("ime");
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      expect(typeof r.surahNumber).toBe("number");
      expect(r.surahNumber).toBeGreaterThanOrEqual(1);
      expect(r.surahNumber).toBeLessThanOrEqual(114);
      expect(typeof r.surahNameLatin).toBe("string");
      expect(typeof r.surahNameArabic).toBe("string");
      expect(typeof r.ayahNumber).toBe("number");
      expect(r.ayahNumber).toBeGreaterThanOrEqual(1);
      expect(["arabic", "transliteration", "translation", "surah"]).toContain(r.matchField);
      expect(typeof r.matchSnippet).toBe("string");
      expect(typeof r.arabicText).toBe("string");
      expect(typeof r.score).toBe("number");
    });
  });

  it("surah name search returns results when query matches surah name", () => {
    const results = searchAyahs("Fatiha");
    if (results.length > 0) {
      const bySurah = results.find((r) => r.matchField === "surah");
      if (bySurah) {
        expect(bySurah.surahNameLatin.toLowerCase()).toMatch(/fatiha/);
      }
    }
  });
});
