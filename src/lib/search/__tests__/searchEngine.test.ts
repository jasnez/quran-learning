/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchAyahs } from "../searchEngine";
import type { SurahDetail } from "@/types/quran";
import * as searchIndex from "../searchIndex";

const mockSurah1: SurahDetail = {
  surah: {
    id: "1",
    surahNumber: 1,
    slug: "al-fatiha",
    nameArabic: "الفاتحة",
    nameLatin: "Al-Fatihah",
    nameBosnian: "Al-Fatiha",
    revelationType: "meccan",
    ayahCount: 7,
  },
  ayahs: [
    {
      id: "1:1",
      ayahNumber: 1,
      ayahNumberGlobal: 1,
      juz: 1,
      page: 1,
      arabicText: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
      transliteration: "Bismi Allahi arrahmani arraheem",
      translationBosnian: "U ime Allaha, Milostivog, Samilosnog!",
      tajwidSegments: [],
      audio: { reciterId: "x", url: "/a.mp3", durationMs: 0 },
    },
    {
      id: "1:3",
      ayahNumber: 3,
      ayahNumberGlobal: 3,
      juz: 1,
      page: 1,
      arabicText: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
      transliteration: "Arrahmani arraheem",
      translationBosnian: "Milostivog, Samilosnog,",
      tajwidSegments: [],
      audio: { reciterId: "x", url: "/a.mp3", durationMs: 0 },
    },
  ],
};

vi.mock("../searchIndex", () => ({
  getSearchIndex: vi.fn(() => [mockSurah1]),
  clearSearchIndex: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(searchIndex.getSearchIndex).mockReturnValue([mockSurah1]);
});

describe("searchEngine", () => {
  it("returns empty array for empty or whitespace query", () => {
    expect(searchAyahs("")).toEqual([]);
    expect(searchAyahs("   ")).toEqual([]);
  });

  it("searchAyahs('rahman') returns ayahs containing 'rahman' in any field", () => {
    const results = searchAyahs("rahman");
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      expect(r).toMatchObject({
        surahNumber: 1,
        surahNameLatin: "Al-Fatihah",
        surahNameArabic: "الفاتحة",
      });
      expect(
        [r.arabicText, r.matchSnippet.toLowerCase()].some((t) =>
          t.includes("rahman")
        ) || r.matchField === "surah"
      ).toBe(true);
    });
  });

  it("searchAyahs with Arabic substring returns results by Arabic text", () => {
    const results = searchAyahs("ٱلرَّحْمَـٰنِ");
    expect(results.length).toBeGreaterThanOrEqual(1);
    const byArabic = results.find((r) => r.matchField === "arabic");
    expect(byArabic).toBeDefined();
    expect(byArabic!.arabicText).toMatch(/الرَّحْمَـٰنِ|الرحمن|ٱلرَّحْمَـٰنِ/);
  });

  it("searchAyahs('Milostivog') returns results from Bosnian translation", () => {
    const results = searchAyahs("Milostivog");
    expect(results.length).toBeGreaterThanOrEqual(1);
    const byTranslation = results.find((r) => r.matchField === "translation");
    expect(byTranslation).toBeDefined();
    expect(byTranslation!.matchSnippet.toLowerCase()).toMatch(/milostivog/);
  });

  it("results are sorted by score descending", () => {
    const results = searchAyahs("rahman");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it("returns at most 50 results", () => {
    const results = searchAyahs("a");
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it("matchSnippet contains ~60 chars around match and a <mark> for highlight", () => {
    const results = searchAyahs("Milostivog");
    expect(results.length).toBeGreaterThanOrEqual(1);
    const r = results[0];
    expect(r.matchSnippet).toContain("<mark>");
    expect(r.matchSnippet).toContain("</mark>");
    expect(r.matchSnippet.length).toBeLessThanOrEqual(100);
  });

  it("search is case-insensitive for Latin text", () => {
    const lower = searchAyahs("milostivog");
    const upper = searchAyahs("MILOSTIVOG");
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThanOrEqual(1);
  });

  it("each result has required EngineSearchResult shape", () => {
    const results = searchAyahs("rahman");
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      expect(typeof r.surahNumber).toBe("number");
      expect(typeof r.surahNameLatin).toBe("string");
      expect(typeof r.surahNameArabic).toBe("string");
      expect(typeof r.ayahNumber).toBe("number");
      expect(["arabic", "transliteration", "translation", "surah"]).toContain(
        r.matchField
      );
      expect(typeof r.matchSnippet).toBe("string");
      expect(typeof r.arabicText).toBe("string");
      expect(typeof r.score).toBe("number");
    });
  });
});
