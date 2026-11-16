/**
 * One Arabic letter in the three transcription systems of the IZ BiH rules
 * (Rijaset, Pravila transkripcije i transliteracije..., 2022, pages 53-55).
 */
export type ArabicLetter = {
  /** The letter in its isolated form. */
  arabic: string;
  /** Name of the letter, written in the "specijal" system. Not part of the rules. */
  name: string;
  /** "Primijenjena" transcription: plain Bosnian letters, for names and general text. */
  general: string;
  /** "Specijal" transcription: recommended for ayahs and duas; the one the app writes. */
  special: string;
  /** DMG scholarly transcription. */
  dmg: string;
  /** How to pronounce the letter, for beginners. Not part of the rules. */
  pronunciation: string;
};

/** A short or long vowel in the same three systems. */
export type ArabicVowel = {
  /** The vowel sign shown on the letter ba. */
  arabic: string;
  name: string;
  general: string;
  special: string;
  dmg: string;
};
