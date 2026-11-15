/**
 * Quranic symbols hidden at display time:
 * - U+06D6-U+06DC: pause (waqf) signs (sala, qala, lazim, la, jaiz, muanaqa, sakta);
 * - U+06DE: start of rub el hizb; U+06E9: place of sajdah.
 * The rest of U+06DF-U+06ED (small high rounded zero, small waw/yeh, iqlab meem, imala,
 * ishmam, tas-hil...) is part of the Uthmani spelling and stays visible.
 * Data and tajwid indices stay unchanged.
 */
export function isHiddenQuranicSign(codePoint: number): boolean {
  return (codePoint >= 0x06d6 && codePoint <= 0x06dc) || codePoint === 0x06de || codePoint === 0x06e9;
}

/**
 * Removes pause signs and the rub el hizb / sajdah symbols from Arabic text.
 * Use only when rendering; do not alter stored verse data.
 */
export function stripWaqfSigns(text: string): string {
  if (!text) return text;
  return Array.from(text)
    .filter((char) => !isHiddenQuranicSign(char.codePointAt(0) ?? 0))
    .join("");
}
