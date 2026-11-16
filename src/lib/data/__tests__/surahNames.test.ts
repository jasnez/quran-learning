/**
 * Surah names from the IZ BiH Pravila transkripcije i transliteracije (2022),
 * "Nazivi kur'anskih sura": nameLatin is the "specijal" form, nameBosnian the common one.
 * @vitest-environment node
 */
import * as fs from "fs";
import * as path from "path";
import { describe, it, expect } from "vitest";
import surahs from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { AYN_SIGN, HAMZA_SIGN } from "@/lib/quran/transliteration";

const SURAHS = surahs as SurahSummary[];
const LINE_BELOW = String.fromCodePoint(0x0331);
/** ASCII and typographic apostrophes and quotes: the names use the letters for ayn and hamza instead. */
const STRAY_APOSTROPHES = new RegExp(`[${String.fromCodePoint(0x27, 0x60, 0x2018, 0x2019)}]`);

describe("surah names (Pravila 2022)", () => {
  it("all 114 surahs have a non-empty, unique nameLatin and nameBosnian", () => {
    expect(SURAHS).toHaveLength(114);
    for (const s of SURAHS) {
      expect(s.nameLatin.trim(), `surah ${s.surahNumber}`).not.toBe("");
      expect(s.nameBosnian.trim(), `surah ${s.surahNumber}`).not.toBe("");
    }
    expect(new Set(SURAHS.map((s) => s.nameLatin)).size).toBe(114);
    expect(new Set(SURAHS.map((s) => s.nameBosnian)).size).toBe(114);
  });

  it("names are NFC and write ayn and hamza with the transliteration's letters", () => {
    for (const s of SURAHS) {
      for (const name of [s.nameLatin, s.nameBosnian]) {
        expect(name, `surah ${s.surahNumber}`).toBe(name.normalize("NFC"));
        expect(name, `surah ${s.surahNumber}`).not.toMatch(STRAY_APOSTROPHES);
      }
    }
  });

  it.each([
    [1, "El-Fātiḥa", "Fatiha"],
    [2, "El-Beqare", "Bekara"],
    [3, `Ālu ${AYN_SIGN}Imrān`, "Ali Imran"],
    [9, "Et-Tewbe", "Tevba"],
    [19, "Merjem", "Merjem"],
    [23, `El-Mu${HAMZA_SIGN}minūn`, `Mu${HAMZA_SIGN}minun`],
    [36, "Jā-sīn", "Ja-sin"],
    [45, `El-Džās${LINE_BELOW}ije`, "Džasije"],
    [51, "Eẕ-Ẕārijāt", "Zarijat"],
    [80, `${AYN_SIGN}Abese`, "Abese"],
    [112, "El-Iḫlāṣ", "Ihlas"],
    [114, "En-Nās", "Nas"],
  ])("surah %i is %s / %s", (surahNumber, nameLatin, nameBosnian) => {
    const surah = SURAHS.find((s) => s.surahNumber === surahNumber);
    expect(surah?.nameLatin).toBe(nameLatin);
    expect(surah?.nameBosnian).toBe(nameBosnian);
  });

  // The list in the Pravila deviates from their own rules in four places; these were corrected
  // with the user's confirmation: "Et-Ṭūr" (the article assimilates, as in "Eṭ-Ṭāriq"),
  // "El-Wāqi'a" and "El-Džumu'a" (ayn written with the hamza sign), "El-Eʻalā" (the ayah text
  // of the Pravila has "rabbikel-eʻlā").
  it.each([
    [52, "Eṭ-Ṭūr", "Tur"],
    [56, `El-Wāqi${AYN_SIGN}a`, `Vaki${AYN_SIGN}a`],
    [62, `El-Džumu${AYN_SIGN}a`, "Džuma"],
    [87, `El-E${AYN_SIGN}lā`, `E${AYN_SIGN}la`],
  ])("surah %i is corrected to %s / %s", (surahNumber, nameLatin, nameBosnian) => {
    const surah = SURAHS.find((s) => s.surahNumber === surahNumber);
    expect(surah?.nameLatin).toBe(nameLatin);
    expect(surah?.nameBosnian).toBe(nameBosnian);
  });

  it("keeps the English slugs that URLs and data file names depend on", () => {
    expect(SURAHS[0].slug).toBe("al-fatiha");
    expect(SURAHS[1].slug).toBe("al-baqarah");
    expect(SURAHS[113].slug).toBe("an-nas");
  });

  it("every ayah file embeds the same surah names as surahs.json", () => {
    const dir = path.join(process.cwd(), "src", "data", "ayahs");
    for (const s of SURAHS) {
      const file = path.join(dir, `${String(s.surahNumber).padStart(3, "0")}-${s.slug}.json`);
      const embedded = JSON.parse(fs.readFileSync(file, "utf-8")).surah as SurahSummary;
      expect(embedded, file).toEqual(s);
    }
  });
});
