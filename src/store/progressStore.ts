import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSafeStorage } from "./safeStorage";

/** In-memory: Sets. In storage: serialized as arrays. */
export interface SurahProgress {
  surahNumber: number;
  totalAyahs: number;
  ayahsListened: Set<number>;
  ayahsRead: Set<number>;
  completionPercent: number;
  lastAccessedAt: string;
  timeSpentMs: number;
}

/** Serialized shape for localStorage (Sets → arrays). */
export type SurahProgressSerialized = Omit<SurahProgress, "ayahsListened" | "ayahsRead"> & {
  ayahsListened: number[];
  ayahsRead: number[];
};

/** Status pojedine Tajwid lekcije. */
export type TajwidLessonStatus = "not_started" | "in_progress" | "completed";

export interface TajwidLessonProgress {
  status: TajwidLessonStatus;
  quizScore?: number;
  quizTotal?: number;
  completedAt?: string;
}

export type TestType =
  | "listen_identify"
  | "complete_ayah"
  | "translation_match"
  | "tajwid_identify";

export interface TestResultEntry {
  surahNumber: number;
  surahNameLatin: string;
  testType: TestType;
  score: number;
  total: number;
  timestamp: string;
}

export interface LearningProgress {
  lastSurahNumber: number;
  lastAyahNumber: number;
  lastSurahNameLatin: string;
  lastMode: "reader" | "learning";
  timestamp: string;
  totalListeningTimeMs: number;
  surahsVisited: number[];
  ayahsListened: number;
  surahProgressMap: Record<number, SurahProgress>;
  /** Key = lesson slug */
  tajwidLessonProgress: Record<string, TajwidLessonProgress>;
  testResults: TestResultEntry[];
}

type ProgressStore = LearningProgress & {
  updateLastPosition: (
    surahNumber: number,
    ayahNumber: number,
    surahNameLatin: string,
    mode: "reader" | "learning"
  ) => void;
  incrementListeningTime: (ms: number) => void;
  addSurahVisited: (surahNumber: number) => void;
  incrementAyahsListened: () => void;
  markAyahListened: (surahNumber: number, ayahNumber: number, totalAyahs?: number) => void;
  markAyahRead: (surahNumber: number, ayahNumber: number, totalAyahs?: number) => void;
  addSurahTimeSpent: (surahNumber: number, ms: number) => void;
  getSurahProgress: (surahNumber: number) => SurahProgress | undefined;
  getAllSurahProgress: () => SurahProgress[];
  getOverallProgress: () => {
    totalSurahsStarted: number;
    totalAyahsListened: number;
    totalAyahsRead: number;
    overallCompletionPercent: number;
  };
  getLastPosition: () => { surahNumber: number; ayahNumber: number; mode: "reader" | "learning" } | null;
  getStats: () => { totalTime: number; surahsCount: number; ayahsCount: number };
  markTajwidLessonStarted: (lessonSlug: string) => void;
  markTajwidLessonCompleted: (lessonSlug: string, quizScore: number, quizTotal: number) => void;
  getTajwidLessonStatus: (lessonSlug: string) => TajwidLessonProgress | undefined;
  addTestResult: (result: Omit<TestResultEntry, "timestamp">) => void;
  getTestResultsForSurah: (surahNumber: number) => TestResultEntry[];
};

const TOTAL_AYAHS_IN_QURAN = 6236;

function createEmptySurahProgress(surahNumber: number, totalAyahs: number): SurahProgress {
  return {
    surahNumber,
    totalAyahs,
    ayahsListened: new Set(),
    ayahsRead: new Set(),
    completionPercent: 0,
    lastAccessedAt: new Date().toISOString(),
    timeSpentMs: 0,
  };
}

function deserializeSurahProgress(serialized: SurahProgressSerialized): SurahProgress {
  return {
    ...serialized,
    ayahsListened: new Set(serialized.ayahsListened ?? []),
    ayahsRead: new Set(serialized.ayahsRead ?? []),
  };
}

