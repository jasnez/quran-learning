/**
 * Unicode range for Quranic annotation / waqf signs (small circles etc. in Uthmani text).
 * U+06D6–U+06ED: Arabic small high signs, pause marks.
 * Stripping these at display time shows "original" script without circles; data and tajwid indices stay unchanged.
 */
const WAQF_FIRST = 0x06d6;
const WAQF_LAST = 0x06ed;

function isWaqfSign(codePoint: number): boolean {
  return codePoint >= WAQF_FIRST && codePoint <= WAQF_LAST;
}

/**
 * Removes waqf/annotation symbols (U+06D6–U+06ED) from Arabic text.
 * Use only when rendering; do not alter stored verse data.
 */
export function stripWaqfSigns(text: string): string {
  if (!text) return text;
  return Array.from(text)
    .filter((char) => !isWaqfSign(char.codePointAt(0) ?? 0))
    .join("");
}
