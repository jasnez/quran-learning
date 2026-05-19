/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchChapterAudioData,
  fetchWordData,
  clearWordTimingCache,
} from "../wordTimingService";

describe("wordTimingService", () => {
  beforeEach(() => {
    clearWordTimingCache();
    vi.restoreAllMocks();
  });

  it("fetchChapterAudioData reads pre-built static JSON from /data/chapter-audio/ and caches", async () => {
    const mockResponse = {
      chapterId: 1,
      audioUrl: "https://example.com/1.mp3",
      timestamps: [
        {
          verseKey: "1:1",
          timestampFrom: 0,
          timestampTo: 6493,
          segments: [
            { wordPosition: 1, startMs: 0, endMs: 630 },
            { wordPosition: 2, startMs: 650, endMs: 1570 },
          ],
        },
      ],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchChapterAudioData(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/data/chapter-audio/001-al-fatiha.json",
    );
    expect(result.chapterId).toBe(1);
    expect(result.audioUrl).toBe("https://example.com/1.mp3");
    expect(result.timestamps).toHaveLength(1);
    expect(result.timestamps[0].verseKey).toBe("1:1");
    expect(result.timestamps[0].segments).toHaveLength(2);
    expect(result.timestamps[0].segments[0]).toEqual({
      wordPosition: 1,
      startMs: 0,
      endMs: 630,
    });

    // Cached
    const result2 = await fetchChapterAudioData(1);
    expect(result2).toBe(result);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("fetchChapterAudioData throws when fetch fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchChapterAudioData(1)).rejects.toThrow(
      "Chapter audio fetch failed",
    );
  });

  it("fetchChapterAudioData throws on unknown surah", async () => {
    await expect(fetchChapterAudioData(999)).rejects.toThrow("Unknown surah");
  });

  it("fetchWordData returns empty Map (chapter-words mode disabled in static-export build)", async () => {
    const result = await fetchWordData(1);
    expect(result.size).toBe(0);
  });
});
