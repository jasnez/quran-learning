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

  it("fetchChapterAudioData returns ChapterAudioData and caches for legacy audio_file shape", async () => {
    const mockResponse = {
      audio_file: {
        chapter_id: 1,
        audio_url: "https://example.com/1.mp3",
        timestamps: [
          {
            verse_key: "1:1",
            timestamp_from: 0,
            timestamp_to: 6493,
            segments: [
              [1, 0, 630],
              [2, 650, 1570],
            ],
          },
        ],
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchChapterAudioData(1);
    expect(result.chapterId).toBe(1);
    expect(result.audioUrl).toBe("https://example.com/1.mp3");
    expect(result.timestamps).toHaveLength(1);
    expect(result.timestamps[0].verseKey).toBe("1:1");
    expect(result.timestamps[0].timestampFrom).toBe(0);
    expect(result.timestamps[0].timestampTo).toBe(6493);
    expect(result.timestamps[0].segments).toHaveLength(2);
    expect(result.timestamps[0].segments[0]).toEqual({
      wordPosition: 1,
      startMs: 0,
      endMs: 630,
    });

    const result2 = await fetchChapterAudioData(1);
    expect(result2).toBe(result);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("fetchChapterAudioData supports audio_files + verse_timings shape from Quran API", async () => {
    const mockResponse = {
      audio_files: [
        {
          chapter_id: 1,
          audio_url: "https://example.com/1.mp3",
          verse_timings: [
            {
              verse_key: "1:1",
              timestamp_from: 0,
              timestamp_to: 6090,
              segments: [
                [1, 0, 580],
                [2, 580, 1409],
                [3], // should be ignored (invalid segment)
              ],
            },
          ],
        },
      ],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchChapterAudioData(1);
    expect(result.chapterId).toBe(1);
    expect(result.audioUrl).toBe("https://example.com/1.mp3");
    expect(result.timestamps).toHaveLength(1);
    expect(result.timestamps[0].segments).toHaveLength(2);
    expect(result.timestamps[0].segments[0]).toEqual({
      wordPosition: 1,
      startMs: 0,
      endMs: 580,
    });
  });

  it("fetchChapterAudioData throws when response not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(fetchChapterAudioData(1)).rejects.toThrow(
      "Chapter audio fetch failed"
    );
  });

  it("fetchWordData returns Map by verse_key and caches", async () => {
    const mockResponse = {
      verses: [
        {
          verse_key: "1:1",
          words: [
            {
              position: 1,
              text_uthmani: "بِسْمِ",
              transliteration: { text: "Bismi" },
              translation: { text: "In the name of" },
              char_type_name: "word",
            },
          ],
        },
      ],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchWordData(1);
    expect(result.get("1:1")).toHaveLength(1);
    expect(result.get("1:1")![0].position).toBe(1);
    expect(result.get("1:1")![0].textUthmani).toBe("بِسْمِ");
    expect(result.get("1:1")![0].transliteration).toBe("Bismi");
    expect(result.get("1:1")![0].translation).toBe("In the name of");

    const result2 = await fetchWordData(1);
    expect(result2).toBe(result);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("fetchWordData filters to char_type_name === word only", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          verses: [
            {
              verse_key: "1:1",
              words: [
                { position: 1, text_uthmani: "بِسْمِ", char_type_name: "word" },
                { position: 2, text_uthmani: "ٱللَّهِ", char_type_name: "end" },
              ],
            },
          ],
        }),
    });
    const result = await fetchWordData(1);
    expect(result.get("1:1")).toHaveLength(1);
  });
});
