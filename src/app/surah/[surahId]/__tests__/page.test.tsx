/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SurahReaderPage from "../page";
import { usePlayerStore } from "@/store/playerStore";
import type { SurahDetail, Ayah } from "@/types/quran";

const mockAyah = (n: number, arabic: string, transliteration: string, translation: string): Ayah =>
  ({
    id: `1:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: n,
    juz: 1,
    page: 1,
    arabicText: arabic,
    transliteration,
    translationBosnian: translation,
    tajwidSegments: [{ text: arabic, rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: `/audio/001${String(n).padStart(3, "0")}.mp3`, durationMs: 0 },
  }) as Ayah;

const mockSurahDetail: SurahDetail = {
  surah: {
    id: "1",
    surahNumber: 1,
    slug: "al-fatiha",
    nameArabic: "الفاتحة",
    nameLatin: "Al-Fatihah",
    nameBosnian: "Al-Fatiha",
    revelationType: "meccan",
    ayahCount: 2,
  },
  ayahs: [
    mockAyah(1, "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", "Bismi Allahi arrahmani arraheem", "U ime Allaha, Milostivog, Samilosnog!"),
    mockAyah(2, "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ", "Alhamdu lillahi rabbi alAAalameen", "Tebe, Allaha, Gospodara svjetova, hvalimo,"),
  ],
};

const ayahWithMadSegment: Ayah = {
  ...mockAyah(1, "بِسْمِ ٱللَّهِ", "Bismi Allahi", "U ime Allaha."),
  tajwidSegments: [
    { text: "بِسْمِ", rule: "normal" },
    { text: " ٱللَّهِ", rule: "mad" },
  ],
} as Ayah;

const mockSurahDetailWithTajwid: SurahDetail = {
  ...mockSurahDetail,
  surah: { ...mockSurahDetail.surah, surahNumber: 2 },
  ayahs: [ayahWithMadSegment],
};

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => null),
}));

vi.mock("@/lib/data", () => ({
  getSurahByNumber: vi.fn((n: number) => {
    if (n === 1) return mockSurahDetail;
    if (n === 2) return mockSurahDetailWithTajwid;
    if (n >= 3 && n <= 114) return { ...mockSurahDetail, surah: { ...mockSurahDetail.surah, surahNumber: n }, ayahs: [] };
    throw new RangeError("Invalid surah number");
  }),
}));

const mockSettings = {
  arabicFontSize: 28,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
};
vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: typeof mockSettings) => unknown) => selector(mockSettings)),
}));

const mockSetQueue = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const playerState = {
  currentAyahId: null as string | null,
  isPlaying: false,
  setQueue: mockSetQueue,
  play: mockPlay,
  pause: mockPause,
};
vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((selector: (s: typeof playerState) => unknown) => selector(playerState)),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  playerState.currentAyahId = null;
  playerState.isPlaying = false;
});

describe("Surah Reader page", () => {
  it("shows SurahHeader with nameArabic, nameLatin, nameBosnian", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText("الفاتحة")).toBeInTheDocument();
    expect(screen.getByText(/Al-Fatihah/)).toBeInTheDocument();
    expect(screen.getByText(/Al-Fatiha/)).toBeInTheDocument();
  });

  it("shows meta info: ayah count and revelation type", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/2\s*ajeta|2 ajeta/i)).toBeInTheDocument();
    expect(screen.getByText(/meka|meccan/i)).toBeInTheDocument();
  });

  it("shows Play full surah button when ayahs are present", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const btn = screen.getByRole("button", { name: /pusti cijelu suru/i });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(mockSetQueue).toHaveBeenCalledWith(mockSurahDetail.ayahs);
    expect(mockPlay).toHaveBeenCalledWith(mockSurahDetail.ayahs[0]);
  });

  it("renders an AyahCard for each ayah", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ")).toBeInTheDocument();
    expect(screen.getByText("ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ")).toBeInTheDocument();
  });

  it("shows transliteration when showTransliteration is true", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/Bismi Allahi arrahmani arraheem/i)).toBeInTheDocument();
  });

  it("shows Bosnian translation when showTranslation is true", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/U ime Allaha, Milostivog, Samilosnog/i)).toBeInTheDocument();
  });

  it("each card shows ayah number and play button", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    const playButtons = screen.getAllByRole("button", { name: /play|pusti|pusti audio/i });
    expect(playButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls notFound for invalid surah number", async () => {
    const { notFound } = await import("next/navigation");
    await SurahReaderPage({ params: Promise.resolve({ surahId: "999" }) });
    expect(notFound).toHaveBeenCalled();
  });

  it("calls notFound for non-numeric surahId", async () => {
    const { notFound } = await import("next/navigation");
    await SurahReaderPage({ params: Promise.resolve({ surahId: "abc" }) });
    expect(notFound).toHaveBeenCalled();
  });

  it("content is in a centered container with max-width", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    const { container } = render(Page);
    const main = container.querySelector(".mx-auto.max-w-\\[800px\\]") ?? container.querySelector("[class*='max-w'][class*='800']");
    expect(main).toBeInTheDocument();
  });

  it("applies tajwid colors when showTajwidColors is true and ayah has segments", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "2" }) });
    const { container } = render(Page);
    const spanWithMad = container.querySelector("span.text-emerald-600, span[class*='text-emerald']");
    expect(spanWithMad).toBeInTheDocument();
    expect(spanWithMad?.textContent).toMatch(/ٱللَّهِ/);
  });

  it("clicking play on an ayah sets queue to all surah ayahs and plays that ayah", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const playButtons = screen.getAllByRole("button", { name: /pusti audio|pusti/i });
    expect(playButtons.length).toBeGreaterThanOrEqual(1);
    playButtons[0].click();
    expect(mockSetQueue).toHaveBeenCalledWith(mockSurahDetail.ayahs);
    expect(mockPlay).toHaveBeenCalledWith(mockSurahDetail.ayahs[0]);
  });

  it("when this ayah is playing, shows pause button and clicking pauses", async () => {
    playerState.currentAyahId = "1:1";
    playerState.isPlaying = true;
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const pauseButton = screen.getByRole("button", { name: /pauza/i });
    expect(pauseButton).toBeInTheDocument();
    pauseButton.click();
    expect(mockPause).toHaveBeenCalled();
  });

  it("when an ayah is playing, that card has active highlight (data-active and left border)", async () => {
    playerState.currentAyahId = "1:1";
    playerState.isPlaying = true;
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    const { container } = render(Page);
    const activeCard = container.querySelector("[data-active='true']");
    expect(activeCard).toBeInTheDocument();
    expect(activeCard?.className).toMatch(/border-l|emerald/);
  });

  it("when an ayah is playing, card shows now playing indicator", async () => {
    playerState.currentAyahId = "1:2";
    playerState.isPlaying = true;
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/sada se pušta|now playing|trenutno se pušta/i)).toBeInTheDocument();
  });

  it("when not playing, no card has active highlight", async () => {
    playerState.currentAyahId = null;
    playerState.isPlaying = false;
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    const { container } = render(Page);
    expect(container.querySelector("[data-active='true']")).not.toBeInTheDocument();
  });

  it("each AyahCard has data-ayah-id attribute for scroll targeting", async () => {
    const Page = await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) });
    const { container } = render(Page);
    expect(container.querySelector("[data-ayah-id='1:1']")).toBeInTheDocument();
    expect(container.querySelector("[data-ayah-id='1:2']")).toBeInTheDocument();
  });

  it("when current ayah is playing, scrolls active card into view with smooth behavior", async () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    const { SurahReaderContent } = await import("@/components/reader/SurahReaderContent");
    const { useState, useEffect } = await import("react");
    function Wrapper() {
      const [id, setId] = useState("1:1");
      useEffect(() => {
        const t = setTimeout(() => setId("1:2"), 0);
        return () => clearTimeout(t);
      }, []);
      vi.mocked(usePlayerStore).mockImplementation(
        (selector: (s: typeof playerState) => unknown) =>
          selector({ ...playerState, currentAyahId: id, isPlaying: true })
      );
      return <SurahReaderContent ayahs={mockSurahDetail.ayahs} />;
    }
    render(<Wrapper />);
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    });
  });
});
