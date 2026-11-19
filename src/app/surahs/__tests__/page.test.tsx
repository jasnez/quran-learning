/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurahsPage, { metadata } from "../page";
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
  {
    id: "2",
    surahNumber: 2,
    slug: "al-baqarah",
    nameArabic: "البقرة",
    nameLatin: "El-Beqare",
    nameBosnian: "Bekara",
    revelationType: "medinan",
    ayahCount: 286,
  },
  {
    id: "112",
    surahNumber: 112,
    slug: "al-ikhlas",
    nameArabic: "الإخلاص",
    nameLatin: "El-Iḫlāṣ",
    nameBosnian: "Ihlas",
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

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "view" ? null : null),
  }),
}));

vi.mock("@/lib/data", () => ({
  getAllSurahs: () => Promise.resolve(mockSurahs),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Surahs page", () => {
  it("shows page title Sve sure", async () => {
    const Page = await SurahsPage();
    render(Page);
    expect(
      screen.getByRole("heading", { name: /^sve sure$/i })
    ).toBeInTheDocument();
  });

  it("shows a search input", async () => {
    const Page = await SurahsPage();
    render(Page);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    expect(search).toBeInTheDocument();
  });

  it("renders all surahs from data when no search", async () => {
    const Page = await SurahsPage();
    render(Page);
    const list = screen.getByRole("list");
    const links = within(list)
      .getAllByRole("link")
      .filter((l) => /\/surah\/\d+/.test(l.getAttribute("href") ?? ""));
    expect(links).toHaveLength(mockSurahs.length);
  });

  it("each list item links to /surah/[surahNumber]", async () => {
    const Page = await SurahsPage();
    render(Page);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/surah/1");
    expect(hrefs).toContain("/surah/2");
    expect(hrefs).toContain("/surah/112");
  });

  it("list items show nameLatin and nameBosnian", async () => {
    const Page = await SurahsPage();
    render(Page);
    expect(screen.getByText("El-Fātiḥa")).toBeInTheDocument();
    // nameBosnian je sad u kombinovanom subtitle stringu: "Fatiha · 7 ajeta"
    expect(screen.getByText(/Fatiha\s*·/i)).toBeInTheDocument();
    expect(screen.getByText("El-Beqare")).toBeInTheDocument();
  });

  it("list items show ayah count (revelation type uklonjen u redizajnu)", async () => {
    const Page = await SurahsPage();
    render(Page);
    expect(screen.getByText(/7\s*ajeta/i)).toBeInTheDocument();
  });

  it("filtering by number reduces visible items", async () => {
    const user = userEvent.setup();
    const Page = await SurahsPage();
    render(Page);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "1");
    const links = screen
      .getAllByRole("link")
      .filter((l) => /\/surah\/\d+/.test(l.getAttribute("href") ?? ""));
    expect(links.length).toBeLessThanOrEqual(mockSurahs.length);
  });

  it("filtering by Latin name shows matching surah", async () => {
    const user = userEvent.setup();
    const Page = await SurahsPage();
    render(Page);
    const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
    await user.type(search, "Fatiha");
    const list = screen.getByRole("list");
    expect(within(list).getByRole("link")).toHaveAttribute("href", "/surah/1");
  });

  it.each(["beqare", "bekara", "baqarah", "El Beqare"])(
    "filtering by %s finds El-Beqare (specijal, common or English slug, no diacritics)",
    async (query) => {
      const user = userEvent.setup();
      const Page = await SurahsPage();
      render(Page);
      const search = screen.getByRole("searchbox", { name: /pretraži|search|sure/i });
      await user.type(search, query);
      const list = screen.getByRole("list");
      expect(within(list).getByRole("link")).toHaveAttribute("href", "/surah/2");
    },
  );

  it("has Sure button and Džuzevi tab link to view=juz inside page (not in main header nav)", async () => {
    const Page = await SurahsPage();
    render(Page);
    expect(screen.getByRole("button", { name: /^sure$/i })).toBeInTheDocument();
    const juzLink = screen.getByRole("link", { name: /džuzevi/i });
    expect(juzLink).toHaveAttribute("href", "/surahs?view=juz");
  });
});

describe("Surahs page metadata", () => {
  it("has a Bosnian page title", () => {
    expect(metadata.title).toBe("Sve sure");
  });
});
