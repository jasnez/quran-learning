import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLessonExample } from "../lessonExample";

// Real data, not typed text: Al-Fatiha 1 and 7.
const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../data/ayahs/001-al-fatiha.json");
const fatiha = JSON.parse(readFileSync(DATA, "utf-8")).ayahs;
const ayah1 = fatiha[0];
const ayah7 = fatiha[6];

describe("resolveLessonExample", () => {
  it("whole ayah: the Arabic, the transcription, all segments and the reader link", () => {
    const r = resolveLessonExample({ surah: 1, ayah: 1, words: [0, 3], translitWords: [0, 0], note: "" }, ayah1);
    expect(r.arabic).toBe(ayah1.arabicText);
    expect(r.transliteration).toBe(ayah1.transliteration);
    expect(r.segments.map((s) => s.text).join("")).toBe(ayah1.arabicText);
    expect(r.href).toBe("/surah/1?ayah=1");
  });

  it("a word range takes those words and only the segments inside them, rules kept", () => {
    const words = ayah7.arabicText.split(" ");
    const tr = ayah7.transliteration.split(" ");
    const r = resolveLessonExample({ surah: 1, ayah: 7, words: [7, 8], translitWords: [5, 6], note: "" }, ayah7);
    expect(r.arabic).toBe(words.slice(7, 9).join(" "));
    expect(r.transliteration).toBe(tr.slice(5, 7).join(" "));
    expect(r.segments.map((s) => s.text).join("")).toBe(r.arabic);
    expect(r.segments.some((s) => s.rule === "mad")).toBe(true);
    expect(r.href).toBe("/surah/1?ayah=7");
  });

  it("a character range cuts a part out of an assimilated transcription", () => {
    const r = resolveLessonExample(
      { surah: 1, ayah: 1, words: [2, 2], translitWords: [0, 0], translitChars: [12, 19], note: "" },
      ayah1,
    );
    expect(r.transliteration).toBe(ayah1.transliteration.slice(12, 19));
    expect(r.arabic).toBe(ayah1.arabicText.split(" ")[2]);
  });

  it("fails loudly on a character cut past the end or empty, and on a range that starts or ends on an empty word", () => {
    const tr = ayah1.transliteration.length;
    expect(() =>
      resolveLessonExample({ surah: 1, ayah: 1, words: [0, 0], translitWords: [0, 0], translitChars: [12, tr + 5], note: "" }, ayah1),
    ).toThrow();
    expect(() =>
      resolveLessonExample({ surah: 1, ayah: 1, words: [0, 0], translitWords: [0, 0], translitChars: [7, 3], note: "" }, ayah1),
    ).toThrow();
    // Ayah text that starts with a space has an empty first word.
    const spaced = { ...ayah1, arabicText: ` ${ayah1.arabicText}`, tajwidSegments: [{ text: " ", rule: "normal" as const }, ...ayah1.tajwidSegments] };
    expect(() => resolveLessonExample({ surah: 1, ayah: 1, words: [0, 1], translitWords: [0, 0], note: "" }, spaced)).toThrow();
    expect(resolveLessonExample({ surah: 1, ayah: 1, words: [1, 1], translitWords: [0, 0], note: "" }, spaced).arabic).toBe(
      ayah1.arabicText.split(" ")[0],
    );
  });

  it("fails loudly on a range outside the ayah or an empty result", () => {
    expect(() => resolveLessonExample({ surah: 1, ayah: 1, words: [0, 9], translitWords: [0, 0], note: "" }, ayah1)).toThrow();
    expect(() => resolveLessonExample({ surah: 1, ayah: 1, words: [0, 0], translitWords: [3, 3], note: "" }, ayah1)).toThrow();
    expect(() =>
      resolveLessonExample({ surah: 1, ayah: 1, words: [0, 0], translitWords: [0, 0], translitChars: [5, 5], note: "" }, ayah1),
    ).toThrow();
  });
});
