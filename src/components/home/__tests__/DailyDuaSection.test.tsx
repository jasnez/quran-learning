/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyDuaSection } from "../DailyDuaSection";
import { getDailyDua } from "@/lib/duas/dailyDua";

vi.mock("@/lib/duas/dailyDua", () => ({
  getDailyDua: vi.fn(() => ({
    id: "2:201",
    surahNumber: 2,
    ayahNumber: 201,
    arabic: "رَبَّنَا آتِنَا",
    transliteration: "Rabbana atina",
    translationBosnian: "Gospodaru naš, daj nam dobro.",
    category: "rabbana",
  })),
}));

// Two ayahs of one dua: 23:98 alone starts mid-sentence (QA P2-8).
vi.mock("@/lib/duas/data", () => ({
  QURANIC_DUAS: [
    { id: "23:97", surahNumber: 23, ayahNumber: 97, arabic: "a", transliteration: "a", translationBosnian: "i reci: \"Tebi se ja", category: "rabbana" },
    { id: "23:98", surahNumber: 23, ayahNumber: 98, arabic: "b", transliteration: "b", translationBosnian: "i Tebi se\"", category: "rabbana" },
  ],
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("DailyDuaSection", () => {
  it("renders a heading for daily dua", () => {
    render(<DailyDuaSection />);
    expect(
      screen.getByRole("heading", { name: /dova\s+dana|daily\s+dua/i })
    ).toBeInTheDocument();
  });

  it("shows the daily dua translation or Arabic", () => {
    render(<DailyDuaSection />);
    const els = screen.getAllByText(/Gospodaru naš, daj nam dobro/i);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it("shows citation Kur'an surah:ayah", () => {
    render(<DailyDuaSection />);
    const els = screen.getAllByText(/Kur'an\s+2:201/i);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it("includes link to full duas page", () => {
    render(<DailyDuaSection />);
    const links = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/duas");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("picks from the same whole duas as the duas page, not from single ayahs", () => {
    render(<DailyDuaSection />);
    expect(vi.mocked(getDailyDua)).toHaveBeenCalledWith([
      expect.objectContaining({ id: "23:97-98", ayahNumber: 97, ayahEnd: 98 }),
    ]);
  });
});
