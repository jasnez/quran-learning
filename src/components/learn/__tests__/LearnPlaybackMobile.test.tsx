/**
 * @vitest-environment jsdom
 *
 * Ensure LearnModeContent primes audio playback on user click
 * (important for mobile autoplay policies).
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnModeContent } from "../LearnModeContent";
import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";

type PlayerState = ReturnType<typeof usePlayerStore.getState>;

const mockSurah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "Al-Fatihah",
  revelationType: "meccan",
  ayahCount: 1,
};

const mockAyahs: Ayah[] = [
  {
    id: "1:1",
    ayahNumber: 1,
    ayahNumberGlobal: 1,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ",
    transliteration: "Bismi",
    translationBosnian: "U ime",
    tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
    audio: { reciterId: "x", url: "/a.mp3", durationMs: 0 },
  } as Ayah,
];

const mockSetQueue = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn(),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
      repeatMode: "off",
      toggleTransliteration: vi.fn(),
      toggleTranslation: vi.fn(),
      cycleRepeatMode: vi.fn(),
    })
  ),
}));

vi.mock("@/store/bookmarkStore", async (importOriginal) => ({
  hasBookmark: (await importOriginal<typeof import("@/store/bookmarkStore")>()).hasBookmark,
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      toggleBookmark: vi.fn(),
      bookmarks: [],
    })
  ),
}));

vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      showToast: vi.fn(),
    })
  ),
}));

vi.mock("@/lib/audio/audioManager", () => {
  const audioPlayMock = vi.fn(() => Promise.resolve());
  return {
    play: audioPlayMock,
    pause: vi.fn(),
    loadAudio: vi.fn(),
    seek: vi.fn(),
    getCurrentTime: () => 0,
    getDuration: () => 0,
    setPlaybackRate: vi.fn(),
    onTimeUpdate: () => () => {},
    onEnded: () => () => {},
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  vi.mocked(usePlayerStore).mockImplementation((sel) =>
    sel({
      currentAyahId: "1:1" as string | null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      setQueue: mockSetQueue,
      setCurrentAyah: vi.fn(),
      play: mockPlay,
      pause: mockPause,
      next: vi.fn(),
      previous: vi.fn(),
      wordByWordMode: false,
      setWordByWordMode: vi.fn(),
      currentTimeMs: 0,
      setCurrentTime: vi.fn(),
      setPendingSeek: vi.fn(),
    } as unknown as PlayerState)
  );
});

describe("LearnModeContent playback (mobile-style)", () => {
  it("clicking center play button primes audioManager.play and enqueues ayahs", async () => {
    const user = userEvent.setup();
    const audioManager = await import("@/lib/audio/audioManager");

    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);

    const playButton = screen.getByRole("button", { name: "Pusti ajet" });
    await user.click(playButton);

    expect(vi.mocked(audioManager.play)).toHaveBeenCalledTimes(1);
    expect(mockSetQueue).toHaveBeenCalledWith(mockAyahs, "learn");
    expect(mockPlay).toHaveBeenCalledWith(mockAyahs[0]);
  });
});

