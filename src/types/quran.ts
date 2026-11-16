export type RevelationType = "meccan" | "medinan";

export type TajwidRule = "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah";

export type Word = {
  id: number;
  ayahId: number;
  /** Ayah key for grouping, e.g. "1:1". Set when words are fetched per surah. */
  ayahKey?: string;
  wordOrder: number;
  textArabic: string;
  transliteration?: string;
  translationShort?: string;
  startTimeMs: number;
  endTimeMs: number;
  tajwidRule: TajwidRule;
};

export type SurahSummary = {
  id: string;
  surahNumber: number;
  slug: string;
  nameArabic: string;
  /**
   * Main name, in the "specijal" system of the IZ BiH Pravila (2022), e.g. "El-Beqare".
   * The field name predates the Pravila; the slug keeps the old English form.
   */
  nameLatin: string;
  /** Common Bosnian form from the same list, e.g. "Bekara". Equal to nameLatin when the Pravila give one form. */
  nameBosnian: string;
  revelationType: RevelationType;
  ayahCount: number;
};

export type TajwidSegment = {
  text: string;
  rule: TajwidRule;
};

export type AyahAudio = {
  reciterId: string;
  url: string;
  durationMs: number;
};

export type Ayah = {
  id: string;
  ayahNumber: number;
  ayahNumberGlobal: number;
  juz: number;
  page: number;
  arabicText: string;
  transliteration: string;
  translationBosnian: string;
  tajwidSegments: TajwidSegment[];
  audio: AyahAudio;
};

export type SurahDetail = {
  surah: SurahSummary;
  ayahs: Ayah[];
};

export type Reciter = {
  id: string;
  name: string;
  arabicName: string;
  isDefault: boolean;
};

export type SearchResult = {
  surahId: string;
  surahName: string;
  ayahNumber: number;
  ayahId: string;
  snippet: string;
  snippetHighlight: string;
  arabicSnippet: string;
};

/** Juz (جزء) boundary and metadata. One of 30 equal-ish portions of the Quran. */
export interface JuzInfo {
  juz: number;
  name: string;
  nameArabic: string;
  start: string;
  end: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  /** Surah numbers that have at least one ayah in this juz. */
  surahsIncluded: number[];
}
