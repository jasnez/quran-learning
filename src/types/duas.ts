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

/**
 * Dova za prikaz: pojedinačni ajet ili spoj uzastopnih ajeta (npr. 3:191–194).
 * Kada je ayahEnd postavljen, id ima oblik "surah:start-end", a tekstovi su spojeni.
 */
export type DisplayDua = QuranicDua & {
  /** Kad je postavljen, dova predstavlja raspon ajeta (npr. 3:191–194). */
  ayahEnd?: number;
};
