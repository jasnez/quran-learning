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

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Home page", () => {
  describe("Hero section", () => {
    it("shows platform title in Bosnian", () => {
      render(<Home />);
      expect(
        screen.getByRole("heading", { name: /platforma za učenje kur'an/i })
      ).toBeInTheDocument();
    });

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
});
