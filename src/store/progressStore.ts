import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LearningProgress {
  lastSurahNumber: number;
  lastAyahNumber: number;
  lastSurahNameLatin: string;
  lastMode: "reader" | "learning";
  timestamp: string;
  totalListeningTimeMs: number;
  surahsVisited: number[];
  ayahsListened: number;
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
  getLastPosition: () => { surahNumber: number; ayahNumber: number; mode: "reader" | "learning" } | null;
  getStats: () => { totalTime: number; surahsCount: number; ayahsCount: number };
};

const defaultState: LearningProgress = {
  lastSurahNumber: 0,
  lastAyahNumber: 0,
  lastSurahNameLatin: "",
  lastMode: "reader",
  timestamp: "",
  totalListeningTimeMs: 0,
  surahsVisited: [],
  ayahsListened: 0,
};

export const PROGRESS_STORAGE_KEY = "quran-learning-progress";

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
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      partialize: (state) => ({
        lastSurahNumber: state.lastSurahNumber,
        lastAyahNumber: state.lastAyahNumber,
        lastSurahNameLatin: state.lastSurahNameLatin,
        lastMode: state.lastMode,
        timestamp: state.timestamp,
        totalListeningTimeMs: state.totalListeningTimeMs,
        surahsVisited: state.surahsVisited,
        ayahsListened: state.ayahsListened,
      }),
    }
  )
);
