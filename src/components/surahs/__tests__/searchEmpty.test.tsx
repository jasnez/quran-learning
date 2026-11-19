/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurahsPageContent } from "../SurahsPageContent";
import type { SurahSummary } from "@/types/quran";

const mockSurahs: SurahSummary[] = [
  {
    id: "1",
    surahNumber: 1,
    slug: "al-fatiha",
    nameArabic: "الفاتحة",
    nameLatin: "El-Fātiḥa",
    nameBosnian: "Fatiha",
    revelationType: "meccan",
    ayahCount: 7,
  },
];

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("Search no results", () => {
  it("when search has no matches shows Nije pronadjeno", async () => {
    render(<SurahsPageContent surahs={mockSurahs} juzList={[]} />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await userEvent.clear(search);
    await userEvent.type(search, "xyznonexistent", { delay: 0 });
    expect(await screen.findByText("Nema takve sure", {}, { timeout: 8000 })).toBeInTheDocument();
  }, 10000);

  it("suggests trying again or different search", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(<SurahsPageContent surahs={mockSurahs} juzList={[]} />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "xyznonexistent");
    expect(
      await screen.findByText(
        "Traži se po broju od 1 do 114 ili po dijelu naziva, npr. jasin.",
        {},
        { timeout: 8000 },
      ),
    ).toBeInTheDocument();
  }, 10000);
});
