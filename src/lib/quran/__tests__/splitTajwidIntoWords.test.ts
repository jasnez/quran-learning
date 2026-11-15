import { describe, it, expect } from "vitest";
import type { TajwidSegment } from "@/types/quran";
import { splitTajwidIntoWords } from "../splitTajwidIntoWords";

const joined = (word: TajwidSegment[]) => word.map((p) => p.text).join("");

describe("splitTajwidIntoWords", () => {
  it("splits 1:1 into 4 words keeping rules", () => {
    // Real segments of 1:1 from src/data/ayahs/001-al-fatiha.json
    const segments: TajwidSegment[] = [
      { text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَ", rule: "normal" },
      { text: "ـٰ", rule: "mad" },
      { text: "نِ ٱلرَّحِ", rule: "normal" },
      { text: "ي", rule: "mad" },
      { text: "مِ", rule: "normal" },
    ];
    const words = splitTajwidIntoWords(segments, "1:1");
    expect(words.map(joined)).toEqual(["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ"]);
    expect(words[2]).toEqual([
      { text: "ٱلرَّحْمَ", rule: "normal" },
      { text: "ـٰ", rule: "mad" },
      { text: "نِ", rule: "normal" },
    ]);
    expect(words[3].map((p) => p.rule)).toEqual(["normal", "mad", "normal"]);
  });

  it("drops standalone waqf signs", () => {
    const words = splitTajwidIntoWords([{ text: "رَيْبَ ۛ فِيهِ", rule: "normal" }], "2:2");
    expect(words.map(joined)).toEqual(["رَيْبَ", "فِيهِ"]);
  });

  it("keeps Uthmani spelling marks inside words", () => {
    const words = splitTajwidIntoWords([{ text: "بِهِۦ أُو۟لَـٰٓئِكَ أَلِيمٌۢ", rule: "normal" }], "x:1");
    expect(words.map(joined)).toEqual(["بِهِۦ", "أُو۟لَـٰٓئِكَ", "أَلِيمٌۢ"]);
  });

  it("drops a standalone rub el hizb symbol", () => {
    const words = splitTajwidIntoWords([{ text: "۞ وَإِذْ قَالَ", rule: "normal" }], "x:1");
    expect(words.map(joined)).toEqual(["وَإِذْ", "قَالَ"]);
  });

  it("removes waqf signs attached to a word", () => {
    const words = splitTajwidIntoWords([{ text: "سَمْعِهِمْۖ وَعَلَىٰٓ", rule: "normal" }], "2:7");
    expect(words.map(joined)).toEqual(["سَمْعِهِمْ", "وَعَلَىٰٓ"]);
  });

  it("merges ba'da ma in 2:181", () => {
    const text =
      "فَمَنۢ بَدَّلَهُۥ بَعْدَ مَا سَمِعَهُۥ فَإِنَّمَآ إِثْمُهُۥ عَلَى ٱلَّذِينَ يُبَدِّلُونَهُۥٓ ۚ إِنَّ ٱللَّهَ سَمِيعٌ عَلِيمٌ";
    const words = splitTajwidIntoWords([{ text, rule: "normal" }], "2:181");
    expect(words).toHaveLength(13);
    expect(joined(words[2])).toBe("بَعْدَ مَا");
  });
});
