/**
 * @vitest-environment jsdom
 *
 * QA P1-2: "Riječ po riječ" in the reader highlights the recited word on per-ayah audio.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import type { Ayah } from "@/types/quran";
import { SurahReaderContent } from "../SurahReaderContent";
import { clearWordTimingCache } from "@/lib/audio/wordTimingService";

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ arabicFontSize: 28, showTransliteration: false, showTranslation: false, showTajwidColors: true }),
  ),
}));

const playerState = vi.hoisted(() => ({
  currentAyahId: null as string | null,
  currentSurahId: "1",
  currentTime: 0,
  currentTimeMs: 0,
  isPlaying: false,
  activeAudioSrc: "/audio/mishary-alafasy/001002.mp3" as string | null,
  duration: 0,
  wordByWordMode: true,
  setWordByWordMode: vi.fn(),
  setQueue: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  setCurrentTime: vi.fn(),
  setPendingSeek: vi.fn(),
  setCurrentTimeMs: vi.fn(),
  resume: vi.fn(),
}));

vi.mock("@/store/playerStore", () => {
  const usePlayerStoreMock = vi.fn((sel: (s: unknown) => unknown) => sel(playerState));
  (usePlayerStoreMock as { getState?: () => typeof playerState }).getState = () => playerState;
  return { usePlayerStore: usePlayerStoreMock };
});

vi.mock("@/store/progressStore", () => {
  const state = { addSurahVisited: vi.fn(), updateLastPosition: vi.fn() };
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

const audio = vi.hoisted(() => ({ seek: vi.fn(), play: vi.fn(() => Promise.resolve()) }));
vi.mock("@/lib/audio/audioManager", () => ({
  play: audio.play,
  pause: vi.fn(),
  loadAudio: vi.fn(),
  seek: audio.seek,
  getCurrentTime: () => 0,
  getDuration: () => 0,
  setPlaybackRate: vi.fn(),
  onTimeUpdate: () => () => {},
  onEnded: () => () => {},
}));

vi.mock("@/components/quran/TajwidLegend", () => ({ TajwidLegend: () => <div data-testid="tajwid-legend" /> }));

const ayah = (n: number, segments: Ayah["tajwidSegments"]): Ayah =>
  ({
    id: `1:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: n,
    juz: 1,
    page: 1,
    arabicText: segments.map((s) => s.text).join(""),
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: segments,
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const ayahs = [
  ayah(1, [{ text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", rule: "normal" }]),
  ayah(2, [{ text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ", rule: "normal" }]),
];

const chapter = {
  chapterId: 1,
  audioUrl: "https://example.com/1.mp3",
  timestamps: [
    {
      verseKey: "1:1",
      timestampFrom: 0,
      timestampTo: 6090,
      segments: [
        { wordPosition: 1, startMs: 0, endMs: 580 },
        { wordPosition: 2, startMs: 580, endMs: 1409 },
        { wordPosition: 3, startMs: 1409, endMs: 2502 },
        { wordPosition: 4, startMs: 2502, endMs: 5840 },
      ],
    },
    {
      verseKey: "1:2",
      timestampFrom: 6090,
      timestampTo: 11680,
      segments: [
        { wordPosition: 1, startMs: 6025, endMs: 7025 },
        { wordPosition: 2, startMs: 7025, endMs: 7885 },
        { wordPosition: 3, startMs: 7885, endMs: 8515 },
        { wordPosition: 4, startMs: 8515, endMs: 11550 },
      ],
    },
  ],
};

const fetchMock = vi.fn();

function card(id: string) {
  return document.querySelector<HTMLElement>(`[data-ayah-id="${id}"]`)!;
}
function activeIn(id: string) {
  return Array.from(card(id).querySelectorAll<HTMLElement>("[data-word-index][data-active=true]")).map(
    (el) => el.dataset.wordIndex,
  );
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  clearWordTimingCache();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  Object.assign(playerState, { currentAyahId: null, currentTimeMs: 0, isPlaying: false, wordByWordMode: true, activeAudioSrc: "/audio/mishary-alafasy/001002.mp3" });
  fetchMock.mockImplementation((url: string) =>
    url.startsWith("/data/chapter-audio/")
      ? Promise.resolve({ ok: true, json: () => Promise.resolve(chapter) })
      : Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe("SurahReaderContent word-by-word", () => {
  it("word-by-word on: playing ayah highlights the word for currentTimeMs", async () => {
    Object.assign(playerState, { currentAyahId: "1:2", isPlaying: true, currentTimeMs: 1000 });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    expect(activeIn("1:2")).toEqual(["1"]);
    expect(activeIn("1:1")).toEqual([]);
  });

  it("no highlight after the player is stopped", async () => {
    Object.assign(playerState, { currentAyahId: "1:2", isPlaying: false, currentTimeMs: 1000, activeAudioSrc: null });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    expect(activeIn("1:2")).toEqual([]);
  });

  // QA section 5: two role="switch" buttons for one choice between two modes. It is one choice,
  // so it is a group of two toggle buttons, as in the desktop ReaderToolbar.
  it("mobile sync mode is one group with the current mode pressed, not two switches", () => {
    playerState.wordByWordMode = false;
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    const group = within(screen.getByRole("group", { name: "Sinhronizacija s audioom" }));
    expect(group.getByRole("button", { name: "Po ajetu" })).toHaveAttribute("aria-pressed", "true");
    expect(group.getByRole("button", { name: "Riječ po riječ" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(group.getByRole("button", { name: "Riječ po riječ" }));
    expect(playerState.setWordByWordMode).toHaveBeenCalledWith(true);
  });

  it("word-by-word off: renders plain tajwid text", () => {
    playerState.wordByWordMode = false;
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    expect(document.querySelector("[data-word-by-word]")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/chapter-audio/));
  });

  it("clicking a word of a non-playing ayah plays it with a pending seek", async () => {
    Object.assign(playerState, { currentAyahId: "1:1", isPlaying: true });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(card("1:2").querySelector('[data-word-index="2"]')!);
    expect(playerState.setQueue).toHaveBeenCalledWith(ayahs, "surah");
    expect(playerState.play).toHaveBeenCalledWith(ayahs[1]);
    expect(playerState.setPendingSeek).toHaveBeenCalledWith(1.795);
    expect(audio.seek).not.toHaveBeenCalled();
  });

  it("clicking a word after Stop restarts that ayah at the word", async () => {
    Object.assign(playerState, { currentAyahId: "1:2", isPlaying: false, activeAudioSrc: null });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(card("1:2").querySelector('[data-word-index="2"]')!);
    expect(playerState.play).toHaveBeenCalledWith(ayahs[1]);
    expect(playerState.setPendingSeek).toHaveBeenCalledWith(1.795);
    expect(audio.seek).not.toHaveBeenCalled();
  });

  it("starting playback from a word primes audio inside the click (mobile autoplay)", async () => {
    Object.assign(playerState, { currentAyahId: "1:1", isPlaying: true });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(card("1:2").querySelector('[data-word-index="2"]')!);
    expect(audio.play).toHaveBeenCalled();
  });

  it("clicking a word while paused seeks, moves the highlight and resumes", async () => {
    Object.assign(playerState, { currentAyahId: "1:2", isPlaying: false, currentTimeMs: 100 });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(card("1:2").querySelector('[data-word-index="2"]')!);
    expect(audio.seek).toHaveBeenCalledWith(1.795);
    expect(playerState.setCurrentTimeMs).toHaveBeenCalledWith(1795);
    expect(playerState.resume).toHaveBeenCalled();
    expect(playerState.play).not.toHaveBeenCalled();
  });

  it("clicking a word of the playing ayah seeks within it", async () => {
    Object.assign(playerState, { currentAyahId: "1:2", isPlaying: true });
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:2").querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(card("1:2").querySelector('[data-word-index="2"]')!);
    expect(audio.seek).toHaveBeenCalledWith(1.795);
    expect(playerState.play).not.toHaveBeenCalled();
  });

  it("shows the Bosnian error and plain text when chapter data fails", async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false, status: 500 }));
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    expect(
      await screen.findByText("Podaci za označavanje riječi se nisu učitali. Provjerite vezu i pokušajte ponovo."),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-word-by-word]")).toBeNull();
    expect(card("1:1").textContent).toContain("ٱللَّهِ");
  });

  it("does not fetch /data/words", async () => {
    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);
    await waitFor(() => expect(card("1:1").querySelector("[data-word-by-word]")).not.toBeNull());
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/\/data\/words\//));
  });
});
