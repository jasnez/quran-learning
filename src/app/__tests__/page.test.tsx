/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Home from "../page";
import type { SurahSummary } from "@/types/quran";

const mockSurahs: SurahSummary[] = [
  { id: "1", surahNumber: 1, slug: "al-fatiha", nameArabic: "الفاتحة", nameLatin: "El-Fātiḥa", nameBosnian: "Fatiha", revelationType: "meccan", ayahCount: 7 },
  { id: "112", surahNumber: 112, slug: "al-ikhlas", nameArabic: "الإخلاص", nameLatin: "El-Iḫlāṣ", nameBosnian: "Ihlas", revelationType: "meccan", ayahCount: 4 },
  { id: "113", surahNumber: 113, slug: "al-falaq", nameArabic: "الفلق", nameLatin: "El-Feleq", nameBosnian: "Felek", revelationType: "meccan", ayahCount: 5 },
  { id: "114", surahNumber: 114, slug: "an-nas", nameArabic: "الناس", nameLatin: "En-Nās", nameBosnian: "Nas", revelationType: "meccan", ayahCount: 6 },
];

vi.mock("@/lib/data", () => ({
  getAllSurahs: vi.fn(() => Promise.resolve(mockSurahs)),
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
  lastMode: "reader" as "reader" | "learning",
  lastSurahNameLatin: "",
  timestamp: "",
  totalListeningTimeMs: 0,
  surahsVisited: [] as number[],
  ayahsListened: 0,
  getStats: vi.fn<() => { totalTime: number; surahsCount: number; ayahsCount: number }>(() => ({ totalTime: 0, surahsCount: 0, ayahsCount: 0 })),
  surahProgressMap: {} as Record<number, { surahNumber: number; ayahsListened: Set<number>; ayahsRead: Set<number> }>,
};

vi.mock("@/store/progressStore", async (importOriginal) => ({
  computeOverallProgress: (await importOriginal<typeof import("@/store/progressStore")>()).computeOverallProgress,
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
  mockProgressState.surahProgressMap = {};
});

describe("Home page", () => {
  describe("Hero section", () => {
    it("shows platform title in Bosnian", async () => {
      const Page = await Home();
      render(Page);
      expect(
        await screen.findByRole("heading", { name: /platforma za učenje kur'an/i })
      ).toBeInTheDocument();
    }, 10000);

    it("shows subtitle about learning with tedžvid and translation", async () => {
      const Page = await Home();
      render(Page);
      const hero = screen.getByRole("heading", { name: /platforma za učenje kur'an/i }).closest("section");
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveTextContent(/uči kur'an|tedžvid|transliteracij|prijevod|audio/i);
    });

    it("has primary CTA Počni učiti linking to learn page (first surah)", async () => {
      const Page = await Home();
      render(Page);
      const cta = screen.getByRole("link", { name: /počni učit/i });
      expect(cta).toHaveAttribute("href", "/learn/1");
    });

    it("has secondary CTA Pregled sura", async () => {
      const Page = await Home();
      render(Page);
      const cta = screen.getByRole("link", { name: /pregled sura/i });
      expect(cta).toBeInTheDocument();
    });
  });

  describe("Featured surahs section", () => {
    it("shows section heading", async () => {
      const Page = await Home();
      render(Page);
      expect(
        screen.getByRole("heading", { name: /preporučene|featured|sure/i })
      ).toBeInTheDocument();
    });

    it("shows 4 surah cards", async () => {
      const Page = await Home();
      render(Page);
      const linksToSurah = screen.getAllByRole("link", { name: /El-Fātiḥa|El-Iḫlāṣ|El-Feleq|En-Nās/ });
      expect(linksToSurah.length).toBeGreaterThanOrEqual(4);
    });

    it("links to reader page for El-Fātiḥa", async () => {
      const Page = await Home();
      render(Page);
      const link = screen.getByRole("link", { name: /El-Fātiḥa/ });
      expect(link).toHaveAttribute("href", "/surah/1");
    });

    it("links to reader for El-Iḫlāṣ, El-Feleq, En-Nās", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByRole("link", { name: /El-Iḫlāṣ/ })).toHaveAttribute("href", "/surah/112");
      expect(screen.getByRole("link", { name: /El-Feleq/ })).toHaveAttribute("href", "/surah/113");
      expect(screen.getByRole("link", { name: /En-Nās/ })).toHaveAttribute("href", "/surah/114");
    });

    it("shows ayah count for at least one surah", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByText(/7\s*ajeta|7 ayah/i)).toBeInTheDocument();
    });

    it("shows the main (specijal) name on featured cards", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByText("El-Fātiḥa")).toBeInTheDocument();
      expect(screen.getByText("El-Iḫlāṣ")).toBeInTheDocument();
    });

    it("shows short note for at least one featured surah", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByText(/otvaranje kur'an/i)).toBeInTheDocument();
    });
  });

  describe("Daily Dua section", () => {
    it("shows Dova dana heading", async () => {
      const Page = await Home();
      render(Page);
      expect(
        screen.getByRole("heading", { name: /dova dana/i })
      ).toBeInTheDocument();
    });

    it("has link to Kur'anske dove page", async () => {
      const Page = await Home();
      render(Page);
      const link = screen.getByRole("link", { name: /sve kur'anske dove/i });
      expect(link).toHaveAttribute("href", "/duas");
    });
  });

  describe("Features section", () => {
    it("shows 4 feature blocks", async () => {
      const Page = await Home();
      render(Page);
      expect(screen.getByRole("heading", { name: /tedžvid boje/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^transliteracija$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /bosanski prijevod/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /audio s označavanjem ajeta/i })).toBeInTheDocument();
    });
  });

  describe("Continue Learning / welcome section", () => {
    it("when no saved position (new user), shows welcome message and recommended surahs", async () => {
      mockProgressState.getLastPosition.mockReturnValue(null);
      const Page = await Home();
      render(Page);
      expect(screen.getByText(/dobrodošli|dobrodosli/i)).toBeInTheDocument();
      expect(screen.getByText(/počnite sa kratkim surama|pocnite sa kratkim surama/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /preporučene|sure/i })).toBeInTheDocument();
    });

    it("when saved position exists, shows Nastavi učenje card above featured surahs", async () => {
      mockProgressState.getLastPosition.mockReturnValue({ surahNumber: 2, ayahNumber: 15, mode: "reader" });
      mockProgressState.lastSurahNumber = 2;
      mockProgressState.lastAyahNumber = 15;
      mockProgressState.lastMode = "reader";
      // Saved before the Pravila names: the card shows today's name, not the stored one.
      mockProgressState.lastSurahNameLatin = "Al-Baqarah";
      mockProgressState.timestamp = new Date().toISOString();
      const Page = await Home();
      render(Page);
      const continueHeading = screen.getByRole("heading", { name: /nastavi učenje|nastavi ucenje/i });
      expect(continueHeading).toBeInTheDocument();
      expect(continueHeading.closest("section")).toHaveTextContent("El-Beqare");
      expect(continueHeading.closest("section")).not.toHaveTextContent("Al-Baqarah");
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
      const Page = await Home();
      render(Page);
      const readerLink = await screen.findByRole("link", { name: /nastavi čitanje/i });
      const learnLink = await screen.findByRole("link", { name: /^učenje$/i });
      expect(readerLink).toHaveAttribute("href", "/surah/2?ayah=15");
      expect(learnLink).toHaveAttribute("href", "/learn/2");
    });

    it("when saved position exists, shows time-since label (e.g. 'upravo sad' / 'prije X min')", async () => {
      mockProgressState.getLastPosition.mockReturnValue({ surahNumber: 1, ayahNumber: 1, mode: "learning" });
      mockProgressState.lastSurahNumber = 1;
      mockProgressState.lastAyahNumber = 1;
      mockProgressState.lastMode = "learning";
      mockProgressState.lastSurahNameLatin = "Al-Fatihah";
      mockProgressState.timestamp = new Date().toISOString();
      const Page = await Home();
      render(Page);
      // Microcopy je kompaktnija: "Način: Učenje · upravo sad"
      expect(screen.getByText(/upravo sad|prije \d/i)).toBeInTheDocument();
    });

    it("stats row is hidden when all stats are zero (new user)", async () => {
      mockProgressState.getLastPosition.mockReturnValue(null);
      mockProgressState.getStats.mockReturnValue({ totalTime: 0, surahsCount: 0, ayahsCount: 0 });
      const Page = await Home();
      render(Page);
      expect(screen.queryByText(/posjećeno|posjeceno|preslušano|preslusano|min ukupno|slušanje/i)).not.toBeInTheDocument();
    });

    it("stats row is visible when any stat is greater than zero", async () => {
      mockProgressState.getLastPosition.mockReturnValue(null);
      mockProgressState.getStats.mockReturnValue({ totalTime: 120000, surahsCount: 3, ayahsCount: 10 });
      // 3 surahs started, 10 ayahs listened in total, none read.
      mockProgressState.surahProgressMap = {
        1: { surahNumber: 1, ayahsListened: new Set([1, 2, 3, 4, 5, 6, 7]), ayahsRead: new Set() },
        2: { surahNumber: 2, ayahsListened: new Set([1, 2]), ayahsRead: new Set() },
        3: { surahNumber: 3, ayahsListened: new Set([1]), ayahsRead: new Set() },
      };
      mockProgressState.totalListeningTimeMs = 120000;
      mockProgressState.surahsVisited = [1, 2, 3];
      mockProgressState.ayahsListened = 10;
      const Page = await Home();
      render(Page);
      const cards = await screen.findByTestId("overall-stats-cards");
      expect(cards).toBeInTheDocument();
      expect(cards).toHaveTextContent("3");
      expect(cards).toHaveTextContent("10");
      expect(cards).toHaveTextContent("10/6236");
    });
  });
});
