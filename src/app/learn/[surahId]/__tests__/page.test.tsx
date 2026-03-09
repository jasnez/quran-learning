/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LearnPage from "../page";
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
    audio: {
      reciterId: "mishary-alafasy",
      url: `/audio/001${String(n).padStart(3, "0")}.mp3`,
      durationMs: 0,
    },
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
    mockAyah(
      1,
      "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
      "Bismi Allahi arrahmani arraheem",
      "U ime Allaha, Milostivog, Samilosnog!"
    ),
    mockAyah(
      2,
      "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
      "Alhamdu lillahi rabbi alAAalameen",
      "Tebe, Allaha, Gospodara svjetova, hvalimo,"
    ),
  ],
};

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => null),
}));

vi.mock("@/lib/data", () => ({
  getSurahByNumber: vi.fn((n: number) => {
    if (n === 1) return Promise.resolve(mockSurahDetail);
    if (n >= 2 && n <= 114)
      return Promise.resolve({
        ...mockSurahDetail,
        surah: { ...mockSurahDetail.surah, surahNumber: n },
        ayahs: mockSurahDetail.ayahs,
      });
    return Promise.reject(new RangeError("Invalid surah number"));
  }),
}));

const mockSettings = {
  arabicFontSize: 32,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  repeatMode: "off" as const,
  toggleTransliteration: vi.fn(),
  toggleTranslation: vi.fn(),
  cycleRepeatMode: vi.fn(),
};
vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: typeof mockSettings) => unknown) => selector(mockSettings)),
}));

const mockSetQueue = vi.fn();
const mockSetCurrentAyah = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockNext = vi.fn();
const mockPrevious = vi.fn();
const playerState = {
  currentAyahId: null as string | null,
  isPlaying: false,
  setQueue: mockSetQueue,
  setCurrentAyah: mockSetCurrentAyah,
  play: mockPlay,
  pause: mockPause,
  next: mockNext,
  previous: mockPrevious,
};
vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((selector: (s: typeof playerState) => unknown) => selector(playerState)),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  playerState.currentAyahId = "1:1";
  playerState.isPlaying = false;
});

describe("Learn Mode page", () => {
  it("shows surah name at top", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText("الفاتحة")).toBeInTheDocument();
    expect(screen.getByText(/Al-Fatihah|Al-Fatiha/)).toBeInTheDocument();
  });

  it("shows ayah X of Y indicator", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/1\s*\/\s*2|ayah\s*1\s*of\s*2|ajet\s*1\s*od\s*2/i)).toBeInTheDocument();
  });

  it("has close/back button linking to surah reader", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const backLink = screen.getByRole("link", { name: /zatvori|nazad|close|back/i });
    expect(backLink).toHaveAttribute("href", "/surah/1");
  });

  it("shows one ayah Arabic text only (no list of ayahs)", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    const { container } = render(Page);
    expect(screen.getByText("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ")).toBeInTheDocument();
    expect(screen.queryByText("ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ")).not.toBeInTheDocument();
    const articles = container.querySelectorAll("article");
    expect(articles.length).toBe(1);
  });

  it("when showTransliteration is true, shows transliteration", async () => {
    mockSettings.showTransliteration = true;
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/Bismi Allahi arrahmani arraheem/i)).toBeInTheDocument();
  });

  it("when showTranslation is true, shows Bosnian translation", async () => {
    mockSettings.showTranslation = true;
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByText(/U ime Allaha, Milostivog, Samilosnog/i)).toBeInTheDocument();
  });

  it("has Previous ayah button", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByRole("button", { name: /previous|prethodn|←/i })).toBeInTheDocument();
  });

  it("has Next ayah button", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByRole("button", { name: /next|sljede.*ajet|→/i })).toBeInTheDocument();
  });

  it("has Play/Pause button", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(
      screen.getByRole("button", { name: /play|pause|pusti|pauza/i })
    ).toBeInTheDocument();
  });

  it("has Repeat toggle button", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(screen.getByRole("button", { name: /repeat|ponavljaj/i })).toBeInTheDocument();
  });

  it("has Show/hide transliteration toggle", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(
      screen.getByRole("button", { name: /transliteration|transliteraci|prikaži|sakrij transliteraciju/i })
    ).toBeInTheDocument();
  });

  it("has Show/hide translation toggle", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(
      screen.getByRole("button", { name: /translation|prijevod|prikaži prijevod/i })
    ).toBeInTheDocument();
  });

  it("clicking Next calls player next and shows next ayah", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const nextBtn = screen.getByRole("button", { name: /next|sljede.*ajet|→/i });
    await userEvent.click(nextBtn);
    expect(mockNext).toHaveBeenCalled();
  });

  it("clicking Previous calls player previous", async () => {
    playerState.currentAyahId = "1:2";
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const prevBtn = screen.getByRole("button", { name: /previous|prethodn|←/i });
    await userEvent.click(prevBtn);
    expect(mockPrevious).toHaveBeenCalled();
  });

  it("clicking Play sets queue and plays current ayah", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const playBtn = screen.getByRole("button", { name: /play|pause|pusti|pauza/i });
    await userEvent.click(playBtn);
    expect(mockSetQueue).toHaveBeenCalledWith(mockSurahDetail.ayahs);
    expect(mockPlay).toHaveBeenCalledWith(mockSurahDetail.ayahs[0]);
  });

  it("clicking Repeat control calls cycleRepeatMode", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    const repeatBtn = screen.getByRole("button", { name: /repeat|ponavljaj/i });
    await userEvent.click(repeatBtn);
    expect(mockSettings.cycleRepeatMode).toHaveBeenCalled();
  });

  it("calls notFound for invalid surah id", async () => {
    const { notFound } = await import("next/navigation");
    await LearnPage({ params: Promise.resolve({ surahId: "999" }) });
    expect(notFound).toHaveBeenCalled();
  });

  it("layout is centered with max-width for desktop", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "1" }) });
    const { container } = render(Page);
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/max-w|mx-auto|700/);
  });

  it("for surah 2 shows same learning options as surah 1 (Riječ po riječ, Transliteracija, Prijevod, Ponavljaj)", async () => {
    const Page = await LearnPage({ params: Promise.resolve({ surahId: "2" }) });
    render(Page);
    expect(screen.getByRole("button", { name: /riječ po riječ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /transliteracija|transliteraci/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prijevod/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ponavljaj/i })).toBeInTheDocument();
  });
});
