import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { useSettingsStore, SETTINGS_STORAGE_KEY } from "../settingsStore";

describe("settingsStore", () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
      length: 0,
      key: () => null,
    });
    useSettingsStore.setState({
      theme: "light",
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
      selectedReciterId: "mishary-alafasy",
      playbackSpeed: 1,
      repeatAyah: false,
      autoPlayNext: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = useSettingsStore.getState();
      expect(state.theme).toBe("light");
      expect(state.arabicFontSize).toBe(28);
      expect(state.showTransliteration).toBe(true);
      expect(state.showTranslation).toBe(true);
      expect(state.showTajwidColors).toBe(true);
      expect(state.selectedReciterId).toBe("mishary-alafasy");
      expect(state.playbackSpeed).toBe(1);
      expect(state.repeatAyah).toBe(false);
      expect(state.autoPlayNext).toBe(true);
    });
  });

  describe("setTheme", () => {
    it("updates theme", () => {
      useSettingsStore.getState().setTheme("dark");
      expect(useSettingsStore.getState().theme).toBe("dark");
      useSettingsStore.getState().setTheme("sepia");
      expect(useSettingsStore.getState().theme).toBe("sepia");
    });
  });

  describe("setArabicFontSize", () => {
    it("updates arabicFontSize", () => {
      useSettingsStore.getState().setArabicFontSize(32);
      expect(useSettingsStore.getState().arabicFontSize).toBe(32);
    });
  });

  describe("toggleTransliteration", () => {
    it("toggles showTransliteration", () => {
      expect(useSettingsStore.getState().showTransliteration).toBe(true);
      useSettingsStore.getState().toggleTransliteration();
      expect(useSettingsStore.getState().showTransliteration).toBe(false);
      useSettingsStore.getState().toggleTransliteration();
      expect(useSettingsStore.getState().showTransliteration).toBe(true);
    });
  });

  describe("toggleTranslation", () => {
    it("toggles showTranslation", () => {
      expect(useSettingsStore.getState().showTranslation).toBe(true);
      useSettingsStore.getState().toggleTranslation();
      expect(useSettingsStore.getState().showTranslation).toBe(false);
    });
  });

  describe("toggleTajwidColors", () => {
    it("toggles showTajwidColors", () => {
      expect(useSettingsStore.getState().showTajwidColors).toBe(true);
      useSettingsStore.getState().toggleTajwidColors();
      expect(useSettingsStore.getState().showTajwidColors).toBe(false);
    });
  });

  describe("setReciter", () => {
    it("updates selectedReciterId", () => {
      useSettingsStore.getState().setReciter("abdul-basit-abdus-samad");
      expect(useSettingsStore.getState().selectedReciterId).toBe(
        "abdul-basit-abdus-samad"
      );
      useSettingsStore.getState().setReciter(null);
      expect(useSettingsStore.getState().selectedReciterId).toBeNull();
    });
  });

  describe("setPlaybackSpeed", () => {
    it("updates playbackSpeed", () => {
      useSettingsStore.getState().setPlaybackSpeed(1.5);
      expect(useSettingsStore.getState().playbackSpeed).toBe(1.5);
    });
  });

  describe("toggleRepeatAyah", () => {
    it("toggles repeatAyah", () => {
      expect(useSettingsStore.getState().repeatAyah).toBe(false);
      useSettingsStore.getState().toggleRepeatAyah();
      expect(useSettingsStore.getState().repeatAyah).toBe(true);
    });
  });

  describe("toggleAutoPlayNext", () => {
    it("toggles autoPlayNext", () => {
      expect(useSettingsStore.getState().autoPlayNext).toBe(true);
      useSettingsStore.getState().toggleAutoPlayNext();
      expect(useSettingsStore.getState().autoPlayNext).toBe(false);
    });
  });

  describe("persistence", () => {
    it("uses expected localStorage key for persist", () => {
      expect(SETTINGS_STORAGE_KEY).toBe("quran-learning-settings");
    });

    it("updates state so persist can serialize it", () => {
      useSettingsStore.getState().setTheme("dark");
      expect(useSettingsStore.getState().theme).toBe("dark");
    });
  });
});
