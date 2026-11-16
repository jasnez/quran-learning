/**
 * @vitest-environment jsdom
 *
 * QA P1-9: while audio plays the time changes on every animation frame. Only the playing
 * card may re-render then; Al-Baqarah has 286 cards with ~9,300 tajwid spans.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, act } from "@testing-library/react";
import type { Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { SurahReaderContent } from "../SurahReaderContent";
import { clearWordTimingCache } from "@/lib/audio/wordTimingService";

// One entry per render of the Arabic text of a card: which ayah, and the word-highlight time it got.
const renders = vi.hoisted(() => ({ log: [] as { id: string; timeMs: number | null; hasVerse?: boolean }[] }));

vi.mock("@/components/quran/AyahWordByWord", () => ({
  AyahWordByWord: (props: { ayah: { id: string }; currentTimeMs: number; verse: unknown }) => {
    renders.log.push({ id: props.ayah.id, timeMs: props.currentTimeMs, hasVerse: props.verse != null });
    return <p data-word-by-word />;
  },
}));
vi.mock("@/components/quran/TajwidTextRenderer", () => ({
  TajwidTextRenderer: () => {
    renders.log.push({ id: "plain", timeMs: null });
    return <p data-plain-text />;
  },
}));
vi.mock("@/components/quran/TajwidLegend", () => ({ TajwidLegend: () => null }));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ arabicFontSize: 28, showTransliteration: false, showTranslation: false, showTajwidColors: true }),
  ),
}));
vi.mock("@/store/progressStore", () => {
  const state = { addSurahVisited: vi.fn(), updateLastPosition: vi.fn(), markAyahRead: vi.fn() };
  const m = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (m as { getState?: () => typeof state }).getState = () => state;
  return { useProgressStore: m };
});
vi.mock("@/store/bookmarkStore", async (importOriginal) => ({
  hasBookmark: (await importOriginal<typeof import("@/store/bookmarkStore")>()).hasBookmark,
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) => sel({ toggleBookmark: vi.fn(), bookmarks: [] })),
}));
vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) => sel({ showToast: vi.fn() })),
}));
vi.mock("@/lib/audio/audioManager", () => ({
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  loadAudio: vi.fn(),
  seek: vi.fn(),
  getCurrentTime: () => 0,
  getDuration: () => 0,
  setPlaybackRate: vi.fn(),
  onTimeUpdate: () => () => {},
  onEnded: () => () => {},
}));

const ayah = (n: number): Ayah =>
  ({
    id: `1:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: n,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ ٱللَّهِ",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [{ text: "بِسْمِ ٱللَّهِ", rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;
const ayahs = [ayah(1), ayah(2), ayah(3)];

const chapter = {
  chapterId: 1,
  audioUrl: "https://example.com/1.mp3",
  timestamps: ayahs.map((a, i) => ({
    verseKey: a.id,
    timestampFrom: i * 2000,
    timestampTo: (i + 1) * 2000,
    segments: [
      { wordPosition: 1, startMs: i * 2000, endMs: i * 2000 + 900 },
      { wordPosition: 2, startMs: i * 2000 + 900, endMs: i * 2000 + 1900 },
    ],
  })),
};

/** One animation-frame tick of the player, as AudioPlayer writes it to the store. */
function tick(seconds: number) {
  act(() => {
    usePlayerStore.getState().setCurrentTime(seconds);
    usePlayerStore.getState().setCurrentTimeMs(Math.floor(seconds * 1000));
  });
}

beforeEach(() => {
  renders.log = [];
  clearWordTimingCache();
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  globalThis.fetch = vi.fn((url: string) =>
    url.startsWith("/data/chapter-audio/")
      ? Promise.resolve({ ok: true, json: () => Promise.resolve(chapter) })
      : Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) }),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
});

describe("SurahReaderContent re-renders during playback (P1-9)", () => {
  it("'Po ajetu': time ticks re-render no card", () => {
    act(() => {
      usePlayerStore.getState().setQueue(ayahs);
      usePlayerStore.getState().play(ayahs[1]);
    });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    expect(renders.log.length).toBeGreaterThanOrEqual(3);

    renders.log = [];
    for (let i = 1; i <= 10; i++) tick(i / 60);
    expect(renders.log).toEqual([]);
  });

  it("word-by-word: time ticks re-render only the playing card, with the new time", async () => {
    act(() => {
      usePlayerStore.getState().setWordByWordMode(true);
      usePlayerStore.getState().setQueue(ayahs);
      usePlayerStore.getState().play(ayahs[1]);
    });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    // Wait for the word timings, then count only what the playback clock causes.
    await waitFor(() => expect(renders.log.some((r) => r.hasVerse)).toBe(true));

    renders.log = [];
    tick(0.5);
    tick(1.2);
    expect(renders.log.map((r) => r.id)).toEqual(["1:2", "1:2"]);
    expect(renders.log.at(-1)?.timeMs).toBe(1200);
  });

  it("moving to the next ayah re-renders only the previous and the next card", async () => {
    act(() => {
      usePlayerStore.getState().setWordByWordMode(true);
      usePlayerStore.getState().setQueue(ayahs);
      usePlayerStore.getState().play(ayahs[0]);
    });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(renders.log.some((r) => r.hasVerse)).toBe(true));

    renders.log = [];
    act(() => {
      usePlayerStore.getState().next();
    });
    expect(new Set(renders.log.map((r) => r.id))).toEqual(new Set(["1:1", "1:2"]));
    expect(renders.log.filter((r) => r.id === "1:1").at(-1)?.timeMs).toBe(-1);
    expect(renders.log.filter((r) => r.id === "1:2").at(-1)?.timeMs).toBe(0);
  });
});
