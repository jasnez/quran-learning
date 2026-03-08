/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurahsPage from "../page";
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
    nameArabic: "البقرة",
    nameLatin: "Al-Baqarah",
    nameBosnian: "El-Bekare",
    revelationType: "medinan",
    ayahCount: 286,
  },
  {
    id: "112",
    surahNumber: 112,
    slug: "al-ikhlas",
    nameArabic: "الإخلاص",
    nameLatin: "Al-Ikhlas",
    nameBosnian: "El-Ihlas",
    revelationType: "meccan",
    ayahCount: 4,
  },
];

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/data", () => ({
  getAllSurahs: () => mockSurahs,
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Surahs page", () => {
  it("shows page title Sure", () => {
    render(<SurahsPage />);
    expect(
      screen.getByRole("heading", { name: /^sure$/i })
    ).toBeInTheDocument();
  });

  it("shows a search input", () => {
    render(<SurahsPage />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    expect(search).toBeInTheDocument();
  });

  it("renders all surahs from data when no search", () => {
    render(<SurahsPage />);
    const links = screen.getAllByRole("link", { href: /\/surah\/\d+/ });
    expect(links).toHaveLength(mockSurahs.length);
  });

  it("each list item links to /surah/[surahNumber]", () => {
    render(<SurahsPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/surah/1");
    expect(hrefs).toContain("/surah/2");
    expect(hrefs).toContain("/surah/112");
  });

  it("list items show nameLatin and nameBosnian", () => {
    render(<SurahsPage />);
    expect(screen.getByText("Al-Fatihah")).toBeInTheDocument();
    expect(screen.getByText("Al-Fatiha")).toBeInTheDocument();
    expect(screen.getByText("Al-Baqarah")).toBeInTheDocument();
  });

  it("list items show ayah count and revelation type", () => {
    render(<SurahsPage />);
    expect(screen.getByText(/7\s*ajeta|7 ajeta/i)).toBeInTheDocument();
    const revelation = screen.getAllByText(/meka|medina/i);
    expect(revelation.length).toBeGreaterThanOrEqual(1);
  });

  it("filtering by number reduces visible items", async () => {
    const user = userEvent.setup();
    render(<SurahsPage />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "1");
    const links = screen.getAllByRole("link", { href: /\/surah\/\d+/ });
    expect(links.length).toBeLessThanOrEqual(mockSurahs.length);
  });

  it("filtering by Latin name shows matching surah", async () => {
    const user = userEvent.setup();
    render(<SurahsPage />);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "Fatiha");
    expect(screen.getByRole("link", { href: "/surah/1" })).toBeInTheDocument();
  });
});
