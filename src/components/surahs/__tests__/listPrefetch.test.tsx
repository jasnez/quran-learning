/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { SurahSummary } from "@/types/quran";
import surahsData from "@/data/surahs.json";
import { getAllJuz } from "@/lib/data/juzUtils";
import { SurahListItem } from "../SurahListItem";
import { JuzListCard } from "../JuzListCard";

// Exposes the prefetch prop that next/link would act on.
vi.mock("next/link", () => ({
  default: ({ children, href, prefetch }: { children: React.ReactNode; href: string; prefetch?: boolean | null }) => (
    <a href={href} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
}));

const surahs = surahsData as SurahSummary[];

afterEach(cleanup);

// QA section 6: with the default prefetch, scrolling the lists downloaded every surah
// (~1.1 MB) or juz (~0.9 MB) payload on mobile data. A surah loads when it is opened.
describe("long list links do not prefetch", () => {
  it("surah list item", () => {
    render(<SurahListItem surah={surahs[1]} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-prefetch", "false");
  });

  it("juz list card", () => {
    render(<JuzListCard juz={getAllJuz()[0]} allSurahs={surahs} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-prefetch", "false");
  });
});
