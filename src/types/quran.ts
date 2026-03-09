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
  nameLatin: string;
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

/** Match field for search engine results (used by searchEngine.ts). */
export type SearchMatchField =
  | "arabic"
  | "transliteration"
  | "translation"
  | "surah";

/** Engine search result: used by searchEngine and mapped to SearchResult for UI. */
export type EngineSearchResult = {
  surahNumber: number;
  surahNameLatin: string;
  surahNameArabic: string;
  ayahNumber: number;
  matchField: SearchMatchField;
  matchSnippet: string;
  arabicText: string;
  score: number;
};
