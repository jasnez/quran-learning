import { describe, it, expect } from "vitest";
import {
  getAllSurahs,
  getSurahByNumber,
  getAyahsBySurahNumber,
  getReciters,
} from "../index";

describe("getAllSurahs", () => {
  it("returns an array of 114 surahs", () => {
    const surahs = getAllSurahs();
    expect(surahs).toHaveLength(114);
  });

  it("returns SurahSummary shape for each item", () => {
    const surahs = getAllSurahs();
    const first = surahs[0];
    expect(first).toMatchObject({
      id: "1",
      surahNumber: 1,
      slug: "al-fatiha",
      nameArabic: "الفاتحة",
      nameLatin: "Al-Fatihah",
      nameBosnian: "Al-Fatiha",
      revelationType: "meccan",
      ayahCount: 7,
    });
  });

  it("returns valid revelationType only (meccan | medinan)", () => {
    const surahs = getAllSurahs();
    surahs.forEach((s) => {
      expect(["meccan", "medinan"]).toContain(s.revelationType);
    });
  });

  it("surah numbers are 1 to 114 in order", () => {
    const surahs = getAllSurahs();
    surahs.forEach((s, i) => {
      expect(s.surahNumber).toBe(i + 1);
      expect(s.id).toBe(String(i + 1));
    });
  });
});

describe("getSurahByNumber", () => {
  it("returns SurahDetail with surah and ayahs for surah 1", () => {
    const detail = getSurahByNumber(1);
    expect(detail).toHaveProperty("surah");
    expect(detail).toHaveProperty("ayahs");
    expect(detail.surah.surahNumber).toBe(1);
    expect(detail.surah.slug).toBe("al-fatiha");
    expect(detail.ayahs).toHaveLength(7);
  });

  it("returns ayahs with required fields for surah 1", () => {
    const detail = getSurahByNumber(1);
    const ayah = detail.ayahs[0];
    expect(ayah).toMatchObject({
      id: "1:1",
      ayahNumber: 1,
      ayahNumberGlobal: 1,
      juz: 1,
      page: 1,
    });
    expect(ayah).toHaveProperty("arabicText");
    expect(ayah).toHaveProperty("transliteration");
    expect(ayah).toHaveProperty("translationBosnian");
    expect(Array.isArray(ayah.tajwidSegments)).toBe(true);
    expect(ayah.audio).toMatchObject({
      reciterId: "mishary-alafasy",
      url: "/audio/mishary-alafasy/001001.mp3",
      durationMs: 0,
    });
  });

  it("returns empty ayahs for surah without detail file (e.g. 2)", () => {
    const detail = getSurahByNumber(2);
    expect(detail.surah.surahNumber).toBe(2);
    expect(detail.ayahs).toEqual([]);
  });

  it("returns correct detail for surah 112 (Al-Ikhlas)", () => {
    const detail = getSurahByNumber(112);
    expect(detail.surah.slug).toBe("al-ikhlas");
    expect(detail.ayahs).toHaveLength(4);
    expect(detail.ayahs[0].id).toBe("112:1");
  });

  it("surah 112 ayahNumberGlobal: 112:1 is 6222 (sum of ayahs 1–111 is 6221)", () => {
    const detail = getSurahByNumber(112);
    expect(detail.ayahs[0].ayahNumberGlobal).toBe(6222);
    expect(detail.ayahs[1].ayahNumberGlobal).toBe(6223);
    expect(detail.ayahs[2].ayahNumberGlobal).toBe(6224);
    expect(detail.ayahs[3].ayahNumberGlobal).toBe(6225);
  });

  it("surah 112 last ayah (112:4) and surah 113 first (113:1) are consecutive global numbers", () => {
    const surah112 = getSurahByNumber(112);
    const surah113 = getSurahByNumber(113);
    const last112 = surah112.ayahs[surah112.ayahs.length - 1];
    const first113 = surah113.ayahs[0];
    expect(last112.ayahNumberGlobal + 1).toBe(first113.ayahNumberGlobal);
    expect(first113.ayahNumberGlobal).toBe(6226);
  });

  it("returns correct detail for surah 113 and 114", () => {
    expect(getSurahByNumber(113).ayahs).toHaveLength(5);
    expect(getSurahByNumber(114).ayahs).toHaveLength(6);
  });
});

describe("getAyahsBySurahNumber", () => {
  it("returns ayahs array for surah 1", () => {
    const ayahs = getAyahsBySurahNumber(1);
    expect(ayahs).toHaveLength(7);
    expect(ayahs[0].id).toBe("1:1");
    expect(ayahs[6].id).toBe("1:7");
  });

  it("returns empty array for surah without detail file", () => {
    const ayahs = getAyahsBySurahNumber(2);
    expect(ayahs).toEqual([]);
  });

  it("returns same ayahs as getSurahByNumber(n).ayahs", () => {
    const byDetail = getSurahByNumber(1).ayahs;
    const byAyahs = getAyahsBySurahNumber(1);
    expect(byAyahs).toEqual(byDetail);
  });
});

describe("getReciters", () => {
  it("returns an array of reciters", () => {
    const reciters = getReciters();
    expect(Array.isArray(reciters)).toBe(true);
    expect(reciters.length).toBeGreaterThanOrEqual(1);
  });

  it("returns Reciter shape with id, name, arabicName, isDefault", () => {
    const reciters = getReciters();
    reciters.forEach((r) => {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("arabicName");
      expect(r).toHaveProperty("isDefault");
      expect(typeof r.isDefault).toBe("boolean");
    });
  });

  it("includes Mishary Alafasy as default", () => {
    const reciters = getReciters();
    const mishary = reciters.find((r) => r.id === "mishary-alafasy");
    expect(mishary).toBeDefined();
    expect(mishary?.isDefault).toBe(true);
  });

  it("includes Abdul Basit Abdus Samad", () => {
    const reciters = getReciters();
    const abdul = reciters.find((r) => r.id === "abdul-basit-abdus-samad");
    expect(abdul).toBeDefined();
  });
});
