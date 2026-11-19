/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SurahListItem } from "../SurahListItem";
import { JuzListCard } from "../JuzListCard";
import { getAllJuz } from "@/lib/data/juzUtils";
import type { SurahSummary } from "@/types/quran";

const mockSurah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "Al-Fatiha",
  revelationType: "meccan",
  ayahCount: 7,
};

const mockGetSurahProgress = vi.fn();
vi.mock("@/store/progressStore", () => ({
  // surahProgressMap[n] answers with mockGetSurahProgress(n).
  useProgressStore: vi.fn((selector: (s: { surahProgressMap: Record<number, unknown> }) => unknown) =>
    selector({ surahProgressMap: new Proxy({}, { get: (_map, key) => mockGetSurahProgress(Number(key)) }) })
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

afterEach(cleanup);

beforeEach(() => {
  mockGetSurahProgress.mockReturnValue(undefined);
});

describe("SurahListItem", () => {
  it("counts ayahs with the right plural form", () => {
    const first = render(<SurahListItem surah={{ ...mockSurah, ayahCount: 21 }} />);
    expect(screen.getByText(/· 21 ajet$/)).toBeInTheDocument();
    first.unmount();
    render(<SurahListItem surah={{ ...mockSurah, ayahCount: 4 }} />);
    expect(screen.getByText(/· 4 ajeta$/)).toBeInTheDocument();
  });

  it("renders surah name and link to reader", () => {
    render(<SurahListItem surah={mockSurah} />);
    const link = screen.getByRole("link", { name: /al-fatihah/i });
    expect(link).toHaveAttribute("href", "/surah/1");
  });

  it("shows no progress bar when progress is 0%", () => {
    mockGetSurahProgress.mockReturnValue(undefined);
    const { container } = render(<SurahListItem surah={mockSurah} />);
    const progressBars = container.querySelectorAll('[aria-label*="preslušano"]');
    expect(progressBars.length).toBe(0);
    expect(screen.queryByText(/završeno/i)).not.toBeInTheDocument();
  });

  it("shows progress bar and percent when 1-99%", () => {
    mockGetSurahProgress.mockReturnValue({
      surahNumber: 1,
      totalAyahs: 7,
      ayahsListened: new Set([1, 2, 3]),
      ayahsRead: new Set([]),
      completionPercent: 42,
      lastAccessedAt: "",
      timeSpentMs: 0,
    });
    const { container } = render(<SurahListItem surah={mockSurah} />);
    expect(screen.getByText("43%")).toBeInTheDocument();
    const bar = container.querySelector(".bg-emerald-400");
    expect(bar).toBeInTheDocument();
    expect(screen.queryByLabelText(/završeno/i)).not.toBeInTheDocument();
  });

  it("shows Završeno badge when 100%", () => {
    mockGetSurahProgress.mockReturnValue({
      surahNumber: 1,
      totalAyahs: 7,
      ayahsListened: new Set([1, 2, 3, 4, 5, 6, 7]),
      ayahsRead: new Set([]),
      completionPercent: 100,
      lastAccessedAt: "",
      timeSpentMs: 0,
    });
    const { container } = render(<SurahListItem surah={mockSurah} />);
    // The text is for screen readers (no aria-label on a plain span); the icon stays hidden.
    expect(screen.getByText("Završeno")).toHaveClass("sr-only");
    expect(container.querySelector("[aria-label]")).toBeNull();
  });

  it("names the percent with sr-only text, not an aria-label", () => {
    mockGetSurahProgress.mockReturnValue({
      surahNumber: 1,
      totalAyahs: 7,
      ayahsListened: new Set([1, 2, 3]),
      ayahsRead: new Set([]),
      completionPercent: 42,
      lastAccessedAt: "",
      timeSpentMs: 0,
    });
    const { container } = render(<SurahListItem surah={mockSurah} />);
    expect(screen.getByText("43%")).toBeInTheDocument();
    expect(screen.getByText("preslušano", { exact: false })).toHaveClass("sr-only");
    expect(container.querySelector("[aria-label]")).toBeNull();
  });
});

describe("JuzListCard", () => {
  it("names the percent with sr-only text, not an aria-label", () => {
    mockGetSurahProgress.mockReturnValue({
      surahNumber: 1,
      totalAyahs: 7,
      ayahsListened: new Set([1, 2, 3, 4, 5, 6, 7]),
      ayahsRead: new Set([]),
      completionPercent: 100,
      lastAccessedAt: "",
      timeSpentMs: 0,
    });
    const { container } = render(<JuzListCard juz={getAllJuz()[0]} allSurahs={[mockSurah]} />);
    expect(screen.getByText(/^\d+%$/)).toBeInTheDocument();
    expect(screen.getByText("preslušano", { exact: false })).toHaveClass("sr-only");
    expect(container.querySelector("[aria-label]")).toBeNull();
  });
});
