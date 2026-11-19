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
    expect(screen.getByText("14% preslušano · 7 ajeta")).toBeInTheDocument();
  });

  it("uses the singular form for 31 ayahs and the few form for 4", () => {
    const dehr = surahs.find((s) => s.surahNumber === 76)!;
    const ikhlas = surahs.find((s) => s.surahNumber === 112)!;
    expect([dehr.ayahCount, ikhlas.ayahCount]).toEqual([31, 4]);
    useProgressStore.setState({
      surahProgressMap: {
        76: {
          surahNumber: 76,
          totalAyahs: 31,
          ayahsListened: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
          ayahsRead: new Set(),
          completionPercent: (13 / 31) * 100,
          lastAccessedAt: new Date().toISOString(),
          timeSpentMs: 0,
        },
      },
    });
    render(<FeaturedSurahsSection allSurahs={surahs} />);
    expect(screen.getByText("42% preslušano · 31 ajet")).toBeInTheDocument();
    expect(screen.getByText("4 ajeta")).toBeInTheDocument();
  });
});

describe("FeaturedSurahsSection copy", () => {
  it("explains the list for a new visitor", () => {
    render(<FeaturedSurahsSection allSurahs={surahs} />);
    expect(screen.getByText("Počni s kratkim surama koje se često uče.")).toBeInTheDocument();
  });

  it("explains the list once a surah was visited", () => {
    useProgressStore.setState({ surahsVisited: [1] });
    render(<FeaturedSurahsSection allSurahs={surahs} />);
    expect(screen.getByText("Započete sure i kratke sure za početak.")).toBeInTheDocument();
  });
});
