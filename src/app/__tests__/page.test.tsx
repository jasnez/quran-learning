/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Home from "../page";

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
    it("shows platform name Quran Learning Platform", () => {
      render(<Home />);
      expect(
        screen.getByRole("heading", { name: /quran learning platform/i })
      ).toBeInTheDocument();
    });

    it("shows subtitle about learning with tajwid and translation", () => {
      render(<Home />);
      const hero = screen.getByRole("heading", { name: /quran learning platform/i }).closest("section");
      expect(hero).toBeInTheDocument();
      expect(hero).toHaveTextContent(/uči kur'an|tajwid|transliteracij|prijevod|audio/i);
    });

    it("has primary CTA Počni učiti linking to /surahs", () => {
      render(<Home />);
      const cta = screen.getByRole("link", { name: /počni učit/i });
      expect(cta).toHaveAttribute("href", "/surahs");
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
      const linksToSurah = screen.getAllByRole("link", { name: /al-fatiha|al-ikhlas|al-falaq|an-nas/i });
      expect(linksToSurah.length).toBeGreaterThanOrEqual(4);
    });

    it("links to reader page for Al-Fatiha", () => {
      render(<Home />);
      const link = screen.getByRole("link", { name: /al-fatiha/i });
      expect(link).toHaveAttribute("href", "/surah/1");
    });

    it("links to reader for Al-Ikhlas, Al-Falaq, An-Nas", () => {
      render(<Home />);
      expect(screen.getByRole("link", { name: /al-ikhlas/i })).toHaveAttribute("href", "/surah/112");
      expect(screen.getByRole("link", { name: /al-falaq/i })).toHaveAttribute("href", "/surah/113");
      expect(screen.getByRole("link", { name: /an-nas/i })).toHaveAttribute("href", "/surah/114");
    });

    it("shows ayah count for at least one surah", () => {
      render(<Home />);
      expect(screen.getByText(/7\s*ajeta|7 ayah/i)).toBeInTheDocument();
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
