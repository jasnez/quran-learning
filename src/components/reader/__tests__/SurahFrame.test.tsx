/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";
import { SurahFrame } from "../SurahFrame";

const surah = (surahsData as SurahSummary[]).find((s) => s.surahNumber === 76)!;

afterEach(() => {
  cleanup();
  useProgressStore.setState(useProgressStore.getInitialState(), true);
});

describe("SurahFrame counts", () => {
  it("reads the ayah count and revelation place with the right plural form", () => {
    expect(surah.ayahCount).toBe(31);
    render(<SurahFrame surah={surah} />);
    expect(screen.getByText("31 ajet · Medina")).toBeInTheDocument();
  });

  it("shows listened progress as one visible phrase", () => {
    useProgressStore.setState({
      surahProgressMap: {
        76: {
          surahNumber: 76,
          totalAyahs: 31,
          ayahsListened: new Set([1, 2, 3]),
          ayahsRead: new Set(),
          completionPercent: 10,
          lastAccessedAt: new Date().toISOString(),
          timeSpentMs: 0,
        },
      },
    });
    render(<SurahFrame surah={surah} />);
    expect(screen.getByText("Preslušano: 3 od 31 ajeta")).toBeInTheDocument();
    expect(screen.queryByLabelText(/preslušano/i)).toBeNull();
  });
});
