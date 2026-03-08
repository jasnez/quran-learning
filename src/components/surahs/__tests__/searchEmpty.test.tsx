/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurahsContent } from "../SurahsContent";
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
];

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("Search no results", () => {
  it("when search has no matches shows Nije pronadjeno", async () => {
    const user = userEvent.setup();
    render(<SurahsContent surahs={mockSurahs} />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "xyznonexistent");
    expect(screen.getByText(/nije pronađeno|nije pronadjeno/i)).toBeInTheDocument();
  });

  it("suggests trying again or different search", async () => {
    const user = userEvent.setup();
    render(<SurahsContent surahs={mockSurahs} />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "xyznonexistent");
    expect(
      screen.getByText(/pokušajte ponovo|probajte drugi|drugačiji|druga pretraga/i)
    ).toBeInTheDocument();
  });
});
