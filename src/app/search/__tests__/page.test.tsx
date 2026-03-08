/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPage from "../page";
import type { SearchResult } from "@/types/quran";

const mockSearchResults: SearchResult[] = [
  {
    surahId: "1",
    surahName: "Al-Fatiha",
    ayahNumber: 1,
    ayahId: "1:1",
    snippet: "U ime Allaha, Milostivog, Samilosnog!",
    snippetHighlight: 'U ime Allaha, <mark>Milostivog</mark>, Samilosnog!',
    arabicSnippet: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
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
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("../actions", () => ({
  searchAyahsAction: vi.fn((q: string) => {
    if (!q || q.length < 2) return Promise.resolve([]);
    if (q.toLowerCase().includes("milostiv")) return Promise.resolve(mockSearchResults);
    return Promise.resolve([]);
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Search page", () => {
  it("renders a large search input with placeholder", () => {
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "search");
  });

  it("shows empty state when no query has been entered", () => {
    render(<SearchPage />);
    expect(
      screen.getByText(/nije pronađeno|pronadjeno/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pokušajte sa drugim pojmom|pokusajte/i)
    ).toBeInTheDocument();
  });

  it("shows no results message when search returns empty", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "xyznonexistent");
    await screen.findByText(/nije pronađeno|pronadjeno/i);
    expect(
      screen.getByText(/pokušajte sa drugim pojmom|pokusajte/i)
    ).toBeInTheDocument();
  });

  it("shows results when search matches", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const link = await screen.findByRole("link", { name: /al-fatiha|1:1|milostiv/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/surah/1?ayah=1#ayah-1-1");
  });

  it("result shows surah name and ayah number", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("link", { href: "/surah/1?ayah=1#ayah-1-1" });
    expect(screen.getByText(/al-fatiha/i)).toBeInTheDocument();
    expect(screen.getByText(/ajet\s*1|1:1/i)).toBeInTheDocument();
  });

  it("result shows Arabic snippet", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("link", { href: /\/surah\/1\?ayah=1/ });
    expect(screen.getByText(/بِسْمِ ٱللَّهِ/)).toBeInTheDocument();
  });

  it("result link includes ?ayah= query param for scroll target", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const link = await screen.findByRole("link", { href: /\/surah\/1\?ayah=1/ });
    expect(link).toHaveAttribute("href", "/surah/1?ayah=1#ayah-1-1");
  });

  it("matching text in snippet has highlight styling (mark element)", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("link", { href: /\/surah\/1\?ayah=1/ });
    const mark = document.querySelector("p mark");
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent?.toLowerCase()).toMatch(/milostiv/);
  });

  it("results list is keyboard navigable (role list, tabindex for focus)", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const list = await screen.findByRole("list");
    expect(list).toBeInTheDocument();
    const links = screen.getAllByRole("link", { href: /\/surah\/\d+\?ayah=\d+/ });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("shows recent searches when input is empty and localStorage has entries", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) =>
      key === "quran-search-recent" ? JSON.stringify(["allah", "rahman"]) : null
    );
    render(<SearchPage />);
    await waitFor(() => {
      const el = document.querySelector("[data-recent-searches]");
      expect(el).toBeInTheDocument();
      expect(el?.textContent).toMatch(/allah|rahman|nedavne/i);
    });
    vi.mocked(Storage.prototype.getItem).mockRestore();
  });
});
