/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuaCard } from "../DuaCard";
import type { QuranicDua } from "@/types/duas";

const playAyahIdsSpy = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: Object.assign(vi.fn(), {
    getState: () => ({ playAyahIds: playAyahIdsSpy }),
  }),
}));

beforeEach(() => {
  cleanup();
  playAyahIdsSpy.mockClear();
});

const mockDua: QuranicDua = {
  id: "2:201",
  surahNumber: 2,
  ayahNumber: 201,
  arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",
  transliteration: "Rabbana atina fid-dunya hasanatan",
  translationBosnian: "Gospodaru naš, daj nam u ovom svijetu dobro.",
  category: "rabbana",
};

describe("DuaCard", () => {
  beforeEach(() => {
    playAyahIdsSpy.mockClear();
  });

  it("renders a play button to listen to the dua", () => {
    render(<DuaCard dua={mockDua} />);
    const playBtns = screen.getAllByRole("button", { name: /slušaj dovu/i });
    expect(playBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("clicking play button calls playAyahIds with single ayah id for single-verse dua", async () => {
    const user = userEvent.setup();
    render(<DuaCard dua={mockDua} />);
    const playBtns = screen.getAllByRole("button", { name: /slušaj dovu/i });
    await user.click(playBtns[0]);
    expect(playAyahIdsSpy).toHaveBeenCalledTimes(1);
    expect(playAyahIdsSpy).toHaveBeenCalledWith(["2:201"]);
  });

  it("clicking play on merged dua calls playAyahIds with all ayah ids in range", async () => {
    const user = userEvent.setup();
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
    const playBtns = screen.getAllByRole("button", { name: /slušaj dovu/i });
    await user.click(playBtns[0]);
    expect(playAyahIdsSpy).toHaveBeenCalledTimes(1);
    expect(playAyahIdsSpy).toHaveBeenCalledWith(["3:191", "3:192", "3:193", "3:194"]);
  });

  it("renders Arabic text", () => {
    render(<DuaCard dua={mockDua} />);
    const els = screen.getAllByText(mockDua.arabic);
    expect(els.length).toBeGreaterThanOrEqual(1);
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

  it("renders as wide card (full width of container)", () => {
    render(<DuaCard dua={mockDua} />);
    const article = document.querySelector("article");
    expect(article).toBeInTheDocument();
    expect(article?.className).toMatch(/\bw-full\b/);
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
    const links = screen.getAllByRole("link", { name: /Kur'an\s+3:191[–-]194/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/surah/3?ayah=191");
  });
});
