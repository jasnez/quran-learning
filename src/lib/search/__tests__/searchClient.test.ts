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
      {
        // As stored: the IZ BiH "specijal" system, with a letter (U+02BB) for ayn.
        ayahNumber: 5,
        arabicText: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        transliteration: "Ijjāke naʻbudu we ijjāke nesteʻīn",
        translationBosnian: "Tebi se klanjamo i od Tebe pomoć tražimo!",
      },
    ],
  },
  {
    surahNumber: 108,
    slug: "al-kawthar",
    nameLatin: "Al-Kawthar",
    nameBosnian: "Mnogo dobro",
    nameArabic: "الكوثر",
    ayahs: [
      {
        // The s of tha carries a combining line below (U+0331).
        ayahNumber: 1,
        arabicText: "إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ",
        transliteration: "Innā eʻṭajnākel-kews̱er",
        translationBosnian: "Mi smo ti, uistinu, mnogo dobro dali,",
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

  it("finds the transliteration when the reader types an apostrophe for ayn: na'budu", async () => {
    const results = await searchAyahs("na'budu");
    expect(results.some((r) => r.ayahId === "1:5")).toBe(true);
  });

  it("marks the whole matched word although the search ignores its signs", async () => {
    const [withAyn] = await searchAyahs("nabudu");
    expect(withAyn.snippetHighlight).toContain("<mark>naʻbudu</mark>");
    const [withLineBelow] = await searchAyahs("kewser");
    expect(withLineBelow.snippetHighlight).toContain("<mark>kews̱er</mark>");
  });

  it("treats the hyphen of the article as a space", async () => {
    const [spaced] = await searchAyahs("etajnakel kewser");
    expect(spaced.ayahId).toBe("108:1");
    expect(spaced.snippetHighlight).toContain("<mark>eʻṭajnākel-kews̱er</mark>");
    const [hyphenated] = await searchAyahs("etajnakel-kewser");
    expect(hyphenated.ayahId).toBe("108:1");
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

  // QA section 7: the page renders snippetHighlight as HTML, so only the <mark> may be markup.
  it("escapes markup in the text around and inside the mark", async () => {
    const ayah = { ...mockIndex[0].ayahs[0], translationBosnian: 'Milostivog <img src=x onerror="alert(1)"> & <b>Samilosnog</b>' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ ...mockIndex[0], ayahs: [ayah] }]),
    });
    const [onText] = await searchAyahs("Milostivog");
    expect(onText.snippetHighlight).toBe(
      '<mark>Milostivog</mark> &lt;img src=x onerror="alert(1)"&gt; &amp; &lt;b&gt;Samilosnog&lt;/b&gt;',
    );
    const [onMarkup] = await searchAyahs("<b>Samilosnog");
    expect(onMarkup.snippetHighlight).toContain("<mark>&lt;b&gt;Samilosnog</mark>");
  });

  // QA P2-5: positions found in the text without harakat were applied to the original, so the
  // mark cut a word in two ("ٱلرَّح" + "ْمَـٰنِ").
  describe("Arabic highlight", () => {
    const basmala = mockIndex[0].ayahs[0].arabicText;
    const rahman = basmala.split(" ")[2];

    it("marks the whole word when the query has no harakat", async () => {
      const [first] = await searchAyahs(normalizeArabic(rahman));
      expect(first.ayahId).toBe("1:1");
      expect(first.snippetHighlight).toContain(`<mark>${rahman}</mark>`);
    });

    it("marks the whole word when the query is typed with harakat", async () => {
      const [first] = await searchAyahs(rahman);
      expect(first.snippetHighlight).toContain(`<mark>${rahman}</mark>`);
    });

    it("marks the whole word when the query is only part of it", async () => {
      // "رحم" lies inside "الرحمن": a mark inside a word would break the joined letters.
      const [first] = await searchAyahs(normalizeArabic(rahman).slice(2, 5));
      expect(first.snippetHighlight).toContain(`<mark>${rahman}</mark>`);
    });

    it("keeps the marked Arabic when the query is also the surah's name", async () => {
      const yasin = mockIndex[2].ayahs[0].arabicText;
      const [first] = await searchAyahs(normalizeArabic(yasin));
      expect(first.ayahId).toBe("36:1");
      expect(first.snippetScript).toBe("arabic");
      expect(first.snippetHighlight).toBe(`<mark>${yasin}</mark>`);
    });

    it("says which script the snippet is in, so the page can render it right to left", async () => {
      const [arabic] = await searchAyahs(rahman);
      expect(arabic.snippetScript).toBe("arabic");
      const [latin] = await searchAyahs("Milostivog");
      expect(latin.snippetScript).toBe("latin");
    });
  });
});

