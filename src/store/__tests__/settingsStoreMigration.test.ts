/**
 * @vitest-environment jsdom
 *
 * Phase 2 shows the sepia theme as "Hartija" but keeps the stored value "sepia" and the storage
 * key. Settings saved by earlier builds (no pauseAfterAyah yet) must load unchanged.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore, SETTINGS_STORAGE_KEY } from "../settingsStore";

describe("settingsStore rehydration of earlier builds", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the storage key", () => {
    expect(SETTINGS_STORAGE_KEY).toBe("quran-learning-settings");
  });

  it("loads a stored sepia theme and the other settings unchanged", async () => {
    localStorage.setItem(
      "quran-learning-settings",
      JSON.stringify({
        state: {
          theme: "sepia",
          arabicFontSize: 32,
          arabicFontStyle: "uthmanic",
          showTransliteration: false,
          showTranslation: true,
          showTajwidColors: true,
          selectedReciterId: "mishary-alafasy",
          playbackSpeed: 1,
          repeatMode: "off",
          autoPlayNext: true,
        },
        version: 0,
      }),
    );

    await useSettingsStore.persist.rehydrate();

    const state = useSettingsStore.getState();
    expect(state.theme).toBe("sepia");
    expect(state.arabicFontSize).toBe(32);
    expect(state.arabicFontStyle).toBe("uthmanic");
    expect(state.showTransliteration).toBe(false);
    expect(state.pauseAfterAyah).toBe("off");
  });
});
