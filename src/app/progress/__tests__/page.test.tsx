/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressPage from "../page";
import type { SurahSummary } from "@/types/quran";

const mockSurahs: SurahSummary[] = [
  {
    id: "1",
    surahNumber: 1,
    slug: "al-fatiha",
    nameArabic: "الفاتحة",
    nameLatin: "Al-Fatihah",
    nameBosnian: "Al-Fatiha",
    revelationType: "meccan",
    ayahCount: 7,
  },
  {
    id: "2",
    surahNumber: 2,
    slug: "al-baqarah",
    nameLatin: "Al-Baqarah",
    nameBosnian: "Al-Bekare",
    nameArabic: "البقرة",
    revelationType: "medinan",
    ayahCount: 286,
  },
];

vi.mock("@/lib/data", () => ({
  getAllSurahs: vi.fn(() => Promise.resolve(mockSurahs)),
}));

const mockStore = {
  getOverallProgress: () => ({
    totalSurahsStarted: 1,
    totalAyahsListened: 7,
    totalAyahsRead: 0,
    overallCompletionPercent: 0.11,
  }),
  surahProgressMap: {
    1: {
      surahNumber: 1,
      totalAyahs: 7,
      ayahsListened: new Set([1, 2, 3, 4, 5, 6, 7]),
      ayahsRead: new Set(),
      completionPercent: 100,
      lastAccessedAt: new Date().toISOString(),
      timeSpentMs: 60000,
    },
    2: {
      surahNumber: 2,
      totalAyahs: 286,
      ayahsListened: new Set([1, 2]),
      ayahsRead: new Set(),
      completionPercent: 1,
      lastAccessedAt: new Date().toISOString(),
      timeSpentMs: 10000,
    },
  },
  totalListeningTimeMs: 70000,
};
vi.mock("@/store/progressStore", () => ({
  useProgressStore: vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Progress page", () => {
  it("renders page with Napredak heading", async () => {
    const Page = await ProgressPage();
    render(Page);
    expect(screen.getByRole("heading", { name: /napredak/i })).toBeInTheDocument();
  });

  it("has filter buttons: Sve, Započete, Završene, Nepočete", async () => {
    const Page = await ProgressPage();
    render(Page);
    const filterLabels = ["Sve", "Započete", "Završene", "Nepočete"];
    for (const label of filterLabels) {
      const buttons = screen.getAllByRole("button", { name: new RegExp(label, "i") });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
      expect(buttons[0]).toBeInTheDocument();
    }
  });

  it("has sort select with options", async () => {
    const Page = await ProgressPage();
    render(Page);
    const comboboxes = screen.getAllByRole("combobox", { name: /sortiraj po/i });
    expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    expect(comboboxes[0]).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: /redoslijed sura/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("option", { name: /po napretku/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("option", { name: /zadnji pristup/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("lists surahs with links to reader", async () => {
    const Page = await ProgressPage();
    render(Page);
    const links = screen.getAllByRole("link", { name: /al-fatihah/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/surah/1");
    const links2 = screen.getAllByRole("link", { name: /al-baqarah/i });
    expect(links2.length).toBeGreaterThanOrEqual(1);
    expect(links2[0]).toHaveAttribute("href", "/surah/2");
  });

  it("shows Završeno for completed surah and progress for in-progress", async () => {
    const Page = await ProgressPage();
    render(Page);
    const zavrseno = screen.getAllByText("Završeno");
    expect(zavrseno.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/7\/7 ajeta/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2\/286 ajeta/).length).toBeGreaterThanOrEqual(1);
  });
});
