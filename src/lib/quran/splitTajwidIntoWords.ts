import type { TajwidSegment } from "@/types/quran";
import { isHiddenQuranicSign } from "./stripWaqfSigns";

/**
 * Verses where Quran.com's word segmentation counts two space-separated tokens as one
 * word ("بَعْدَ مَا", "إِلْ يَاسِينَ"). Value = index of the first token to merge with the next.
 */
const WORD_MERGES: Record<string, number> = {
  "2:181": 2,
  "8:6": 3,
  "13:37": 7,
  "37:130": 2,
};

/**
 * Splits an ayah's tajwid segments into words (one array of colored pieces per word),
 * in the same word order as Quran.com word positions. Signs hidden on screen (pause signs,
 * rub el hizb, sajdah; see stripWaqfSigns) are removed and do not count as words.
 * A tajwid segment that spans a space contributes a piece with its rule to each word it touches.
 */
export function splitTajwidIntoWords(
  segments: TajwidSegment[],
  verseKey: string,
): TajwidSegment[][] {
  const words: TajwidSegment[][] = [];
  let current: TajwidSegment[] = [];

  const closeWord = () => {
    if (current.length > 0) words.push(current);
    current = [];
  };

  for (const seg of segments) {
    let piece = "";
    const flushPiece = () => {
      if (piece) current.push({ text: piece, rule: seg.rule });
      piece = "";
    };
    for (const ch of seg.text) {
      if (/\s/.test(ch)) {
        flushPiece();
        closeWord();
      } else if (!isHiddenQuranicSign(ch.codePointAt(0) ?? 0)) {
        piece += ch;
      }
    }
    flushPiece();
  }
  closeWord();

  const mergeAt = WORD_MERGES[verseKey];
  if (mergeAt != null && mergeAt + 1 < words.length) {
    const merged = [...words[mergeAt], { text: " ", rule: "normal" as const }, ...words[mergeAt + 1]];
    words.splice(mergeAt, 2, merged);
  }
  return words;
}
