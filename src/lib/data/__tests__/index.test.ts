/**
 * Tests for the data layer (getAllSurahs, getSurahByNumber, getReciters).
 * Mocks the API client to return fixture data so tests don't require a running server.
 */
import { describe, it, expect, vi } from "vitest";
import {
  getAllSurahs,
  getSurahByNumber,
  getAyahsBySurahNumber,
  getReciters,
} from "../index";
import type { SurahSummary, SurahDetail, Reciter } from "@/types/quran";

import surahsJson from "@/data/surahs.json";
import recitersJson from "@/data/reciters.json";

const surahsFixture = surahsJson as SurahSummary[];
const recitersFixture = recitersJson as Reciter[];

const surah1Detail: SurahDetail = {
  surah: surahsFixture[0],
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
      tajwidSegments: [{ text: "بِسْمِ ", rule: "normal" }],
      audio: { reciterId: "mishary-alafasy", url: "/audio/mishary-alafasy/001001.mp3", durationMs: 0 },
    },
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `1:${i + 2}`,
      ayahNumber: i + 2,
      ayahNumberGlobal: i + 2,
      juz: 1,
      page: 1,
      arabicText: "",
      transliteration: "",
      translationBosnian: "",
      tajwidSegments: [] as { text: string; rule: string }[],
      audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
    })),
  ],
};

const surah2Detail: SurahDetail = {
  surah: surahsFixture[1],
  ayahs: Array.from({ length: 286 }, (_, i) => ({
    id: `2:${i + 1}`,
    ayahNumber: i + 1,
    ayahNumberGlobal: 8 + i,
    juz: 1,
    page: 2,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  })),
};

const surah112Detail: SurahDetail = {
  surah: surahsFixture[111],
  ayahs: [
    { id: "112:1", ayahNumber: 1, ayahNumberGlobal: 6222, juz: 30, page: 604, arabicText: "", transliteration: "", translationBosnian: "", tajwidSegments: [], audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 } },
    { id: "112:2", ayahNumber: 2, ayahNumberGlobal: 6223, juz: 30, page: 604, arabicText: "", transliteration: "", translationBosnian: "", tajwidSegments: [], audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 } },
    { id: "112:3", ayahNumber: 3, ayahNumberGlobal: 6224, juz: 30, page: 604, arabicText: "", transliteration: "", translationBosnian: "", tajwidSegments: [], audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 } },
    { id: "112:4", ayahNumber: 4, ayahNumberGlobal: 6225, juz: 30, page: 604, arabicText: "", transliteration: "", translationBosnian: "", tajwidSegments: [], audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 } },
  ],
};

const surah113Detail: SurahDetail = {
  surah: surahsFixture[112],
  ayahs: Array.from({ length: 5 }, (_, i) => ({
    id: `113:${i + 1}`,
    ayahNumber: i + 1,
    ayahNumberGlobal: 6226 + i,
    juz: 30,
    page: 604,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  })),
};

const surah114Detail: SurahDetail = {
  surah: surahsFixture[113],
  ayahs: Array.from({ length: 6 }, (_, i) => ({
    id: `114:${i + 1}`,
    ayahNumber: i + 1,
    ayahNumberGlobal: 6231 + i,
    juz: 30,
    page: 604,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  })),
};

vi.mock("@/lib/api/client", () => ({
  fetchSurahs: vi.fn(() => Promise.resolve(surahsFixture)),
  fetchSurahDetail: vi.fn((n: number) => {
    if (n === 1) return Promise.resolve(surah1Detail);
    if (n === 2) return Promise.resolve(surah2Detail);
    if (n === 112) return Promise.resolve(surah112Detail);
    if (n === 113) return Promise.resolve(surah113Detail);
    if (n === 114) return Promise.resolve(surah114Detail);
    return Promise.resolve({ surah: surahsFixture[n - 1], ayahs: [] });
  }),
  fetchReciters: vi.fn(() => Promise.resolve(recitersFixture)),
}));

