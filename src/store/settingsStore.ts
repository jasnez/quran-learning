import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingsState } from "@/types/settings";
import type { RepeatMode } from "@/types/settings";

type Theme = SettingsState["theme"];

type SettingsStore = SettingsState & {
  setTheme: (theme: Theme) => void;
  setArabicFontSize: (arabicFontSize: number) => void;
  toggleTransliteration: () => void;
  toggleTranslation: () => void;
  toggleTajwidColors: () => void;
  setReciter: (selectedReciterId: string | null) => void;
  setPlaybackSpeed: (playbackSpeed: number) => void;
  cycleRepeatMode: () => void;
  toggleAutoPlayNext: () => void;
};

const defaultState: SettingsState = {
  theme: "light",
  arabicFontSize: 28,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  selectedReciterId: "mishary-alafasy",
  playbackSpeed: 1,
  repeatMode: "off",
  autoPlayNext: true,
};

export const SETTINGS_STORAGE_KEY = "quran-learning-settings";

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

      toggleTransliteration: () =>
        set((s) => ({ showTransliteration: !s.showTransliteration })),

      toggleTranslation: () =>
        set((s) => ({ showTranslation: !s.showTranslation })),

      toggleTajwidColors: () =>
        set((s) => ({ showTajwidColors: !s.showTajwidColors })),

      setReciter: (selectedReciterId) => set({ selectedReciterId }),

      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

      cycleRepeatMode: () =>
        set((s) => ({ repeatMode: nextRepeatMode(s.repeatMode) })),

      toggleAutoPlayNext: () => set((s) => ({ autoPlayNext: !s.autoPlayNext })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      partialize: (state) => ({
        theme: state.theme,
        arabicFontSize: state.arabicFontSize,
        showTransliteration: state.showTransliteration,
        showTranslation: state.showTranslation,
        showTajwidColors: state.showTajwidColors,
        selectedReciterId: state.selectedReciterId,
        playbackSpeed: state.playbackSpeed,
        repeatMode: state.repeatMode,
        autoPlayNext: state.autoPlayNext,
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as unknown as Record<string, unknown>;
        const repeatMode: RepeatMode =
          p.repeatMode === "surah" || p.repeatMode === "ayah"
            ? (p.repeatMode as RepeatMode)
            : p.repeatAyah === true ? "ayah" : ((p.repeatMode as RepeatMode) ?? "off");
        return {
          ...currentState,
          ...(persistedState as object),
          repeatMode,
        } as SettingsStore;
      },
    }
  )
);
