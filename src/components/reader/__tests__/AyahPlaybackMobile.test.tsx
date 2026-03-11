/**
 * @vitest-environment jsdom
 *
 * Mobile-style playback: ensure we call audioManager.play()
 * directly from the user click handler so mobile autoplay
 * policies treat it as a user gesture.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AyahCard } from "../AyahCard";
import type { Ayah } from "@/types/quran";

const mockAyah: Ayah = {
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
} as Ayah;

const mockSetQueue = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      currentAyahId: null,
      isPlaying: false,
      setQueue: mockSetQueue,
      play: mockPlay,
      pause: mockPause,
    })
  ),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
    })
  ),
}));

vi.mock("@/store/bookmarkStore", () => ({
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      toggleBookmark: vi.fn(),
      isBookmarked: () => false,
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

vi.mock("@/hooks/useMediaQuery", () => ({
  useIsMobile: vi.fn(() => true),
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
    // expose for assertions
    __audioPlayMock: audioPlayMock,
  };
});

const defaultProps = {
  ayah: mockAyah,
  surahAyahs: [mockAyah],
  surahNameLatin: "Al-Fatihah",
  arabicFontSize: 28,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("AyahCard mobile playback", () => {
  it("clicking play on an ayah calls audioManager.play from user interaction", async () => {
    const user = userEvent.setup();
    // Re-import audioManager to get access to the mocked functions
    const audioManager = await import("@/lib/audio/audioManager");

    render(<AyahCard {...defaultProps} />);

    const playButton = screen.getByRole("button", { name: /pusti audio/i });
    await user.click(playButton);

    expect(audioManager.__audioPlayMock).toHaveBeenCalledTimes(1);
    expect(mockSetQueue).toHaveBeenCalledWith([mockAyah]);
    expect(mockPlay).toHaveBeenCalledWith(mockAyah);
  });
});

