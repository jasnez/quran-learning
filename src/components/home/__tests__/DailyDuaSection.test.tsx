/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyDuaSection } from "../DailyDuaSection";

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

vi.mock("@/lib/duas/data", () => ({
  QURANIC_DUAS: [],
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
    const links = screen.getAllByRole("link", { href: "/duas" });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
