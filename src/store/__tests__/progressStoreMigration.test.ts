/**
 * @vitest-environment jsdom
 *
 * Older versions stored the playback queue length as a surah's total (a dua
 * gave Al-Baqarah totalAyahs 1 and 200 % completion; a juz gave 111). Loading
 * that saved progress must repair the totals from the real ayah counts.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore, PROGRESS_STORAGE_KEY } from "../progressStore";

const savedAt = "2026-11-15T10:00:00.000Z";

describe("progressStore rehydration of corrupted totals", () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ surahProgressMap: {} });
  });

  it("restores each surah's total from its real ayah count and recomputes completion", async () => {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        state: {
          lastSurahNumber: 2,
          lastAyahNumber: 201,
          lastSurahNameLatin: "Al-Baqarah",
          lastMode: "reader",
          timestamp: savedAt,
          totalListeningTimeMs: 0,
          surahsVisited: [2, 3],
          ayahsListened: 2,
          surahProgressMap: {
            "2": { surahNumber: 2, totalAyahs: 1, ayahsListened: [1, 201], ayahsRead: [], completionPercent: 200, lastAccessedAt: savedAt, timeSpentMs: 0 },
            "3": { surahNumber: 3, totalAyahs: 0, ayahsListened: [], ayahsRead: [5], completionPercent: 0, lastAccessedAt: savedAt, timeSpentMs: 1000 },
          },
          tajwidLessonProgress: {},
          testResults: [],
        },
        version: 0,
      })
    );

    await useProgressStore.persist.rehydrate();

    const baqarah = useProgressStore.getState().getSurahProgress(2)!;
    expect(baqarah.totalAyahs).toBe(286);
    expect(baqarah.completionPercent).toBeCloseTo((2 / 286) * 100);
    expect([...baqarah.ayahsListened]).toEqual([1, 201]);

    const imran = useProgressStore.getState().getSurahProgress(3)!;
    expect(imran.totalAyahs).toBe(200);
    expect(imran.timeSpentMs).toBe(1000);
  });
});
