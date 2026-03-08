import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useProgressStore, PROGRESS_STORAGE_KEY } from "../progressStore";

describe("progressStore", () => {
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
    useProgressStore.setState({
      lastSurahNumber: 0,
      lastAyahNumber: 0,
      lastSurahNameLatin: "",
      lastMode: "reader",
      timestamp: "",
      totalListeningTimeMs: 0,
      surahsVisited: [],
      ayahsListened: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = useProgressStore.getState();
      expect(state.lastSurahNumber).toBe(0);
      expect(state.lastAyahNumber).toBe(0);
      expect(state.lastSurahNameLatin).toBe("");
      expect(state.lastMode).toBe("reader");
      expect(state.timestamp).toBe("");
      expect(state.totalListeningTimeMs).toBe(0);
      expect(state.surahsVisited).toEqual([]);
      expect(state.ayahsListened).toBe(0);
    });
  });

  describe("updateLastPosition", () => {
    it("updates last position and sets timestamp", () => {
      useProgressStore.getState().updateLastPosition(2, 15, "Al-Baqarah", "reader");
      const state = useProgressStore.getState();
      expect(state.lastSurahNumber).toBe(2);
      expect(state.lastAyahNumber).toBe(15);
      expect(state.lastSurahNameLatin).toBe("Al-Baqarah");
      expect(state.lastMode).toBe("reader");
      expect(state.timestamp).toBeDefined();
      expect(new Date(state.timestamp).toISOString()).toBe(state.timestamp);
    });

    it("accepts learning mode", () => {
      useProgressStore.getState().updateLastPosition(1, 3, "Al-Fatihah", "learning");
      expect(useProgressStore.getState().lastMode).toBe("learning");
    });
  });

  describe("getLastPosition", () => {
    it("returns null when never updated", () => {
      expect(useProgressStore.getState().getLastPosition()).toBeNull();
    });

    it("returns last position after update", () => {
      useProgressStore.getState().updateLastPosition(3, 7, "Ali 'Imran", "reader");
      const pos = useProgressStore.getState().getLastPosition();
      expect(pos).toEqual({ surahNumber: 3, ayahNumber: 7, mode: "reader" });
    });
  });

  describe("incrementListeningTime", () => {
    it("adds ms to totalListeningTimeMs", () => {
      useProgressStore.getState().incrementListeningTime(5000);
      expect(useProgressStore.getState().totalListeningTimeMs).toBe(5000);
      useProgressStore.getState().incrementListeningTime(3000);
      expect(useProgressStore.getState().totalListeningTimeMs).toBe(8000);
    });
  });

  describe("addSurahVisited", () => {
    it("adds surah number to surahsVisited if not present", () => {
      useProgressStore.getState().addSurahVisited(1);
      expect(useProgressStore.getState().surahsVisited).toEqual([1]);
      useProgressStore.getState().addSurahVisited(2);
      expect(useProgressStore.getState().surahsVisited).toEqual([1, 2]);
    });

    it("does not duplicate surah number", () => {
      useProgressStore.getState().addSurahVisited(1);
      useProgressStore.getState().addSurahVisited(1);
      expect(useProgressStore.getState().surahsVisited).toEqual([1]);
    });
  });

  describe("incrementAyahsListened", () => {
    it("increments ayahsListened", () => {
      useProgressStore.getState().incrementAyahsListened();
      expect(useProgressStore.getState().ayahsListened).toBe(1);
      useProgressStore.getState().incrementAyahsListened();
      expect(useProgressStore.getState().ayahsListened).toBe(2);
    });
  });

  describe("getStats", () => {
    it("returns zeros when empty", () => {
      const stats = useProgressStore.getState().getStats();
      expect(stats).toEqual({ totalTime: 0, surahsCount: 0, ayahsCount: 0 });
    });

    it("returns accumulated stats", () => {
      useProgressStore.getState().updateLastPosition(1, 1, "Al-Fatihah", "reader");
      useProgressStore.getState().incrementListeningTime(10000);
      useProgressStore.getState().addSurahVisited(1);
      useProgressStore.getState().addSurahVisited(2);
      useProgressStore.getState().incrementAyahsListened();
      useProgressStore.getState().incrementAyahsListened();
      const stats = useProgressStore.getState().getStats();
      expect(stats.totalTime).toBe(10000);
      expect(stats.surahsCount).toBe(2);
      expect(stats.ayahsCount).toBe(2);
    });
  });

  describe("persistence", () => {
    it("uses expected localStorage key", () => {
      expect(PROGRESS_STORAGE_KEY).toBe("quran-learning-progress");
    });

    it("state is serializable and can be re-read via getState", () => {
      useProgressStore.getState().updateLastPosition(1, 5, "Al-Fatihah", "reader");
      useProgressStore.getState().incrementListeningTime(1000);
      const state = useProgressStore.getState();
      expect(state.lastSurahNumber).toBe(1);
      expect(state.lastAyahNumber).toBe(5);
      expect(state.totalListeningTimeMs).toBe(1000);
      expect(state.getLastPosition()).toEqual({ surahNumber: 1, ayahNumber: 5, mode: "reader" });
      expect(state.getStats().totalTime).toBe(1000);
    });
  });
});
