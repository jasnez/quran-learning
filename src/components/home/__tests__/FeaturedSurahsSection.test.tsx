/**
 * @vitest-environment jsdom
 */
// QA P2-3: the home page showed "14.285714285714285% završeno" for a surah in progress.
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";
import { FeaturedSurahsSection } from "../FeaturedSurahsSection";

const surahs = surahsData as SurahSummary[];

afterEach(() => {
  cleanup();
  useProgressStore.setState(useProgressStore.getInitialState(), true);
});

describe("FeaturedSurahsSection progress", () => {
  it("shows a whole-number percentage for a surah in progress", () => {
    useProgressStore.setState({
      surahProgressMap: {
        1: {
          surahNumber: 1,
          totalAyahs: 7,
          ayahsListened: new Set([1]),
          ayahsRead: new Set(),
          completionPercent: (1 / 7) * 100,
          lastAccessedAt: new Date().toISOString(),
          timeSpentMs: 0,
        },
      },
    });
    render(<FeaturedSurahsSection allSurahs={surahs} />);
    expect(screen.getByText("14% završeno · 7 ajeta")).toBeInTheDocument();
  });
});
