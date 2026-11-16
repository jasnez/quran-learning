/**
 * Runs the transliteration rules over all 6,236 ayahs and checks them against an independent
 * source: the word-by-word transliteration from Quran.com in public/data/words.
 * Reads files from disk, so it is slower than a unit test.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { QURANIC_DUAS } from "@/lib/duas/data";
import { analyzeParticles } from "../particles";
import { AYN_SIGN, HAMZA_SIGN, isQuranicSignToken, transliterateAyah, transliterateWord } from "../transliteration";
import { loadParticleSources, serializeLexicon } from "../../../../scripts/generate-particle-lexicon";

type AyahJson = { id: string; ayahNumber: number; ayahNumberGlobal: number; arabicText: string; transliteration: string };
type WordJson = { ayahNumberGlobal: number; wordOrder: number; transliteration: string };

const ROOT = process.cwd();
const AYAHS_DIR = path.join(ROOT, "src", "data", "ayahs");
const WORDS_DIR = path.join(ROOT, "public", "data", "words");
const LEXICON_PATH = path.join(ROOT, "src", "data", "transliteration", "particles.json");
const OVERRIDES_PATH = path.join(ROOT, "src", "data", "transliteration", "particle-overrides.json");
const files = fs.readdirSync(AYAHS_DIR).filter((f) => f.endsWith(".json")).sort();

const lexiconText = fs.readFileSync(LEXICON_PATH, "utf8");
const lexicon = JSON.parse(lexiconText) as Record<string, number>;
const particles = (word: string) => lexicon[word] ?? 0;

const ayahs: AyahJson[] = files.flatMap(
  (f) => (JSON.parse(fs.readFileSync(path.join(AYAHS_DIR, f), "utf8")) as { ayahs: AyahJson[] }).ayahs
);
const arabicWords = (a: AyahJson) => a.arabicText.split(/\s+/).filter((t) => t && !isQuranicSignToken(t));
const results = ayahs.map((a) => ({ ayah: a, ...transliterateAyah(a.arabicText, { particles }) }));

/** The line below the s of tha (U+0331); typed here by code point because it is a combining mark. */
const LINE_BELOW = String.fromCodePoint(0x0331);
/** Letters of the system, the signs for ayn and hamza, the line below, the hyphen and the space. */
const ALLOWED = new RegExp(`^[A-Za-zāīūēĀĪŪḥṣḍṭẓḫẕšžḤṢḌṬẒḪẔŠ${AYN_SIGN}${HAMZA_SIGN}${LINE_BELOW} -]+$`);

/** Fathatan .. sukun (U+064B-U+0652): every ordinary word carries at least one of them. */
const isVowelSign = (char: string) => {
  const cp = char.codePointAt(0) ?? 0;
  return cp >= 0x064b && cp <= 0x0652;
};
/** Small sin above sad (U+06DC): the sad is read as sin, so the consonant differs from the spelling. */
const SMALL_HIGH_SEEN = String.fromCodePoint(0x06dc);

describe("transliteration of all ayahs", () => {
  it("covers every ayah of the Quran", () => {
    expect(ayahs).toHaveLength(6236);
  });

  it("meets no spelling the rules do not cover", () => {
    expect(results.flatMap((r) => r.warnings.map((w) => `${r.ayah.id} ${w}`)).slice(0, 5)).toEqual([]);
  });

  it("writes one non-empty entry per Arabic word", () => {
    const offenders = results
      .filter((r) => r.words.length !== arabicWords(r.ayah).length || r.words.some((w) => w.length === 0))
      .map((r) => r.ayah.id);
    expect(offenders).toEqual([]);
  });

  it("uses only the characters of the system", () => {
    expect(results.filter((r) => !ALLOWED.test(r.text)).map((r) => `${r.ayah.id} ${r.text}`).slice(0, 5)).toEqual([]);
  });

  it("leaves nothing of the English conventions: no doubled vowels, no slash", () => {
    const offenders = results.filter((r) => /aa|ee|oo|ii|uu|AA|\//.test(r.text)).map((r) => `${r.ayah.id} ${r.text}`);
    expect(offenders.slice(0, 5)).toEqual([]);
  });

  it("ends every ayah in its pause form: never on a short vowel", () => {
    expect(results.filter((r) => /[aeiu]$/.test(r.text)).map((r) => `${r.ayah.id} ${r.text}`).slice(0, 5)).toEqual([]);
  });

  it("starts every ayah with a capital letter and has no stray spaces or hyphens", () => {
    const start = new RegExp(`^[${AYN_SIGN}${HAMZA_SIGN}]?\\p{Lu}`, "u");
    const offenders = results
      .filter((r) => !start.test(r.text) || /  |^ | $|--|(^| )-|-( |$)/.test(r.text))
      .map((r) => `${r.ayah.id} ${r.text}`);
    expect(offenders.slice(0, 5)).toEqual([]);
  });
});

describe("stored transliteration", () => {
  // The field is generated (scripts/generate-transliteration.ts) and must never be edited by hand.
  it("is exactly what the rules give for every ayah in src/data/ayahs", () => {
    const stale = results.filter((r) => r.ayah.transliteration !== r.text).map((r) => r.ayah.id);
    expect(stale.slice(0, 5)).toEqual([]);
    expect(stale).toHaveLength(0);
  });

  it("is the same in the Quranic duas, which are whole ayahs", () => {
    const stored = new Map(ayahs.map((a) => [a.id, a]));
    const stale = QURANIC_DUAS.filter((dua) => {
      const ayah = stored.get(dua.id);
      return !ayah || ayah.arabicText.trim() !== dua.arabic.trim() || ayah.transliteration !== dua.transliteration;
    }).map((dua) => dua.id);
    expect(stale).toEqual([]);
  });

  it("is the same in the search index", () => {
    type IndexSurah = { surahNumber: number; ayahs: { ayahNumber: number; transliteration: string }[] };
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "data", "search-index.json"), "utf8")) as IndexSurah[];
    const stored = new Map(ayahs.map((a) => [a.id, a.transliteration]));
    const stale = index.flatMap((s) =>
      s.ayahs.filter((a) => stored.get(`${s.surahNumber}:${a.ayahNumber}`) !== a.transliteration).map((a) => `${s.surahNumber}:${a.ayahNumber}`)
    );
    expect(stale.slice(0, 5)).toEqual([]);
    expect(index.reduce((n, s) => n + s.ayahs.length, 0)).toBe(6236);
  });
});

