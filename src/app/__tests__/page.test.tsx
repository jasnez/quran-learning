/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Home from "../page";
import type { SurahSummary } from "@/types/quran";

const mockSurahs: SurahSummary[] = [
  { id: "1", surahNumber: 1, slug: "al-fatiha", nameArabic: "الفاتحة", nameLatin: "Al-Fatihah", nameBosnian: "Al-Fatiha", revelationType: "meccan", ayahCount: 7 },
  { id: "112", surahNumber: 112, slug: "al-ikhlas", nameArabic: "الإخلاص", nameLatin: "Al-Ikhlas", nameBosnian: "El-Ihlas", revelationType: "meccan", ayahCount: 4 },
  { id: "113", surahNumber: 113, slug: "al-falaq", nameArabic: "الفلق", nameLatin: "Al-Falaq", nameBosnian: "El-Felek", revelationType: "meccan", ayahCount: 5 },
  { id: "114", surahNumber: 114, slug: "an-nas", nameArabic: "الناس", nameLatin: "An-Nas", nameBosnian: "En-Nas", revelationType: "meccan", ayahCount: 6 },
];

vi.mock("@/lib/data", () => ({
  getAllSurahs: vi.fn(() => mockSurahs),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProgressState = {
  getLastPosition: vi.fn<() => { surahNumber: number; ayahNumber: number; mode: "reader" | "learning" } | null>(() => null),
  lastSurahNumber: 0,
  lastAyahNumber: 0,
  lastMode: "reader" as const,
  lastSurahNameLatin: "",
  timestamp: "",
  totalListeningTimeMs: 0,
  surahsVisited: [] as number[],
  ayahsListened: 0,
  getStats: vi.fn<() => { totalTime: number; surahsCount: number; ayahsCount: number }>(() => ({ totalTime: 0, surahsCount: 0, ayahsCount: 0 })),
};

vi.mock("@/store/progressStore", () => ({
  useProgressStore: vi.fn((selector: (s: typeof mockProgressState) => unknown) => {
    const state = {
      ...mockProgressState,
      getLastPosition: () => mockProgressState.getLastPosition(),
      getStats: () => mockProgressState.getStats(),
    };
    return selector(state as typeof mockProgressState);
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
  mockProgressState.getLastPosition.mockReturnValue(null);
  mockProgressState.lastSurahNumber = 0;
  mockProgressState.lastAyahNumber = 0;
  mockProgressState.lastMode = "reader";
  mockProgressState.lastSurahNameLatin = "";
  mockProgressState.timestamp = "";
  mockProgressState.totalListeningTimeMs = 0;
  mockProgressState.surahsVisited = [];
  mockProgressState.ayahsListened = 0;
  mockProgressState.getStats.mockReturnValue({ totalTime: 0, surahsCount: 0, ayahsCount: 0 });
});

describe("Home page", () => {
  describe("Hero section", () => {
    it("shows platform title in Bosnian", async () => {
      render(<Home />);
      expect(
        await screen.findByRole("heading", { name: /platforma za učenje kur'an/i })
      ).toBeInTheDocument();
    }, 10000);

    it("shows subtitle about learning with tajwid and translation", () => {
      render(<Home />);
      const hero = screen.getByRole("heading", { name: /platforma za učenje kur'an/i }).closest("section");
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveTextContent(/uči kur'an|tajwid|transliteracij|prijevod|audio/i);
    });

    it("has primary CTA Počni učiti linking to learn page (first surah)", () => {
      render(<Home />);
      const cta = screen.getByRole("link", { name: /počni učit/i });
      expect(cta).toHaveAttribute("href", "/learn/1");
    });

    it("has secondary CTA Pregled sura", () => {
      render(<Home />);
      const cta = screen.getByRole("link", { name: /pregled sura/i });
      expect(cta).toBeInTheDocument();
    });
  });

  describe("Featured surahs section", () => {
    it("shows section heading", () => {
      render(<Home />);
      expect(
        screen.getByRole("heading", { name: /preporučene|featured|sure/i })
      ).toBeInTheDocument();
    });

    it("shows 4 surah cards", () => {
      render(<Home />);
      const linksToSurah = screen.getAllByRole("link", { name: /al-fatiha|el-ihlas|el-felek|en-nas/i });
      expect(linksToSurah.length).toBeGreaterThanOrEqual(4);
    });

    it("links to reader page for Al-Fatiha", () => {
      render(<Home />);
      const link = screen.getByRole("link", { name: /al-fatiha/i });
      expect(link).toHaveAttribute("href", "/surah/1");
    });

    it("links to reader for El-Ihlas, El-Felek, En-Nas", () => {
      render(<Home />);
      expect(screen.getByRole("link", { name: /el-ihlas/i })).toHaveAttribute("href", "/surah/112");
      expect(screen.getByRole("link", { name: /el-felek/i })).toHaveAttribute("href", "/surah/113");
      expect(screen.getByRole("link", { name: /en-nas/i })).toHaveAttribute("href", "/surah/114");
    });

    it("shows ayah count for at least one surah", () => {
      render(<Home />);
      expect(screen.getByText(/7\s*ajeta|7 ayah/i)).toBeInTheDocument();
    });

    it("shows Bosnian name (nameBosnian) on featured cards", () => {
      render(<Home />);
      expect(screen.getByText("Al-Fatiha")).toBeInTheDocument();
      expect(screen.getByText("El-Ihlas")).toBeInTheDocument();
    });

    it("shows short note for at least one featured surah", () => {
      render(<Home />);
      expect(screen.getByText(/otvaranje kur'an/i)).toBeInTheDocument();
    });
  });

  describe("Features section", () => {
    it("shows 4 feature blocks", () => {
      render(<Home />);
      expect(screen.getByRole("heading", { name: /tajwid boje/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^transliteracija$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /bosanski prijevod/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /audio s označavanjem ajeta/i })).toBeInTheDocument();
    });
  });

  describe("Continue Learning / welcome section", () => {
    it("when no saved position (new user), shows welcome message and recommended surahs", () => {
      mockProgressState.getLastPosition.mockReturnValue(null);
      render(<Home />);
      expect(screen.getByText(/dobrodošli|dobrodosli/i)).toBeInTheDocument();
      expect(screen.getByText(/počnite sa kratkim surama|pocnite sa kratkim surama/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /preporučene|sure/i })).toBeInTheDocument();
    });

    it("when saved position exists, shows Nastavi učenje card above featured surahs", () => {
      mockProgressState.getLastPosition.mockReturnValue({ surahNumber: 2, ayahNumber: 15, mode: "reader" });
      mockProgressState.lastSurahNumber = 2;
      mockProgressState.lastAyahNumber = 15;
      mockProgressState.lastMode = "reader";
      mockProgressState.lastSurahNameLatin = "Al-Baqarah";
      mockProgressState.timestamp = new Date().toISOString();
      render(<Home />);
      const continueHeading = screen.getByRole("heading", { name: /nastavi učenje|nastavi ucenje/i });
      expect(continueHeading).toBeInTheDocument();
      expect(continueHeading.closest("section")).toHaveTextContent(/al-baqarah|Al-Baqarah/i);
      expect(continueHeading.closest("section")).toHaveTextContent(/15|ajet/i);
      const featuredHeading = screen.getByRole("heading", { name: /preporučene|sure/i });
      expect(continueHeading.compareDocumentPosition(featuredHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("when saved position exists, card has two buttons linking to reader and learn", async () => {
      mockProgressState.getLastPosition.mockReturnValue({ surahNumber: 2, ayahNumber: 15, mode: "reader" });
      mockProgressState.lastSurahNumber = 2;
      mockProgressState.lastAyahNumber = 15;
      mockProgressState.lastMode = "reader";
      mockProgressState.lastSurahNameLatin = "Al-Baqarah";
      render(<Home />);
      const readerLink = await screen.findByRole("link", { name: /nastavi u reader-u|reader/i });
      const learnLink = await screen.findByRole("link", { name: /nastavi u learning modu|learning modu/i });
      expect(readerLink).toHaveAttribute("href", "/surah/2?ayah=15");
      expect(learnLink).toHaveAttribute("href", "/learn/2");
    });

    it("when saved position exists, shows last session time label (Zadnji put)", () => {
      mockProgressState.getLastPosition.mockReturnValue({ surahNumber: 1, ayahNumber: 1, mode: "learning" });
      mockProgressState.lastSurahNumber = 1;
      mockProgressState.lastAyahNumber = 1;
      mockProgressState.lastMode = "learning";
      mockProgressState.lastSurahNameLatin = "Al-Fatihah";
      mockProgressState.timestamp = new Date().toISOString();
      render(<Home />);
      expect(screen.getByText(/zadnji put/i)).toBeInTheDocument();
    });

    it("stats row is hidden when all stats are zero (new user)", () => {
      mockProgressState.getLastPosition.mockReturnValue(null);
      mockProgressState.getStats.mockReturnValue({ totalTime: 0, surahsCount: 0, ayahsCount: 0 });
      render(<Home />);
      expect(screen.queryByText(/posjećeno|posjeceno|preslušano|preslusano|min ukupno|slušanje/i)).not.toBeInTheDocument();
    });

    it("stats row is visible when any stat is greater than zero", () => {
      mockProgressState.getLastPosition.mockReturnValue(null);
      mockProgressState.getStats.mockReturnValue({ totalTime: 120000, surahsCount: 3, ayahsCount: 10 });
      mockProgressState.totalListeningTimeMs = 120000;
      mockProgressState.surahsVisited = [1, 2, 3];
      mockProgressState.ayahsListened = 10;
      render(<Home />);
      expect(screen.getByText(/3\s*sura\s*posjećeno|posjeceno/i)).toBeInTheDocument();
      expect(screen.getByText(/10\s*ajeta\s*preslušano|preslusano/i)).toBeInTheDocument();
      expect(screen.getByText(/2\s*min\s*ukupno|min\s*slušanje|slusanje/i)).toBeInTheDocument();
    });
  });
});
