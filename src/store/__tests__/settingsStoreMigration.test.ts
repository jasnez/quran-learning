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

  it("a setting stored before Phase 3 (no tajwidNoticeSeen) gets the one-time color notice", async () => {
    useSettingsStore.setState({ tajwidNoticeSeen: true });
    localStorage.setItem(
      "quran-learning-settings",
      JSON.stringify({ state: { theme: "light", showTajwidColors: true, repeatMode: "off" }, version: 0 }),
    );
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(false);
  });

  it("keeps a stored tajwidNoticeSeen", async () => {
    useSettingsStore.setState({ tajwidNoticeSeen: false });
    localStorage.setItem(
      "quran-learning-settings",
      JSON.stringify({ state: { theme: "light", tajwidNoticeSeen: true }, version: 0 }),
    );
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(true);
  });

  it("an empty store (first visit) keeps the current state: no throw, no notice", () => {
    const current = { ...useSettingsStore.getState(), tajwidNoticeSeen: true };
    const merge = useSettingsStore.persist.getOptions().merge!;
    expect(merge(undefined, current)).toEqual(current);
  });

  it("markTajwidNoticeSeen sets the flag and persists it", () => {
    useSettingsStore.setState({ tajwidNoticeSeen: false });
    useSettingsStore.getState().markTajwidNoticeSeen();
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(true);
    const stored = JSON.parse(localStorage.getItem("quran-learning-settings") ?? "{}");
    expect(stored.state.tajwidNoticeSeen).toBe(true);
  });

  // zustand writes settings only after a change, so someone who used the old colors with the
  // default settings has no settings key; their reading progress or bookmarks show they did.
  it.each(["quran-learning-progress", "quran-learning-bookmarks"])(
    "no stored settings but %s exists: the notice is due",
    async (key) => {
      useSettingsStore.setState({ tajwidNoticeSeen: true });
      localStorage.removeItem("quran-learning-settings"); // setState above persisted it
      localStorage.setItem(key, JSON.stringify({ state: {}, version: 0 }));
      await useSettingsStore.persist.rehydrate();
      expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(false);
    },
  );

  it("nothing stored at all (first visit): no notice", async () => {
    useSettingsStore.setState({ tajwidNoticeSeen: true });
    localStorage.removeItem("quran-learning-settings"); // setState above persisted it
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(true);
    expect(localStorage.length).toBe(0);
  });
});
