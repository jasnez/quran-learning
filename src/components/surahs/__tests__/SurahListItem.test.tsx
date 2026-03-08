/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SurahListItem } from "../SurahListItem";
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
  useProgressStore: vi.fn((selector: (s: { getSurahProgress: typeof mockGetSurahProgress }) => unknown) =>
    selector({ getSurahProgress: mockGetSurahProgress })
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  mockGetSurahProgress.mockReturnValue(undefined);
});

describe("SurahListItem", () => {
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
    const bar = container.querySelector(".bg-amber-200");
    expect(bar).toBeInTheDocument();
    expect(screen.queryByText(/završeno/i)).not.toBeInTheDocument();
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
    render(<SurahListItem surah={mockSurah} />);
    expect(screen.getByText(/završeno/i)).toBeInTheDocument();
  });
});
