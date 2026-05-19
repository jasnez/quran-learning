/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  searchAyahs,
  normalizeLatin,
  normalizeArabic,
  __resetSearchIndexCacheForTests,
} from "../searchClient";

const mockIndex = [
  {
    surahNumber: 1,
    slug: "al-fatiha",
    nameLatin: "Al-Fatihah",
    nameBosnian: "Al-Fatiha",
    nameArabic: "الفاتحة",
    ayahs: [
      {
        ayahNumber: 1,
        arabicText: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        transliteration: "Bismillāhi r-raḥmāni r-raḥīm",
        translationBosnian: "U ime Allaha, Milostivog, Samilosnog!",
      },
      {
        ayahNumber: 2,
        arabicText: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
        transliteration: "Al-ḥamdu lillāhi rabbi l-ʿālamīn",
        translationBosnian: "Tebe, Allaha, Gospodara svjetova, hvalimo,",
      },
    ],
  },
  {
    surahNumber: 36,
    slug: "ya-sin",
    nameLatin: "Ya-Sin",
    nameBosnian: "Ja-Sin",
    nameArabic: "يس",
    ayahs: [
      {
        ayahNumber: 1,
        arabicText: "يسٓ",
        transliteration: "Yā-Sīn",
        translationBosnian: "Ja-Sin.",
      },
    ],
  },
  {
    surahNumber: 112,
    slug: "al-ikhlas",
    nameLatin: "Al-Ikhlas",
    nameBosnian: "Iskreno vjerovanje",
    nameArabic: "الإخلاص",
    ayahs: [
      {
        ayahNumber: 1,
        arabicText: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
        transliteration: "Qul huwa llāhu aḥad",
        translationBosnian: "Reci: On je Allah – Jedan!",
      },
    ],
  },
];

function stubFetch() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockIndex),
  });
}

describe("normalizeLatin", () => {
  it("strips macrons/circumflex/dots and lowercases", () => {
    expect(normalizeLatin("Allāh")).toBe("allah");
    expect(normalizeLatin("Raḥmān")).toBe("rahman");
    expect(normalizeLatin("Bismillāhi r-raḥīm")).toBe("bismillahi r-rahim");
  });

  it("strips Bosnian diacritics so users searching from mobile keyboards still match", () => {
    // č š ć etc. decompose under NFD into base char + combining mark, which
    // we strip. This is the desired behaviour: typing "ciscenje" (no diacritics)
    // should find "čišćenje" in Bosnian translation.
    expect(normalizeLatin("čišćenje")).toBe("ciscenje");
    expect(normalizeLatin("Mušrik")).toBe("musrik");
  });
});

describe("normalizeArabic", () => {
  it("strips tashkeel and unifies alef variants", () => {
    expect(normalizeArabic("ٱللَّهِ")).toBe("الله");
    expect(normalizeArabic("ٱلرَّحْمَـٰنِ")).toContain("الرحم");
    expect(normalizeArabic("آدم")).toBe("ادم");
    expect(normalizeArabic("إِنَّ")).toBe("ان");
  });

  it("strips tatweel", () => {
    expect(normalizeArabic("الرحـــمن")).toBe("الرحمن");
  });
});

describe("searchAyahs", () => {
  beforeEach(() => {
    __resetSearchIndexCacheForTests();
    stubFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty for blank query", async () => {
    expect(await searchAyahs("")).toEqual([]);
    expect(await searchAyahs("   ")).toEqual([]);
  });

  it("Latin query matches Bosnian translation", async () => {
    const results = await searchAyahs("Milostivog");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].ayahId).toBe("1:1");
  });

  it("matches diacritics-insensitively: Allah ⇄ Allāh", async () => {
    const noDiacritics = await searchAyahs("Allah");
    const withDiacritics = await searchAyahs("Allāh");
    expect(noDiacritics.length).toBeGreaterThan(0);
    expect(withDiacritics.length).toBeGreaterThan(0);
    expect(noDiacritics[0].ayahId).toBe(withDiacritics[0].ayahId);
  });

  it("matches transliteration with macron-stripped query: Rahman → raḥmān", async () => {
    const results = await searchAyahs("Rahman");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.ayahId === "1:1")).toBe(true);
  });

  it("ayah reference '1:2' jumps to exact ayah with top score", async () => {
    const results = await searchAyahs("1:2");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].ayahId).toBe("1:2");
  });

  it("surah name 'Yasin' matches Ya-Sin surah", async () => {
    const results = await searchAyahs("Yasin");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.surahId === "36")).toBe(true);
  });

  it("surah name 'Iskreno' matches Bosnian surah name", async () => {
    const results = await searchAyahs("Iskreno");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.surahId === "112")).toBe(true);
  });

  it("Arabic query strips tashkeel: الله matches ٱللَّهِ", async () => {
    const results = await searchAyahs("الله");
    expect(results.length).toBeGreaterThan(0);
    // Al-Fatiha 1:1 and 112:1 both have "الله" as a standalone word.
    // (1:2 has "لله" with lām prefix, which doesn't match a bare "الله" query.)
    expect(results.some((r) => r.ayahId === "1:1")).toBe(true);
    expect(results.some((r) => r.ayahId === "112:1")).toBe(true);
  });

  it("ranks ayah-reference above content match", async () => {
    const results = await searchAyahs("1:1");
    expect(results[0].ayahId).toBe("1:1");
  });

  it("ranks surah-name match high (Al-Fatiha exact)", async () => {
    const results = await searchAyahs("Al-Fatiha");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].surahId).toBe("1");
  });

  it("returns highlight markup in snippetHighlight", async () => {
    const results = await searchAyahs("Milostivog");
    expect(results[0].snippetHighlight).toContain("<mark>");
    expect(results[0].snippetHighlight).toContain("</mark>");
  });
});
