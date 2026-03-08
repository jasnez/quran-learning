import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingsState } from "@/types/settings";

type Theme = SettingsState["theme"];

type SettingsStore = SettingsState & {
  setTheme: (theme: Theme) => void;
  setArabicFontSize: (arabicFontSize: number) => void;
  toggleTransliteration: () => void;
  toggleTranslation: () => void;
  toggleTajwidColors: () => void;
  setReciter: (selectedReciterId: string | null) => void;
  setPlaybackSpeed: (playbackSpeed: number) => void;
  toggleRepeatAyah: () => void;
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
  repeatAyah: false,
  autoPlayNext: true,
};

export const SETTINGS_STORAGE_KEY = "quran-learning-settings";

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

      toggleRepeatAyah: () => set((s) => ({ repeatAyah: !s.repeatAyah })),

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
        repeatAyah: state.repeatAyah,
        autoPlayNext: state.autoPlayNext,
      }),
    }
  )
);
