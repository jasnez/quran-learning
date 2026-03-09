import type { TajwidRule } from "@/types/quran";

export type TajwidExample = {
  arabicText: string;
  transliteration: string;
  highlightIndices: number[];
  audioUrl: string;
};

export type TajwidPracticeAyah = {
  surahNumber: number;
  ayahNumber: number;
  relevantWordIndices: number[];
};

export type TajwidQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type TajwidLesson = {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  ruleType: TajwidRule;
  explanation: string;
  examples: TajwidExample[];
  practiceAyahs: TajwidPracticeAyah[];
  quiz: TajwidQuizQuestion[];
};

// Static imports so Next.js can tree-shake and bundle JSON at build time.
import lessonIntro from "./lesson-1-intro.json";
import lessonMad from "./lesson-2-mad.json";
import lessonGhunnah from "./lesson-3-ghunnah.json";
import lessonIkhfa from "./lesson-4-ikhfa.json";
import lessonQalqalah from "./lesson-5-qalqalah.json";

const ALL_LESSONS: TajwidLesson[] = [
  lessonIntro as TajwidLesson,
  lessonMad as TajwidLesson,
  lessonGhunnah as TajwidLesson,
  lessonIkhfa as TajwidLesson,
  lessonQalqalah as TajwidLesson,
];

export async function getAllTajwidLessons(): Promise<TajwidLesson[]> {
  // Already in memory – keep async API for consistency and future data sources.
  return ALL_LESSONS;
}

export async function getTajwidLessonById(
  id: string
): Promise<TajwidLesson | null> {
  const lesson = ALL_LESSONS.find((l) => l.id === id);
  return lesson ?? null;
}

