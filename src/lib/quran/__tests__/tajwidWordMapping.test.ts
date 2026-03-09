/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import type { Word } from "@/types/quran";
import type { WordData } from "@/types/wordByWord";
import { mapDbWordsToQuranComWords } from "../tajwidWordMapping";

describe("mapDbWordsToQuranComWords", () => {
  const dbWords: Word[] = [
    {
      id: 1,
      ayahId: 10,
      ayahKey: "1:1",
      wordOrder: 1,
      textArabic: "بِسْمِ",
      transliteration: "Bismi",
      translationShort: "In the name of",
      startTimeMs: 0,
      endTimeMs: 500,
      tajwidRule: "mad",
    },
    {
      id: 2,
      ayahId: 10,
      ayahKey: "1:1",
      wordOrder: 2,
      textArabic: "ٱللَّهِ",
      transliteration: "Allahi",
      translationShort: "of Allah",
      startTimeMs: 500,
      endTimeMs: 1200,
      tajwidRule: "ghunnah",
    },
  ];

  const apiWords: WordData[] = [
    {
      position: 1,
      textUthmani: "بِسْمِ",
      transliteration: "Bismi",
      translation: "In the name of",
      charTypeName: "word",
    },
    {
      position: 2,
      textUthmani: "ٱللَّهِ",
      transliteration: "Allahi",
      translation: "of Allah",
      charTypeName: "word",
    },
  ];

  it("maps tajwidRule from db words to Quran.com words by position", () => {
    const mapped = mapDbWordsToQuranComWords(dbWords, apiWords);
    expect(mapped).toHaveLength(2);
    expect(mapped[0].tajwidRule).toBe("mad");
    expect(mapped[1].tajwidRule).toBe("ghunnah");
  });

  it("returns copy of apiWords when dbWords is empty", () => {
    const mapped = mapDbWordsToQuranComWords([], apiWords);
    expect(mapped).toHaveLength(2);
    expect(mapped[0]).not.toBe(apiWords[0]);
    expect((mapped[0] as any).tajwidRule).toBeUndefined();
  });

  it("ignores db words with invalid positions", () => {
    const badDbWords: Word[] = [
      { ...dbWords[0], wordOrder: -1 },
      { ...dbWords[1], wordOrder: 999 },
    ];
    const mapped = mapDbWordsToQuranComWords(badDbWords, apiWords);
    expect(mapped[0].tajwidRule).toBeUndefined();
    expect(mapped[1].tajwidRule).toBeUndefined();
  });
});

