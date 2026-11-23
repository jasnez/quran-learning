import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SettingsState, RepeatMode, ArabicFontStyle, PauseAfterAyah } from "@/types/settings";
import reciters from "@/data/reciters.json";
import { getSafeStorage } from "./safeStorage";

const VALID_RECITER_IDS = new Set(reciters.map((r) => r.id));

type Theme = SettingsState["theme"];

type SettingsStore = SettingsState & {
  setTheme: (theme: Theme) => void;
  setArabicFontSize: (arabicFontSize: number) => void;
  setArabicFontStyle: (arabicFontStyle: ArabicFontStyle) => void;
  toggleTransliteration: () => void;
  toggleTranslation: () => void;
  toggleTajwidColors: () => void;
  markTajwidNoticeSeen: () => void;
  setReciter: (selectedReciterId: string | null) => void;
  setPlaybackSpeed: (playbackSpeed: number) => void;
  cycleRepeatMode: () => void;
  setRepeatMode: (repeatMode: RepeatMode) => void;
  toggleAutoPlayNext: () => void;
  setPauseAfterAyah: (mode: PauseAfterAyah) => void;
};

const defaultState: SettingsState = {
  theme: "light",
  arabicFontSize: 28,
  arabicFontStyle: "naskh",
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  // A fresh install never saw the old colors; merge sets false for settings stored before Phase 3.
  tajwidNoticeSeen: true,
  selectedReciterId: "mishary-alafasy",
  playbackSpeed: 1,
  repeatMode: "off",
  autoPlayNext: true,
  pauseAfterAyah: "off",
};

export const SETTINGS_STORAGE_KEY = "quran-learning-settings";

/** Progress and bookmark storage keys (progressStore, bookmarkStore): signs of earlier use. */
const PRIOR_USE_KEYS = ["quran-learning-progress", "quran-learning-bookmarks"];

function nextRepeatMode(current: RepeatMode): RepeatMode {
  if (current === "off") return "surah";
  if (current === "surah") return "ayah";
  return "off";
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setTheme: (theme) => set({ theme }),

      setArabicFontSize: (arabicFontSize) => set({ arabicFontSize }),

      setArabicFontStyle: (arabicFontStyle) => set({ arabicFontStyle }),

      toggleTransliteration: () =>
        set((s) => ({ showTransliteration: !s.showTransliteration })),

      toggleTranslation: () =>
        set((s) => ({ showTranslation: !s.showTranslation })),

      toggleTajwidColors: () =>
        set((s) => ({ showTajwidColors: !s.showTajwidColors })),

      markTajwidNoticeSeen: () => set({ tajwidNoticeSeen: true }),

      setReciter: (selectedReciterId) => set({ selectedReciterId }),

      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

      cycleRepeatMode: () =>
        set((s) => ({ repeatMode: nextRepeatMode(s.repeatMode) })),

      setRepeatMode: (repeatMode) => set({ repeatMode }),

      toggleAutoPlayNext: () => set((s) => ({ autoPlayNext: !s.autoPlayNext })),

      setPauseAfterAyah: (pauseAfterAyah) => set({ pauseAfterAyah }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        theme: state.theme,
        arabicFontSize: state.arabicFontSize,
        arabicFontStyle: state.arabicFontStyle,
        showTransliteration: state.showTransliteration,
        showTranslation: state.showTranslation,
        showTajwidColors: state.showTajwidColors,
        tajwidNoticeSeen: state.tajwidNoticeSeen,
        selectedReciterId: state.selectedReciterId,
        playbackSpeed: state.playbackSpeed,
        repeatMode: state.repeatMode,
        autoPlayNext: state.autoPlayNext,
        pauseAfterAyah: state.pauseAfterAyah,
      }),
      merge: (persistedState, currentState) => {
        // No settings stored: zustand still calls merge, with undefined. Settings are written only
        // after a change, so this is also someone who used the app with the default settings;
        // their reading progress or bookmarks show it, and they saw the old tajwid colors.
        if (typeof persistedState !== "object" || persistedState === null) {
          const storage = getSafeStorage();
          const usedBefore = PRIOR_USE_KEYS.some((key) => storage.getItem(key) !== null);
          return usedBefore ? { ...currentState, tajwidNoticeSeen: false } : currentState;
        }
        const p = persistedState as Record<string, unknown>;
        const repeatMode: RepeatMode =
          p.repeatMode === "surah" || p.repeatMode === "ayah"
            ? (p.repeatMode as RepeatMode)
            : p.repeatAyah === true ? "ayah" : ((p.repeatMode as RepeatMode) ?? "off");
        // Reciter koji vise ne postoji u reciters.json (npr. uklonjen Abdul Basit) → fallback na default.
        const persistedReciter = p.selectedReciterId;
        const selectedReciterId =
          typeof persistedReciter === "string" && VALID_RECITER_IDS.has(persistedReciter)
            ? persistedReciter
            : currentState.selectedReciterId;
        return {
          ...currentState,
          ...(persistedState as object),
          repeatMode,
          selectedReciterId,
          // Stored before Phase 3: this person knows the old colors, so tell them once.
          tajwidNoticeSeen: typeof p.tajwidNoticeSeen === "boolean" ? p.tajwidNoticeSeen : false,
        } as SettingsStore;
      },
    }
  )
);
