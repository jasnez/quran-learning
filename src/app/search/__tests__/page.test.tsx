/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    snippetScript: "latin",
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

const mockSearchAyahs = vi.fn<
  (q: string, opts?: { signal?: AbortSignal }) => Promise<SearchResult[]>
>((q) => {
  if (!q || q.length < 3) return Promise.resolve([]);
  if (q.toLowerCase().includes("milostiv")) return Promise.resolve(mockSearchResults);
  return Promise.resolve([]);
});
vi.mock("@/lib/search/searchClient", () => ({
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
    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/surah/1?ayah=1#ayah-1-1");
    expect(screen.getByText(/al-fatiha/i)).toBeInTheDocument();
    expect(screen.getByText(/ajet\s*1|1:1/i)).toBeInTheDocument();
  });

  it("result shows Arabic snippet", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    expect(await screen.findByRole("link")).toHaveAttribute(
      "href",
      expect.stringMatching(/\/surah\/1\?ayah=1/)
    );
    expect(screen.getByText(/بِسْمِ ٱللَّهِ/)).toBeInTheDocument();
  });

  it("result link includes ?ayah= query param for scroll target", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/surah/1?ayah=1#ayah-1-1");
  });

  it("matching text in snippet has highlight styling (mark element)", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    await user.type(input, "milostiv");
    expect(await screen.findByRole("link")).toHaveAttribute(
      "href",
      expect.stringMatching(/\/surah\/1\?ayah=1/)
    );
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
    const links = screen
      .getAllByRole("link")
      .filter((l) => /\/surah\/\d+\?ayah=\d+/.test(l.getAttribute("href") ?? ""));
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

  it("mobile sticky search bar sits below the fixed global header (QA P1-3)", () => {
    renderSearch();
    const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
    const bar = input.parentElement!;
    const c = bar.className.split(/\s+/);
    expect(c).toContain("sticky");
    expect(c).toContain("top-[var(--app-header-offset)]");
    expect(c).not.toContain("top-0");
  });

  describe("focus stays in the input (QA P1-4)", () => {
    const twoResults: SearchResult[] = [
      mockSearchResults[0],
      { ...mockSearchResults[0], ayahNumber: 3, ayahId: "1:3" },
    ];

    // Vitest 4: mockReset restores the implementation passed to vi.fn().
    afterEach(() => mockSearchAyahs.mockReset());

    it("keeps focus in the input when results arrive", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve(twoResults));
      const user = userEvent.setup();
      renderSearch();
      const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
      await user.type(input, "milostiv");
      await screen.findByRole("listbox");
      expect(document.activeElement).toBe(input);
      expect(input).toHaveAttribute("aria-activedescendant", "search-result-0");
    });

    it("arrow keys move aria-activedescendant without moving focus", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve(twoResults));
      const user = userEvent.setup();
      renderSearch();
      const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
      await user.type(input, "milostiv");
      await screen.findByRole("listbox");
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(input);
      expect(input).toHaveAttribute("aria-activedescendant", "search-result-1");
      expect(document.getElementById("search-result-1")).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{ArrowUp}");
      expect(document.activeElement).toBe(input);
      expect(input).toHaveAttribute("aria-activedescendant", "search-result-0");
    });

    it("typing after results arrive keeps going into the input", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve(twoResults));
      const user = userEvent.setup();
      renderSearch();
      const input = screen.getByPlaceholderText(/pretrazi ajete|pretraži ajete/i);
      await user.type(input, "milostiv");
      await screen.findByRole("listbox");
      await user.keyboard("og");
      expect(input).toHaveValue("milostivog");
    });
  });

  // QA P2-5: an Arabic match was shown in a left-to-right Latin paragraph and then again below.
  describe("Arabic match", () => {
    const words = mockSearchResults[0].arabicSnippet.split(" ");
    const arabicResult: SearchResult = {
      ...mockSearchResults[0],
      snippet: words.join(" "),
      snippetHighlight: `${words[0]} <mark>${words[1]}</mark> ${words.slice(2).join(" ")}`,
      snippetScript: "arabic",
    };

    afterEach(() => mockSearchAyahs.mockReset());

    it("shows the highlighted Arabic once, right to left, in the Arabic font", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve([arabicResult]));
      const user = userEvent.setup();
      renderSearch();
      await user.type(screen.getByPlaceholderText(/pretraži ajete/i), words[1]);
      const option = await screen.findByRole("option");
      const mark = option.querySelector("mark");
      expect(mark).toHaveTextContent(words[1]);
      const paragraph = mark!.closest("p")!;
      expect(paragraph).toHaveAttribute("dir", "rtl");
      expect(paragraph).toHaveAttribute("lang", "ar");
      expect(paragraph.className).toContain("font-arabic");
      expect(option.querySelectorAll("p[dir='rtl']")).toHaveLength(1);
    });

    it("keeps a Latin match left to right, with the Arabic preview below it", async () => {
      const user = userEvent.setup();
      renderSearch();
      await user.type(screen.getByPlaceholderText(/pretraži ajete/i), "milostiv");
      const option = await screen.findByRole("option");
      const mark = option.querySelector("mark");
      expect(mark!.closest("p")).not.toHaveAttribute("dir", "rtl");
      const arabic = option.querySelector("p[dir='rtl']");
      expect(arabic).toHaveAttribute("lang", "ar");
      expect(arabic).toHaveTextContent(words[0]);
    });
  });

  // QA P2-5: results stopped at 50, with no total and no way to see the rest.
  describe("many results", () => {
    const many: SearchResult[] = Array.from({ length: 120 }, (_, i) => ({
      ...mockSearchResults[0],
      surahId: "2",
      ayahNumber: i + 1,
      ayahId: `2:${i + 1}`,
    }));

    afterEach(() => mockSearchAyahs.mockReset());

    it("shows the first 50 with the total, and 50 more per click", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve(many));
      const user = userEvent.setup();
      renderSearch();
      await user.type(screen.getByPlaceholderText(/pretraži ajete/i), "milostiv");
      await screen.findByRole("listbox");
      expect(screen.getAllByRole("option")).toHaveLength(50);
      expect(screen.getByText("Prikazano 50 od 120 rezultata")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Prikaži još" }));
      expect(screen.getAllByRole("option")).toHaveLength(100);
      expect(screen.getByText("Prikazano 100 od 120 rezultata")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Prikaži još" }));
      expect(screen.getAllByRole("option")).toHaveLength(120);
      expect(screen.getByText("120 rezultata")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Prikaži još" })).not.toBeInTheDocument();
    });

    it("arrow keys wrap within the results on screen", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve(many));
      const user = userEvent.setup();
      renderSearch();
      const input = screen.getByPlaceholderText(/pretraži ajete/i);
      await user.type(input, "milostiv");
      await screen.findByRole("listbox");
      await user.keyboard("{ArrowUp}");
      expect(input).toHaveAttribute("aria-activedescendant", "search-result-49");
    });

    it("starts again from 50 for a new query", async () => {
      mockSearchAyahs.mockImplementation(() => Promise.resolve(many));
      const user = userEvent.setup();
      renderSearch();
      const input = screen.getByPlaceholderText(/pretraži ajete/i);
      await user.type(input, "milostiv");
      await screen.findByRole("listbox");
      await user.click(screen.getByRole("button", { name: "Prikaži još" }));
      expect(screen.getAllByRole("option")).toHaveLength(100);
      await user.type(input, "og");
      await waitFor(() => expect(mockSearchAyahs).toHaveBeenCalledWith("milostivog", expect.anything()));
      await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(50));
    });

    it("names a single result in the singular", async () => {
      const user = userEvent.setup();
      renderSearch();
      await user.type(screen.getByPlaceholderText(/pretraži ajete/i), "milostiv");
      await screen.findByRole("listbox");
      expect(screen.getByText("1 rezultat")).toBeInTheDocument();
    });
  });
});
