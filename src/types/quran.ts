export type RevelationType = "meccan" | "medinan";

export type TajwidRule = "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah";

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