describe("searchAyahs on long ayahs", () => {
  const word = mockIndex[0].ayahs[0].arabicText.split(" ")[1];
  const target = mockIndex[0].ayahs[0].arabicText.split(" ")[2];
  const filler = mockIndex[0].ayahs[1].arabicText.split(" ");
  // A long ayah: 40 words before the target word and 40 after.
  const words = [
    ...Array.from({ length: 40 }, (_, i) => filler[i % filler.length]),
    target,
    ...Array.from({ length: 40 }, () => word),
  ];
  const longAyah = words.join(" ");

  beforeEach(() => {
    __resetSearchIndexCacheForTests();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            surahNumber: 2,
            slug: "al-baqarah",
            nameLatin: "Al-Baqarah",
            nameBosnian: "Krava",
            nameArabic: "البقرة",
            ayahs: [
              {
                ayahNumber: 1,
                arabicText: longAyah,
                transliteration: "Elif-lām-mīm",
                translationBosnian: "Elif-lam-mim.",
              },
            ],
          },
        ]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Every piece between the ellipses is a whole word of the ayah, so no word is cut. */
  function expectWholeWords(snippet: string) {
    const pieces = snippet
      .replace(/<\/?mark>/g, "")
      .split(" ")
      .filter((piece) => piece !== "…");
    for (const piece of pieces) expect(words).toContain(piece);
  }

  it("cuts the Arabic snippet around the match only between words, with an ellipsis", async () => {
    const [result] = await searchAyahs(normalizeArabic(target));
    expect(result.snippetHighlight).toContain(`<mark>${target}</mark>`);
    expect(result.snippetHighlight.startsWith("… ")).toBe(true);
    expect(result.snippetHighlight.endsWith(" …")).toBe(true);
    expectWholeWords(result.snippetHighlight);
    expectWholeWords(result.snippet);
  });

  it("cuts the Arabic preview under a Latin match only between words", async () => {
    const [result] = await searchAyahs("Elif-lam-mim");
    expect(result.snippetScript).toBe("latin");
    expect(result.arabicSnippet.endsWith(" …")).toBe(true);
    expectWholeWords(result.arabicSnippet);
  });
});

describe("searchAyahs Latin snippets", () => {
  // A long translation: the match sits in the middle, far from both ends.
  const before = Array.from({ length: 20 }, (_, i) => `prije${i}`);
  const after = Array.from({ length: 20 }, (_, i) => `poslije${i}`);
  const translation = [...before, "Milostivog,", ...after].join(" ");
  const words = translation.split(" ");

  beforeEach(() => {
    __resetSearchIndexCacheForTests();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            surahNumber: 2,
            slug: "al-baqarah",
            nameLatin: "Al-Baqarah",
            nameBosnian: "Krava",
            nameArabic: "البقرة",
            ayahs: [
              {
                ayahNumber: 163,
                arabicText: mockIndex[0].ayahs[0].arabicText,
                transliteration: "We ilāhukum",
                translationBosnian: translation,
              },
            ],
          },
        ]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // QA P2-5 follow-up: the window was cut at character positions ("og! Nema boga ...").
  it("cuts the snippet only between words, with an ellipsis where words are left out", async () => {
    const [result] = await searchAyahs("Milostivog");
    expect(result.snippetHighlight).toContain("<mark>Milostivog</mark>,");
    expect(result.snippetHighlight.startsWith("… ")).toBe(true);
    expect(result.snippetHighlight.endsWith(" …")).toBe(true);
    for (const piece of result.snippet.split(" ").filter((p) => p !== "…")) {
      expect(words).toContain(piece);
    }
  });

  it("marks only the matched letters of a Latin word", async () => {
    const [result] = await searchAyahs("Milostiv");
    expect(result.snippetHighlight).toContain("<mark>Milostiv</mark>og,");
  });
});

describe("searchAyahs result count", () => {
  beforeEach(() => {
    __resetSearchIndexCacheForTests();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            surahNumber: 2,
            slug: "al-baqarah",
            nameLatin: "Al-Baqarah",
            nameBosnian: "Krava",
            nameArabic: "البقرة",
            ayahs: Array.from({ length: 120 }, (_, i) => ({
              ayahNumber: i + 1,
              arabicText: mockIndex[0].ayahs[0].arabicText,
              transliteration: "Bismillāhi",
              translationBosnian: "U ime Allaha",
            })),
          },
        ]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // QA P2-5: results stopped at 50 with no total; the page now shows them 50 at a time.
  it("returns every match, not only the first 50", async () => {
    const results = await searchAyahs("Allaha");
    expect(results).toHaveLength(120);
  });
});
