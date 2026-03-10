/**
 * Tests for Juz utilities (getAllJuz, getJuzByNumber, getJuzForAyah, getSurahsInJuz, getJuzProgress).
 */
import { describe, it, expect } from "vitest";
import { getAllJuz, getJuzByNumber, getJuzForAyah, getSurahsInJuz, getJuzProgress } from "../juzUtils";
import type { SurahSummary } from "@/types/quran";

describe("juzUtils", () => {
  const list = getAllJuz();

  describe("getAllJuz", () => {
    it("returns 30 juz", () => {
      expect(list).toHaveLength(30);
    });

    it("each juz has parsed startSurah, startAyah, endSurah, endAyah and surahsIncluded", () => {
      for (const j of list) {
        expect(j.juz).toBeGreaterThanOrEqual(1);
        expect(j.juz).toBeLessThanOrEqual(30);
        expect(typeof j.startSurah).toBe("number");
        expect(typeof j.startAyah).toBe("number");
        expect(typeof j.endSurah).toBe("number");
        expect(typeof j.endAyah).toBe("number");
        expect(Array.isArray(j.surahsIncluded)).toBe(true);
        expect(j.surahsIncluded.length).toBeGreaterThanOrEqual(1);
        expect(j.surahsIncluded[0]).toBe(j.startSurah);
        expect(j.surahsIncluded[j.surahsIncluded.length - 1]).toBe(j.endSurah);
      }
    });

    it("juz 1 starts at 1:1 and ends at 2:141", () => {
      const j1 = list.find((j) => j.juz === 1)!;
      expect(j1.startSurah).toBe(1);
      expect(j1.startAyah).toBe(1);
      expect(j1.endSurah).toBe(2);
      expect(j1.endAyah).toBe(141);
      expect(j1.surahsIncluded).toEqual([1, 2]);
    });

    it("juz 30 ends at 114:6", () => {
      const j30 = list.find((j) => j.juz === 30)!;
      expect(j30.endSurah).toBe(114);
      expect(j30.endAyah).toBe(6);
    });
  });

  describe("getJuzByNumber", () => {
    it("returns juz 1 for 1", () => {
      const j = getJuzByNumber(1);
      expect(j).toBeDefined();
      expect(j!.juz).toBe(1);
      expect(j!.name).toBe("Alif Lam Mim");
      expect(j!.nameArabic).toBe("الم");
    });

    it("returns juz 30 for 30", () => {
      const j = getJuzByNumber(30);
      expect(j).toBeDefined();
      expect(j!.juz).toBe(30);
      expect(j!.name).toBe("Amma Yatasa'alun");
    });

    it("returns undefined for 0 or 31", () => {
      expect(getJuzByNumber(0)).toBeUndefined();
      expect(getJuzByNumber(31)).toBeUndefined();
    });
  });

  describe("getJuzForAyah", () => {
    it("returns 1 for 1:1 and 1:7", () => {
      expect(getJuzForAyah(1, 1)).toBe(1);
      expect(getJuzForAyah(1, 7)).toBe(1);
    });

    it("returns 1 for 2:141", () => {
      expect(getJuzForAyah(2, 141)).toBe(1);
    });

    it("returns 2 for 2:142", () => {
      expect(getJuzForAyah(2, 142)).toBe(2);
    });

    it("returns 30 for 114:6", () => {
      expect(getJuzForAyah(114, 6)).toBe(30);
    });

    it("returns undefined for out-of-range", () => {
      expect(getJuzForAyah(0, 1)).toBeUndefined();
      expect(getJuzForAyah(115, 1)).toBeUndefined();
    });
  });

  describe("getSurahsInJuz", () => {
    const allSurahs: SurahSummary[] = [
      { id: "1", surahNumber: 1, slug: "al-fatiha", nameArabic: "الفاتحة", nameLatin: "Al-Fatiha", nameBosnian: "El-Fatiha", revelationType: "meccan", ayahCount: 7 },
      { id: "2", surahNumber: 2, slug: "al-baqarah", nameArabic: "البقرة", nameLatin: "Al-Baqarah", nameBosnian: "El-Bekare", revelationType: "medinan", ayahCount: 286 },
    ];

    it("returns surahs that appear in juz 1", () => {
      const surahs = getSurahsInJuz(1, allSurahs);
      expect(surahs.map((s) => s.surahNumber)).toEqual([1, 2]);
    });

    it("returns empty for invalid juz number", () => {
      expect(getSurahsInJuz(99, allSurahs)).toEqual([]);
    });
  });

  describe("getJuzProgress", () => {
    const allSurahs: SurahSummary[] = [
      { id: "1", surahNumber: 1, slug: "al-fatiha", nameArabic: "الفاتحة", nameLatin: "Al-Fatiha", nameBosnian: "El-Fatiha", revelationType: "meccan", ayahCount: 7 },
      { id: "2", surahNumber: 2, slug: "al-baqarah", nameArabic: "البقرة", nameLatin: "Al-Baqarah", nameBosnian: "El-Bekare", revelationType: "medinan", ayahCount: 286 },
    ];

    it("returns totalAyahs for juz 1 (7 + 141 = 148) when allSurahs provided", () => {
      const r = getJuzProgress(1, undefined, allSurahs);
      expect(r.totalAyahs).toBe(148);
      expect(r.listened).toBe(0);
      expect(r.percent).toBe(0);
    });

    it("returns listened and percent when getSurahProgress provided", () => {
      const getSurahProgress = (surahNumber: number) => {
        if (surahNumber === 1) return { ayahsListened: new Set([1, 2, 3]) };
        if (surahNumber === 2) return { ayahsListened: new Set([1, 2]) };
        return undefined;
      };
      const r = getJuzProgress(1, getSurahProgress, allSurahs);
      expect(r.totalAyahs).toBe(148);
      expect(r.listened).toBe(5);
      expect(r.percent).toBe(3);
    });

    it("returns zeros for invalid juz", () => {
      const r = getJuzProgress(0, undefined, allSurahs);
      expect(r).toEqual({ totalAyahs: 0, listened: 0, percent: 0 });
    });
  });
});
