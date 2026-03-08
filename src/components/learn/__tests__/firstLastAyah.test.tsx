/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearnModeContent } from "../LearnModeContent";
import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";

const mockSurah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "Al-Fatiha",
  revelationType: "meccan",
  ayahCount: 2,
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
  {
    id: "1:2",
    ayahNumber: 2,
    ayahNumberGlobal: 2,
    juz: 1,
    page: 1,
    arabicText: "ٱلْحَمْدُ",
    transliteration: "Alhamdu",
    translationBosnian: "Hvala",
    tajwidSegments: [{ text: "ٱلْحَمْدُ", rule: "normal" }],
    audio: { reciterId: "x", url: "/b.mp3", durationMs: 0 },
  } as Ayah,
];

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
      repeatAyah: false,
      toggleTransliteration: vi.fn(),
      toggleTranslation: vi.fn(),
      toggleRepeatAyah: vi.fn(),
    })
  ),
}));

const defaultPlayerState = {
  currentAyahId: "1:1" as string | null,
  isPlaying: false,
  setQueue: vi.fn(),
  setCurrentAyah: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
    sel(defaultPlayerState)
  );
});

describe("Learning mode first/last ayah", () => {
  it("Previous button is disabled on first ayah", () => {
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const prev = screen.getByRole("button", { name: /prethodni|previous/i });
    expect(prev).toBeDisabled();
  });

  it("Next button is enabled when not on last ayah", () => {
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const next = screen.getByRole("button", { name: /sljedeći|next/i });
    expect(next).toBeEnabled();
  });

  it("on last ayah Next is disabled", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, currentAyahId: "1:2" })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const next = screen.getByRole("button", { name: /sljedeći|next/i });
    expect(next).toBeDisabled();
  });

  it("when ayahs empty shows data coming soon message", () => {
    render(<LearnModeContent surah={mockSurah} ayahs={[]} />);
    expect(
      screen.getByText(/podaci za ovu suru.*uskoro|dostupni.*uskoro/i)
    ).toBeInTheDocument();
  });
});

describe("Learn mode navigation init", () => {
  it("when currentAyahId is null, on mount sets current to first ayah so Next works", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, currentAyahId: null })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    expect(defaultPlayerState.setCurrentAyah).toHaveBeenCalledWith(mockAyahs[0]);
  });

  it("when currentAyahId is already in ayahs, does not override with first ayah", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, currentAyahId: "1:2" })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    expect(defaultPlayerState.setCurrentAyah).not.toHaveBeenCalled();
  });
});