describe("particle lexicon", () => {
  it("is what the analysis of the word forms, glosses and hand-made decisions gives", () => {
    const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8")) as Record<string, number>;
    const { counts } = analyzeParticles(loadParticleSources(), overrides);
    // Compared as text, so that a stale file fails with a readable diff of the first lines.
    expect(serializeLexicon(counts) === lexiconText).toBe(true);
  });

  it("only holds words of the Quran and counts of one to three particles", () => {
    const known = new Set(ayahs.flatMap(arabicWords));
    const offenders = Object.entries(lexicon).filter(([word, n]) => !known.has(word) || n < 1 || n > 3);
    expect(offenders.slice(0, 5)).toEqual([]);
  });
});

describe("agreement with the Quran.com word-by-word transliteration", () => {
  // Both sides are reduced to the same plain form: Quran.com writes digraphs (th, dh, kh, gh, sh),
  // does not assimilate the article and is inconsistent about doubled letters and hamza.
  const plainOurs = (word: string) =>
    transliterateWord(word)
      .toLowerCase()
      .replace(new RegExp(`^(.*?)(dž|s${LINE_BELOW}|[a-zḥḫẕšṣḍṭẓ])-\\2`), (_m, prefix: string, c: string) => `${prefix}l-${c}`)
      .split(HAMZA_SIGN).join("")
      .split("-").join("")
      .split(AYN_SIGN).join("ʿ")
      .split(`s${LINE_BELOW}`).join("th")
      .replace(/ẕ/g, "dh").replace(/ḫ/g, "kh").replace(/g/g, "gh").replace(/š/g, "sh")
      .replace(/dž/g, "J").replace(/j/g, "y").replace(/J/g, "j");
  const plainTheirs = (word: string) => word.toLowerCase().replace(/['ʾ-]/g, "");
  const undouble = (s: string) => s.replace(/(sh|th|dh|kh|gh|[a-zḥṣḍṭẓʿ])\1+/g, "$1");
  const consonants = (s: string) => undouble(s).replace(/[aiuoāīūē]/g, "");

  it("has the same consonants in every word, except where the recitation differs from the spelling", () => {
    let compared = 0;
    let skippedAyahs = 0;
    const unexplained: string[] = [];
    for (const file of files) {
      const words = JSON.parse(fs.readFileSync(path.join(WORDS_DIR, file), "utf8")) as WordJson[];
      const byAyah = new Map<number, WordJson[]>();
      for (const w of words) byAyah.set(w.ayahNumberGlobal, [...(byAyah.get(w.ayahNumberGlobal) ?? []), w]);
      const fileAyahs = (JSON.parse(fs.readFileSync(path.join(AYAHS_DIR, file), "utf8")) as { ayahs: AyahJson[] }).ayahs;
      for (const ayah of fileAyahs) {
        const ours = arabicWords(ayah);
        const theirs = (byAyah.get(ayah.ayahNumberGlobal) ?? []).sort((a, b) => a.wordOrder - b.wordOrder);
        if (ours.length !== theirs.length) {
          skippedAyahs++; // the two texts split a few words differently
          continue;
        }
        ours.forEach((word, i) => {
          compared++;
          const a = consonants(plainOurs(word));
          const b = consonants(plainTheirs(theirs[i].transliteration));
          if (a === b) return;
          const isDisjoinedLetters = !Array.from(word).some(isVowelSign);
          const isSadReadAsSin = word.includes(SMALL_HIGH_SEEN);
          if (isDisjoinedLetters || isSadReadAsSin) return;
          unexplained.push(`${ayah.id} ${word}: ${a} / ${b}`);
        });
      }
    }
    expect(unexplained).toEqual([]);
    expect(compared).toBeGreaterThan(77000);
    expect(skippedAyahs).toBeLessThanOrEqual(4);
  });
});
