/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChapterTimestamps } from "../useChapterTimestamps";
import { clearWordTimingCache } from "../wordTimingService";

const chapter = {
  chapterId: 1,
  audioUrl: "https://example.com/1.mp3",
  timestamps: [
    { verseKey: "1:1", timestampFrom: 0, timestampTo: 6090, segments: [{ wordPosition: 1, startMs: 0, endMs: 580 }] },
    { verseKey: "1:2", timestampFrom: 6090, timestampTo: 11680, segments: [] },
  ],
};

beforeEach(() => {
  clearWordTimingCache();
  vi.restoreAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("useChapterTimestamps", () => {
  it("does not fetch when disabled", () => {
    globalThis.fetch = vi.fn();
    const { result } = renderHook(() => useChapterTimestamps(1, false));
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current).toEqual({ byVerse: null, error: false });
  });

  it("returns a verse map", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(chapter) });
    const { result } = renderHook(() => useChapterTimestamps(1, true));
    await waitFor(() => expect(result.current.byVerse).not.toBeNull());
    expect(result.current.byVerse?.get("1:2")?.timestampFrom).toBe(6090);
    expect(result.current.error).toBe(false);
  });

  it("sets error on failed fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const { result } = renderHook(() => useChapterTimestamps(1, true));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.byVerse).toBeNull();
  });
});
