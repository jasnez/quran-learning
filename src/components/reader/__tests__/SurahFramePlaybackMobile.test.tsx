/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurahFrame } from "../SurahFrame";
import type { SurahSummary, Ayah } from "@/types/quran";

const mockSurah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
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
      surahProgressMap: {},
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
});

describe("SurahFrame mobile playback", () => {
  it("clicking 'Pusti suru' primes audioManager.play and enqueues ayahs", async () => {
    const user = userEvent.setup();
    const audioManager = await import("@/lib/audio/audioManager");

    render(<SurahFrame surah={mockSurah} ayahs={[mockAyah]} />);

    const button = screen.getByRole("button", { name: "Pusti suru" });
    await user.click(button);

    expect(vi.mocked(audioManager.play)).toHaveBeenCalledTimes(1);
    expect(mockSetQueue).toHaveBeenCalledWith([mockAyah]);
    expect(mockPlay).toHaveBeenCalledWith(mockAyah);
  });

  it("names the page when all ayahs are on one page", () => {
    render(<SurahFrame surah={mockSurah} ayahs={[mockAyah]} />);
    expect(screen.getByText(/, str\. 1$/)).toBeInTheDocument();
  });

  it("names the page range when ayahs span several pages", () => {
    const secondAyah: Ayah = { ...mockAyah, id: "1:2", ayahNumber: 2, page: 2 };
    render(<SurahFrame surah={mockSurah} ayahs={[mockAyah, secondAyah]} />);
    expect(screen.getByText(/, str\. 1–2$/)).toBeInTheDocument();
  });
});

