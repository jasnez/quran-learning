/**
 * @vitest-environment jsdom
 *
 * QA P1-2: learn mode "Riječ po riječ" -- off shows the normal tajwid text,
 * on highlights the recited word; no word meanings anywhere.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { LearnModeContent } from "../LearnModeContent";
import type { SurahSummary, Ayah } from "@/types/quran";
import { clearWordTimingCache } from "@/lib/audio/wordTimingService";
import { tajwidRuleClasses } from "@/lib/quran/tajwidStyles";

const surah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "Al-Fatihah",
  revelationType: "meccan",
  ayahCount: 1,
};

const ayahs: Ayah[] = [
  {
    id: "1:2",
    ayahNumber: 2,
    ayahNumberGlobal: 2,
    juz: 1,
    page: 1,
    arabicText: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [
      { text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَ", rule: "normal" },
      { text: "ـٰ", rule: "mad" },
      { text: "لَمِينَ", rule: "normal" },
    ],
    audio: { reciterId: "x", url: "", durationMs: 0 },
  } as Ayah,
];

const chapter = {
  chapterId: 1,
  audioUrl: "https://example.com/1.mp3",
  timestamps: [
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

const playerState = vi.hoisted(() => ({
  currentAyahId: "1:2" as string | null,
  isPlaying: true,
  duration: 6,
  currentTimeMs: 1000,
  queue: [],
  activeAudioSrc: "/audio/mishary-alafasy/001002.mp3" as string | null,
  setQueue: vi.fn(),
  setCurrentAyah: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  setCurrentTime: vi.fn(),
  setPendingSeek: vi.fn(),
  setCurrentTimeMs: vi.fn(),
  resume: vi.fn(),
  wordByWordMode: false,
  setWordByWordMode: vi.fn(),
}));

vi.mock("@/store/playerStore", () => {
  const m = vi.fn((sel: (s: unknown) => unknown) => sel(playerState));
  (m as { getState?: () => typeof playerState }).getState = () => playerState;
  return { usePlayerStore: m };
});

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      arabicFontSize: 28,
      showTransliteration: false,
      showTranslation: false,
      showTajwidColors: true,
      repeatMode: "off",
      toggleTransliteration: vi.fn(),
      toggleTranslation: vi.fn(),
      cycleRepeatMode: vi.fn(),
    }),
  ),
}));

vi.mock("@/store/progressStore", () => {
  const state = { addSurahVisited: vi.fn(), markAyahRead: vi.fn(), updateLastPosition: vi.fn() };
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
  seek: audio.seek,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  clearWordTimingCache();
  Object.assign(playerState, { currentAyahId: "1:2", isPlaying: true, currentTimeMs: 1000, wordByWordMode: false, activeAudioSrc: "/audio/mishary-alafasy/001002.mp3" });
  fetchMock.mockImplementation((url: string) =>
    url.startsWith("/data/chapter-audio/")
      ? Promise.resolve({ ok: true, json: () => Promise.resolve(chapter) })
      : Promise.resolve({ ok: true, json: () => Promise.resolve([{ ayahNumberGlobal: 2, translationShort: "All praises" }]) }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

function article() {
  return screen.getByRole("region", { name: "Trenutni ajet" });
}

describe("LearnModeContent word-by-word", () => {
  it("toggle off renders the tajwid text, not the word renderer", () => {
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect(article().querySelector("[data-word-by-word]")).toBeNull();
    expect(article().textContent).toContain("لِلَّهِ");
  });

  it("toggle on highlights the active word", async () => {
    playerState.wordByWordMode = true;
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    const active = article().querySelectorAll<HTMLElement>("[data-word-index][data-active=true]");
    expect(Array.from(active).map((el) => el.dataset.wordIndex)).toEqual(["1"]);
  });

  it("no highlight on the current ayah before its audio is loaded", async () => {
    Object.assign(playerState, { wordByWordMode: true, isPlaying: false, activeAudioSrc: null, currentTimeMs: 1000 });
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    expect(article().querySelectorAll("[data-word-index][data-active=true]")).toHaveLength(0);
  });

  it("clicking a word seeks within the current ayah", async () => {
    playerState.wordByWordMode = true;
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(article().querySelector('[data-word-index="3"]')!);
    expect(audio.seek).toHaveBeenCalledWith(2.425);
  });

  it("clicking a word before the ayah was played starts it at that word", async () => {
    Object.assign(playerState, { wordByWordMode: true, isPlaying: false, activeAudioSrc: null });
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(article().querySelector('[data-word-index="3"]')!);
    expect(audio.play).toHaveBeenCalled();
    expect(playerState.setQueue).toHaveBeenCalledWith(ayahs, "learn");
    expect(playerState.play).toHaveBeenCalledWith(ayahs[0]);
    expect(playerState.setPendingSeek).toHaveBeenCalledWith(2.425);
    expect(audio.seek).not.toHaveBeenCalled();
  });

  it("clicking a word while paused seeks, moves the highlight and resumes", async () => {
    Object.assign(playerState, { wordByWordMode: true, isPlaying: false });
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    fireEvent.click(article().querySelector('[data-word-index="3"]')!);
    expect(audio.seek).toHaveBeenCalledWith(2.425);
    expect(playerState.setCurrentTimeMs).toHaveBeenCalledWith(2425);
    expect(playerState.resume).toHaveBeenCalled();
  });

  it("no English word text and no 'značenje riječi' toggle", async () => {
    playerState.wordByWordMode = true;
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    expect(article().textContent).not.toMatch(/[A-Za-z]/);
    expect(screen.queryByRole("button", { name: /značenje riječi/i })).toBeNull();
  });

  // A live region mounted together with its text is often not announced.
  it("has the word-data status region before chapter data fails and puts the error into it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    playerState.wordByWordMode = true;
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false, status: 500 }));
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    const status = within(article()).getByRole("status");
    expect(status).toBeEmptyDOMElement();
    expect(status).toHaveClass("sr-only");
    await waitFor(() =>
      expect(status).toHaveTextContent("Praćenje riječi se nije učitalo. Treba provjeriti internet i pokušati ponovo."),
    );
    expect(within(article()).getByRole("status")).toBe(status);
    expect(status).not.toHaveClass("sr-only");
    warn.mockRestore();
  });

  it("tajwid classes present in word-by-word mode", async () => {
    playerState.wordByWordMode = true;
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await waitFor(() => expect(article().querySelector("[data-word-by-word]")).not.toBeNull());
    const mad = Array.from(article().querySelectorAll("[data-word-index] span")).find((s) => s.textContent === "ـٰ");
    expect(mad?.className).toContain(tajwidRuleClasses.mad.split(" ")[0]);
  });
});
