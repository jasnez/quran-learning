/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurahHeader } from "../SurahHeader";
import type { SurahSummary, Ayah } from "@/types/quran";

const mockSurah: SurahSummary = {
  surahNumber: 1,
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "El-Fatiha",
  revelationType: "meccan",
  ayahCount: 7,
};

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

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      setQueue: mockSetQueue,
      play: mockPlay,
    })
  ),
}));

vi.mock("@/store/progressStore", () => ({
  useProgressStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      getSurahProgress: () => null,
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
    __audioPlayMock: audioPlayMock,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("SurahHeader mobile playback", () => {
  it("clicking 'Pusti cijelu suru' primes audioManager.play and enqueues ayahs", async () => {
    const user = userEvent.setup();
    const audioManager = await import("@/lib/audio/audioManager");

    render(<SurahHeader surah={mockSurah} ayahs={[mockAyah]} />);

    const button = screen.getByRole("button", { name: /pusti cijelu suru/i });
    await user.click(button);

    expect(audioManager.__audioPlayMock).toHaveBeenCalledTimes(1);
    expect(mockSetQueue).toHaveBeenCalledWith([mockAyah]);
    expect(mockPlay).toHaveBeenCalledWith(mockAyah);
  });
});

