/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Ayah } from "@/types/quran";
import { SurahReaderContent } from "../SurahReaderContent";

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

const playerState = {
  currentAyahId: null,
  currentTime: 0,
  currentTimeMs: 0,
  isPlaying: false,
  duration: 0,
  wordByWordMode: false,
  setWordByWordMode: vi.fn(),
  setChapterAudio: vi.fn(),
  setQueue: vi.fn(),
  play: vi.fn(),
  setCurrentTime: vi.fn(),
  setPendingSeek: vi.fn(),
};

vi.mock("@/store/playerStore", () => {
  const usePlayerStoreMock = vi.fn((sel: (s: unknown) => unknown) =>
    sel(playerState)
  );
  (usePlayerStoreMock as { getState?: () => typeof playerState }).getState = () =>
    playerState;
  return { usePlayerStore: usePlayerStoreMock };
});

const progressState = {
  addSurahVisited: vi.fn(),
  updateLastPosition: vi.fn(),
};

vi.mock("@/store/progressStore", () => {
  const useProgressStoreMock = vi.fn((sel: (s: unknown) => unknown) =>
    sel({})
  );
  (useProgressStoreMock as { getState?: () => typeof progressState }).getState =
    () => progressState;
  return { useProgressStore: useProgressStoreMock };
});

vi.mock("@/lib/audio/audioManager", () => ({
  play: vi.fn(),
  pause: vi.fn(),
  loadAudio: vi.fn(),
  seek: vi.fn(),
  getCurrentTime: () => 0,
  getDuration: () => 0,
  setPlaybackRate: vi.fn(),
  onTimeUpdate: () => () => {},
  onEnded: () => () => {},
}));

vi.mock("@/lib/audio/wordTimingService", () => ({
  fetchChapterAudioData: vi.fn(),
  fetchWordData: vi.fn(),
}));

vi.mock("@/lib/quran/wordUtils", () => ({
  normalizeWordsToAyahRelative: (w: unknown) => w,
  normalizeWordFromApi: (row: unknown) => row,
}));

vi.mock("@/lib/quran/tajwidWordMapping", () => ({
  mapDbWordsToQuranComWords: (_db: unknown, raw: unknown) => raw,
}));

vi.mock("@/lib/data/juzUtils", () => ({
  getJuzForAyah: vi.fn(() => 1),
}));

vi.mock("@/components/quran", () => ({
  TajwidLegend: () => <div data-testid="tajwid-legend" />,
}));

vi.mock("../AyahCard", () => ({
  AyahCard: ({
    ayah,
    showPageBadge,
  }: {
    ayah: Ayah;
    showPageBadge?: boolean;
  }) => (
    <div
      data-testid="ayah-card"
      data-ayah-id={ayah.id}
      data-page={ayah.page}
      data-show-page={showPageBadge ? "true" : "false"}
    />
  ),
}));

const baseAyah: Ayah = {
  id: "1:1",
  ayahNumber: 1,
  ayahNumberGlobal: 1,
  juz: 1,
  page: 1,
  arabicText: "",
  transliteration: "",
  translationBosnian: "",
  tajwidSegments: [],
  audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
} as Ayah;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("SurahReaderContent page badges", () => {
  it("marks only the first ayah on each page with showPageBadge", () => {
    const ayahs: Ayah[] = [
      { ...baseAyah, id: "1:1", ayahNumber: 1, page: 1 },
      { ...baseAyah, id: "1:2", ayahNumber: 2, page: 1 },
      { ...baseAyah, id: "1:3", ayahNumber: 3, page: 2 },
      { ...baseAyah, id: "1:4", ayahNumber: 4, page: 2 },
    ];

    render(<SurahReaderContent ayahs={ayahs} surahNameLatin="Al-Fatihah" />);

    const cards = screen.getAllByTestId("ayah-card");
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveAttribute("data-show-page", "true");
    expect(cards[1]).toHaveAttribute("data-show-page", "false");
    expect(cards[2]).toHaveAttribute("data-show-page", "true");
    expect(cards[3]).toHaveAttribute("data-show-page", "false");
  });
});

