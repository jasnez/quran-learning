import type { Ayah, SurahSummary, TajwidRule } from "@/types/quran";

export type TestType =
  | "listen_identify"
  | "complete_ayah"
  | "translation_match"
  | "tajwid_identify";

export interface BaseTestQuestion {
  id: string;
  type: TestType;
  surahNumber: number;
  surahNameLatin: string;
  ayahNumber: number;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ListenIdentifyQuestion extends BaseTestQuestion {
  type: "listen_identify";
  audioUrl: string;
}

export interface CompleteAyahQuestion extends BaseTestQuestion {
  type: "complete_ayah";
  prefixText: string;
}

export interface TranslationMatchQuestion extends BaseTestQuestion {
  type: "translation_match";
  arabicText: string;
}

export interface TajwidIdentifyQuestion extends BaseTestQuestion {
  type: "tajwid_identify";
  highlightedText: string;
  correctRule: TajwidRule;
}

export type TestQuestionModel =
  | ListenIdentifyQuestion
  | CompleteAyahQuestion
  | TranslationMatchQuestion
  | TajwidIdentifyQuestion;

export interface GeneratedTestContext {
  surah: SurahSummary;
  ayahs: Ayah[];
}

