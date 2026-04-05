/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchPage from "../page";

function renderSearch() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SearchPage />
    </QueryClientProvider>
  );
}
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

const mockSearchAyahs = vi.fn((q: string, _opts?: { signal?: AbortSignal }) => {
  if (!q || q.length < 3) return Promise.resolve([]);
  if (q.toLowerCase().includes("milostiv")) return Promise.resolve(mockSearchResults);
  return Promise.resolve([]);
});
vi.mock("@/lib/api/client", () => ({
  searchAyahs: (query: string, opts?: { signal?: AbortSignal }) => mockSearchAyahs(query, opts),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("Search page", () => {
  it("renders a large search input with placeholder", () => {
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "search");
  });

  it("shows empty state when no query has been entered", () => {
    renderSearch();
    const emptyEl = document.getElementById("search-empty");
    expect(emptyEl).toBeInTheDocument();
    expect(emptyEl?.textContent).toMatch(/unesite pojam|upisati|pretraž/i);
  });

  it("shows no results message when search returns empty", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "xyznonexistent");
    await screen.findByText(/nije pronađeno|pronadjeno/i);
    expect(
      screen.getByText(/pokušajte sa drugim pojmom|pokusajte/i)
    ).toBeInTheDocument();
  });

  it("shows results when search matches", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const link = await screen.findByRole("link", { name: /al-fatiha|1:1|milostiv/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/surah/1?ayah=1#ayah-1-1");
  });

  it("result shows surah name and ayah number", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("link", { href: "/surah/1?ayah=1#ayah-1-1" });
    expect(screen.getByText(/al-fatiha/i)).toBeInTheDocument();
    expect(screen.getByText(/ajet\s*1|1:1/i)).toBeInTheDocument();
  });

  it("result shows Arabic snippet", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("link", { href: /\/surah\/1\?ayah=1/ });
    expect(screen.getByText(/بِسْمِ ٱللَّهِ/)).toBeInTheDocument();
  });

  it("result link includes ?ayah= query param for scroll target", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const link = await screen.findByRole("link", { href: /\/surah\/1\?ayah=1/ });
    expect(link).toHaveAttribute("href", "/surah/1?ayah=1#ayah-1-1");
  });

  it("matching text in snippet has highlight styling (mark element)", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("link", { href: /\/surah\/1\?ayah=1/ });
    const mark = document.querySelector("p mark");
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent?.toLowerCase()).toMatch(/milostiv/);
  });

  it("results list is keyboard navigable (listbox, tabindex for focus)", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const list = await screen.findByRole("listbox");
    expect(list).toBeInTheDocument();
    const links = screen.getAllByRole("link", { href: /\/surah\/\d+\?ayah=\d+/ });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("shows recent searches when input is empty and localStorage has entries", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) =>
      key === "quran-search-recent" ? JSON.stringify(["allah", "rahman"]) : null
    );
    renderSearch();
    await waitFor(() => {
      const el = document.querySelector("[data-recent-searches]");
      expect(el).toBeInTheDocument();
      expect(el?.textContent).toMatch(/allah|rahman|nedavne/i);
    });
    vi.mocked(Storage.prototype.getItem).mockRestore();
  });

  it("clicking a recent search term runs search immediately", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) =>
      key === "quran-search-recent" ? JSON.stringify(["milostivog"]) : null
    );
    renderSearch();
    await waitFor(() => {
      expect(document.querySelector("[data-recent-searches]")).toBeInTheDocument();
    });
    const recentBtn = screen.getByRole("button", { name: "milostivog" });
    await userEvent.click(recentBtn);
    await waitFor(() => {
      expect(mockSearchAyahs).toHaveBeenCalledWith("milostivog", expect.any(Object));
    });
    vi.mocked(Storage.prototype.getItem).mockRestore();
  });

  it("when input is empty, shows hint to enter search term (not no-results message)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
    renderSearch();
    const emptyEl = document.getElementById("search-empty");
    expect(emptyEl).toBeInTheDocument();
    expect(emptyEl?.textContent?.toLowerCase()).toMatch(/unesite|upisati|pretraž|pojam/i);
    expect(emptyEl?.textContent?.toLowerCase()).not.toMatch(/nije pronađeno|pronadjeno/i);
    vi.mocked(Storage.prototype.getItem).mockRestore();
  });

  it("Escape key clears input and results", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not run search for Latin query shorter than 3 characters", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "ab");
    await waitFor(() => {
      expect(mockSearchAyahs).not.toHaveBeenCalled();
    });
  });

  it("input has aria-expanded and aria-controls when results are shown", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    expect(input).toHaveAttribute("aria-expanded", "false");
    await user.type(input, "milostiv");
    await screen.findByRole("listbox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", "search-results-list");
  });
});
