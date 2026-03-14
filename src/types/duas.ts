/**
 * Kategorije Kur'anskih dova za strukturiran prikaz.
 */
export type DuaCategory =
  | "forgiveness"
  | "knowledge"
  | "guidance"
  | "patience"
  | "family"
  | "rabbana";

/**
 * Jedna dova iz Kur'ana sa tačnom referencom (sura i ajet).
 */
export type QuranicDua = {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  transliteration: string;
  translationBosnian: string;
  category: DuaCategory;
};