function serializeSurahProgress(p: SurahProgress): SurahProgressSerialized {
  return {
    ...p,
    ayahsListened: Array.from(p.ayahsListened),
    ayahsRead: Array.from(p.ayahsRead),
  };
}

const defaultState: LearningProgress = {
  lastSurahNumber: 0,
  lastAyahNumber: 0,
  lastSurahNameLatin: "",
  lastMode: "reader",
  timestamp: "",
  totalListeningTimeMs: 0,
  surahsVisited: [],
  ayahsListened: 0,
  surahProgressMap: {},
  tajwidLessonProgress: {},
  testResults: [],
};

export const PROGRESS_STORAGE_KEY = "quran-learning-progress";

/**
 * Resets local progress to default state. Call on login so pre-login (anonymous)
 * progress is discarded and the user gets a clean slate or their cloud data only.
 */
export function clearLocalProgress(): void {
  useProgressStore.setState({ ...defaultState });
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      updateLastPosition: (surahNumber, ayahNumber, surahNameLatin, mode) =>
        set({
          lastSurahNumber: surahNumber,
          lastAyahNumber: ayahNumber,
          lastSurahNameLatin: surahNameLatin,
          lastMode: mode,
          timestamp: new Date().toISOString(),
        }),

      incrementListeningTime: (ms) =>
        set((s) => ({ totalListeningTimeMs: s.totalListeningTimeMs + ms })),

      addSurahVisited: (surahNumber) =>
        set((s) => ({
          surahsVisited: s.surahsVisited.includes(surahNumber)
            ? s.surahsVisited
            : [...s.surahsVisited, surahNumber].sort((a, b) => a - b),
        })),

      incrementAyahsListened: () =>
        set((s) => ({ ayahsListened: s.ayahsListened + 1 })),

      markAyahListened: (surahNumber, ayahNumber, totalAyahs) =>
        set((s) => {
          const map = { ...s.surahProgressMap };
          let entry = map[surahNumber];
          if (!entry) {
            entry = createEmptySurahProgress(surahNumber, totalAyahs ?? 0);
            map[surahNumber] = entry;
          }
          entry = { ...entry };
          entry.ayahsListened = new Set(entry.ayahsListened).add(ayahNumber);
          if (totalAyahs != null && totalAyahs > 0) entry.totalAyahs = totalAyahs;
          entry.completionPercent =
            entry.totalAyahs > 0 ? (entry.ayahsListened.size / entry.totalAyahs) * 100 : 0;
          entry.lastAccessedAt = new Date().toISOString();
          map[surahNumber] = entry;
          return { surahProgressMap: map };
        }),

      markAyahRead: (surahNumber, ayahNumber, totalAyahs) =>
        set((s) => {
          const map = { ...s.surahProgressMap };
          let entry = map[surahNumber];
          if (!entry) {
            entry = createEmptySurahProgress(surahNumber, totalAyahs ?? 0);
            map[surahNumber] = entry;
          }
          entry = { ...entry };
          entry.ayahsRead = new Set(entry.ayahsRead).add(ayahNumber);
          if (totalAyahs != null && totalAyahs > 0) entry.totalAyahs = totalAyahs;
          entry.completionPercent =
            entry.totalAyahs > 0 ? (entry.ayahsListened.size / entry.totalAyahs) * 100 : 0;
          entry.lastAccessedAt = new Date().toISOString();
          map[surahNumber] = entry;
          return { surahProgressMap: map };
        }),

      addSurahTimeSpent: (surahNumber, ms) =>
        set((s) => {
          const map = { ...s.surahProgressMap };
          let entry = map[surahNumber];
          if (!entry) {
            entry = createEmptySurahProgress(surahNumber, 0);
            map[surahNumber] = entry;
          }
          entry = { ...entry, timeSpentMs: entry.timeSpentMs + ms };
          map[surahNumber] = entry;
          return { surahProgressMap: map };
        }),

      getSurahProgress: (surahNumber) => get().surahProgressMap[surahNumber],

      getAllSurahProgress: () => Object.values(get().surahProgressMap),

      getOverallProgress: () => {
        const map = get().surahProgressMap;
        const entries = Object.values(map);
        const totalAyahsListened = entries.reduce((sum, p) => sum + p.ayahsListened.size, 0);
        const totalAyahsRead = entries.reduce((sum, p) => sum + p.ayahsRead.size, 0);
        const overallCompletionPercent =
          TOTAL_AYAHS_IN_QURAN > 0 ? (totalAyahsListened / TOTAL_AYAHS_IN_QURAN) * 100 : 0;
        return {
          totalSurahsStarted: entries.length,
          totalAyahsListened,
          totalAyahsRead,
          overallCompletionPercent,
        };
      },

      getLastPosition: () => {
        const s = get();
        if (s.lastSurahNumber < 1) return null;
        return {
          surahNumber: s.lastSurahNumber,
          ayahNumber: s.lastAyahNumber,
          mode: s.lastMode,
        };
      },

      getStats: () => {
        const s = get();
        return {
          totalTime: s.totalListeningTimeMs,
          surahsCount: s.surahsVisited.length,
          ayahsCount: s.ayahsListened,
        };
      },

      markTajwidLessonStarted: (lessonSlug) =>
        set((s) => {
          const map = { ...s.tajwidLessonProgress };
          const existing = map[lessonSlug];
          if (existing?.status === "completed") return {};
          map[lessonSlug] = {
            ...existing,
            status: "in_progress",
          };
          return { tajwidLessonProgress: map };
        }),

      markTajwidLessonCompleted: (lessonSlug, quizScore, quizTotal) =>
        set((s) => {
          const map = { ...s.tajwidLessonProgress };
          map[lessonSlug] = {
            status: "completed",
            quizScore,
            quizTotal,
            completedAt: new Date().toISOString(),
          };
          return { tajwidLessonProgress: map };
        }),

      getTajwidLessonStatus: (lessonSlug) => get().tajwidLessonProgress[lessonSlug],

      addTestResult: (result) =>
        set((s) => ({
          testResults: [
            {
              ...result,
              timestamp: new Date().toISOString(),
            },
            ...s.testResults,
          ].slice(0, 100),
        })),

      getTestResultsForSurah: (surahNumber) =>
        get().testResults.filter((r) => r.surahNumber === surahNumber),
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => {
        const serializedMap: Record<string, SurahProgressSerialized> = {};
        for (const [key, p] of Object.entries(state.surahProgressMap)) {
          serializedMap[key] = serializeSurahProgress(p as SurahProgress);
        }
        return {
          lastSurahNumber: state.lastSurahNumber,
          lastAyahNumber: state.lastAyahNumber,
          lastSurahNameLatin: state.lastSurahNameLatin,
          lastMode: state.lastMode,
          timestamp: state.timestamp,
          totalListeningTimeMs: state.totalListeningTimeMs,
          surahsVisited: state.surahsVisited,
          ayahsListened: state.ayahsListened,
          surahProgressMap: serializedMap,
          tajwidLessonProgress: state.tajwidLessonProgress ?? {},
          testResults: state.testResults ?? [],
        };
      },
      merge: (persistedState, currentState) => {
        const p = persistedState as Record<string, unknown> | null;
        const rawMap = p?.surahProgressMap as Record<string, SurahProgressSerialized> | undefined;
        const surahProgressMap: Record<number, SurahProgress> = {};
        if (rawMap && typeof rawMap === "object") {
          for (const [key, val] of Object.entries(rawMap)) {
            const num = Number(key);
            if (Number.isInteger(num) && val && typeof val === "object") {
              surahProgressMap[num] = deserializeSurahProgress(val as SurahProgressSerialized);
            }
          }
        }
        const persisted = (persistedState ?? {}) as Partial<LearningProgress>;
        return {
          ...currentState,
          ...persisted,
          surahProgressMap,
          tajwidLessonProgress: (persisted.tajwidLessonProgress ?? currentState.tajwidLessonProgress ?? {}) as Record<string, TajwidLessonProgress>,
          testResults: persisted.testResults ?? currentState.testResults ?? [],
        } as ProgressStore;
      },
    }
  )
);