describe("getAllSurahs", () => {
  it("returns an array of 114 surahs", async () => {
    const surahs = await getAllSurahs();
    expect(surahs).toHaveLength(114);
  });

  it("returns SurahSummary shape for each item", async () => {
    const surahs = await getAllSurahs();
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

  it("returns valid revelationType only (meccan | medinan)", async () => {
    const surahs = await getAllSurahs();
    surahs.forEach((s) => {
      expect(["meccan", "medinan"]).toContain(s.revelationType);
    });
  });

  it("surah numbers are 1 to 114 in order", async () => {
    const surahs = await getAllSurahs();
    surahs.forEach((s, i) => {
      expect(s.surahNumber).toBe(i + 1);
      expect(s.id).toBe(String(i + 1));
    });
  });

  it("last surah is 114 An-Nas (En-Nas)", async () => {
    const surahs = await getAllSurahs();
    const last = surahs[113];
    expect(last).toMatchObject({
      id: "114",
      surahNumber: 114,
      slug: "an-nas",
      nameLatin: "An-Nas",
      nameBosnian: "En-Nas",
      revelationType: "meccan",
      ayahCount: 6,
    });
    expect(last.nameArabic).toBe("الناس");
  });

  it("every surah has non-empty required string fields", async () => {
    const surahs = await getAllSurahs();
    surahs.forEach((s, i) => {
      expect(s.id, `surah ${i + 1} id`).toBeTruthy();
      expect(s.slug, `surah ${i + 1} slug`).toBeTruthy();
      expect(s.nameArabic, `surah ${i + 1} nameArabic`).toBeTruthy();
      expect(s.nameLatin, `surah ${i + 1} nameLatin`).toBeTruthy();
      expect(s.nameBosnian, `surah ${i + 1} nameBosnian`).toBeTruthy();
    });
  });

  it("every surah has positive ayahCount", async () => {
    const surahs = await getAllSurahs();
    surahs.forEach((s, i) => {
      expect(s.ayahCount, `surah ${i + 1} ayahCount`).toBeGreaterThan(0);
      expect(Number.isInteger(s.ayahCount), `surah ${i + 1} ayahCount integer`).toBe(true);
    });
  });

  it("slugs are unique", async () => {
    const surahs = await getAllSurahs();
    const slugs = surahs.map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(114);
  });
});

describe("getSurahByNumber", () => {
  it("returns SurahDetail with surah and ayahs for surah 1", async () => {
    const detail = await getSurahByNumber(1);
    expect(detail).toHaveProperty("surah");
    expect(detail).toHaveProperty("ayahs");
    expect(detail.surah.surahNumber).toBe(1);
    expect(detail.surah.slug).toBe("al-fatiha");
    expect(detail.ayahs).toHaveLength(7);
  });

  it("returns ayahs with required fields for surah 1", async () => {
    const detail = await getSurahByNumber(1);
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

  it("returns SurahDetail with surah and ayahs for surah 2", async () => {
    const detail = await getSurahByNumber(2);
    expect(detail.surah.surahNumber).toBe(2);
    expect(detail.surah.slug).toBe("al-baqarah");
    expect(detail.ayahs).toHaveLength(286);
    expect(detail.ayahs[0].id).toBe("2:1");
  });

  it("returns correct detail for surah 112 (Al-Ikhlas)", async () => {
    const detail = await getSurahByNumber(112);
    expect(detail.surah.slug).toBe("al-ikhlas");
    expect(detail.ayahs).toHaveLength(4);
    expect(detail.ayahs[0].id).toBe("112:1");
  });

  it("surah 112 ayahNumberGlobal is 6222-6225", async () => {
    const detail = await getSurahByNumber(112);
    expect(detail.ayahs[0].ayahNumberGlobal).toBe(6222);
    expect(detail.ayahs[3].ayahNumberGlobal).toBe(6225);
  });

  it("surah 112 last and surah 113 first are consecutive global numbers", async () => {
    const surah112 = await getSurahByNumber(112);
    const surah113 = await getSurahByNumber(113);
    const last112 = surah112.ayahs[surah112.ayahs.length - 1];
    const first113 = surah113.ayahs[0];
    expect(last112.ayahNumberGlobal + 1).toBe(first113.ayahNumberGlobal);
    expect(first113.ayahNumberGlobal).toBe(6226);
  });

  it("returns correct detail for surah 113 and 114", async () => {
    const d113 = await getSurahByNumber(113);
    const d114 = await getSurahByNumber(114);
    expect(d113.ayahs).toHaveLength(5);
    expect(d114.ayahs).toHaveLength(6);
  });
});

describe("getAyahsBySurahNumber", () => {
  it("returns ayahs array for surah 1", async () => {
    const ayahs = await getAyahsBySurahNumber(1);
    expect(ayahs).toHaveLength(7);
    expect(ayahs[0].id).toBe("1:1");
    expect(ayahs[6].id).toBe("1:7");
  });

  it("returns ayahs for surah 2", async () => {
    const ayahs = await getAyahsBySurahNumber(2);
    expect(ayahs).toHaveLength(286);
    expect(ayahs[0].id).toBe("2:1");
  });

  it("returns same ayahs as getSurahByNumber(n).ayahs", async () => {
    const byDetail = (await getSurahByNumber(1)).ayahs;
    const byAyahs = await getAyahsBySurahNumber(1);
    expect(byAyahs).toEqual(byDetail);
  });
});

describe("getReciters", () => {
  it("returns an array of reciters", async () => {
    const reciters = await getReciters();
    expect(Array.isArray(reciters)).toBe(true);
    expect(reciters.length).toBeGreaterThanOrEqual(1);
  });

  it("returns Reciter shape with id, name, arabicName, isDefault", async () => {
    const reciters = await getReciters();
    reciters.forEach((r) => {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("arabicName");
      expect(r).toHaveProperty("isDefault");
      expect(typeof r.isDefault).toBe("boolean");
    });
  });

  it("includes Mishary Alafasy as default", async () => {
    const reciters = await getReciters();
    const mishary = reciters.find((r) => r.id === "mishary-alafasy");
    expect(mishary).toBeDefined();
    expect(mishary?.isDefault).toBe(true);
  });

  it("includes Abdul Basit Abdus Samad", async () => {
    const reciters = await getReciters();
    const abdul = reciters.find((r) => r.id === "abdul-basit-abdus-samad");
    expect(abdul).toBeDefined();
  });
});
