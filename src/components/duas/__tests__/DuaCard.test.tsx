/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DuaCard } from "../DuaCard";
import type { QuranicDua } from "@/types/duas";

const mockDua: QuranicDua = {
  id: "2:201",
  surahNumber: 2,
  ayahNumber: 201,
  arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",
  transliteration: "Rabbana atina fid-dunya hasanatan",
  translationBosnian: "Gospodaru naš, daj nam u ovom svijetu dobro.",
  category: "rabbana",
};

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("DuaCard", () => {
  it("renders Arabic text", () => {
    render(<DuaCard dua={mockDua} />);
    expect(screen.getByText(mockDua.arabic)).toBeInTheDocument();
  });

  it("renders transliteration", () => {
    render(<DuaCard dua={mockDua} />);
    const els = screen.getAllByText(/Rabbana atina/);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Bosnian translation", () => {
    render(<DuaCard dua={mockDua} />);
    const els = screen.getAllByText(/Gospodaru naš, daj nam/);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it("shows citation as Kur'an surah:ayah", () => {
    render(<DuaCard dua={mockDua} />);
    const els = screen.getAllByText(/Kur'an\s+2:201/i);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it("citation link goes to surah reader with ayah param", () => {
    render(<DuaCard dua={mockDua} />);
    const links = screen.getAllByRole("link", { name: /Kur'an\s+2:201/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/surah/2?ayah=201");
  });

  it("labels as from Quran (dova iz Kur'ana or similar)", () => {
    render(<DuaCard dua={mockDua} />);
    const els = screen.getAllByText(/Dova iz Kur/i);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it("when dua has ayahEnd (merged range), shows citation as Kur'an 3:191–194 and links to first ayah", () => {
    const mergedDua = {
      ...mockDua,
      id: "3:191-194",
      surahNumber: 3,
      ayahNumber: 191,
      ayahEnd: 194,
      arabic: "Arabic combined",
      transliteration: "Trans combined",
      translationBosnian: "Bosnian combined",
      category: "rabbana" as const,
    };
    render(<DuaCard dua={mergedDua} />);
    const link = screen.getByRole("link", { name: /Kur'an\s+3:191[–-]194/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/surah/3?ayah=191");
  });
});
