/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { BookmarksContent } from "@/components/bookmarks/BookmarksContent";
import type { SurahSummary } from "@/types/quran";
import type { Bookmark } from "@/types/bookmarks";

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
];

const mockBookmarks: Bookmark[] = [
  {
    id: "1-1",
    surahNumber: 1,
    ayahNumber: 1,
    surahNameLatin: "Al-Fatihah",
    arabicText: "بِسْمِ",
    translationBosnian: "U ime Allaha",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2-1",
    surahNumber: 2,
    ayahNumber: 1,
    surahNameLatin: "Al-Baqarah",
    arabicText: "الم",
    translationBosnian: "Elif-lam-mim.",
    createdAt: new Date().toISOString(),
  },
];

const mockGetAllBookmarks = vi.fn();
const mockRemoveBookmark = vi.fn();
const mockUpdateBookmarkNote = vi.fn();

vi.mock("@/store/bookmarkStore", () => ({
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      get bookmarks() {
        return mockGetAllBookmarks();
      },
      removeBookmark: mockRemoveBookmark,
      updateBookmarkNote: mockUpdateBookmarkNote,
    })
  ),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ showTajwidColors: true })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("BookmarksContent", () => {
  it("renders page title Oznaceni ajeti", () => {
    mockGetAllBookmarks.mockReturnValue([]);
    render(<BookmarksContent surahs={mockSurahs} />);
    expect(screen.getByRole("heading", { name: /sačuvani ajeti/i })).toBeInTheDocument();
  });

  // The static HTML is built without the reader's bookmarks (they are in localStorage): it
  // showed "Nemate označenih ajeta" until the page hydrated, also to readers with bookmarks.
  it("static HTML shows a placeholder, not the empty state", () => {
    mockGetAllBookmarks.mockReturnValue([]);
    const html = renderToString(<BookmarksContent surahs={mockSurahs} />);
    expect(html).toContain("Sačuvani ajeti");
    expect(html).not.toContain("Još nema sačuvanih ajeta.");
    expect(html).not.toContain("data-empty-state");
    expect(html).toContain('data-testid="bookmarks-placeholder"');
  });

  it("shows empty state when no bookmarks", () => {
    mockGetAllBookmarks.mockReturnValue([]);
    render(<BookmarksContent surahs={mockSurahs} />);
    expect(
      screen.getByText(
        "Još nema sačuvanih ajeta. Ajet se čuva dodirom na ikonu za čuvanje pored njega.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sve sure" })).toHaveAttribute("href", "/surahs");
  });

  it("shows bookmarks grouped by surah when bookmarks exist", () => {
    mockGetAllBookmarks.mockReturnValue(mockBookmarks);
    render(<BookmarksContent surahs={mockSurahs} />);
    expect(screen.getByText("الفاتحة")).toBeInTheDocument();
    expect(screen.getByText("Al-Fatihah")).toBeInTheDocument();
    expect(screen.getByText("البقرة")).toBeInTheDocument();
    expect(screen.getByText("Al-Baqarah")).toBeInTheDocument();
    expect(screen.getByText("بِسْمِ")).toBeInTheDocument();
    expect(screen.getByText("U ime Allaha")).toBeInTheDocument();
  });

  // QA P2-8: the Arabic was left-aligned at 18 px.
  it("shows the Arabic right-aligned at reading size, clamped to two lines", () => {
    mockGetAllBookmarks.mockReturnValue([mockBookmarks[0]]);
    render(<BookmarksContent surahs={mockSurahs} />);
    const arabic = screen.getByText("بِسْمِ").closest("p")!;
    expect(arabic).toHaveAttribute("dir", "rtl");
    const classes = arabic.className.split(/\s+/);
    expect(classes).toContain("text-right");
    expect(classes).not.toContain("text-left");
    expect(classes).toContain("text-2xl");
    expect(classes).toContain("line-clamp-2");
  });

  it("shows when a bookmark was saved in words", () => {
    mockGetAllBookmarks.mockReturnValue([
      { ...mockBookmarks[0], createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    ]);
    render(<BookmarksContent surahs={mockSurahs} />);
    expect(screen.getByText("prije 2 minute")).toBeInTheDocument();
  });

  it("each bookmark links to /surah/[id]?ayah=[number]", () => {
    mockGetAllBookmarks.mockReturnValue([mockBookmarks[0]]);
    render(<BookmarksContent surahs={mockSurahs} />);
    const links = screen.getAllByRole("link");
    const surahLink = links.find((el) => (el as HTMLAnchorElement).getAttribute("href") === "/surah/1?ayah=1");
    expect(surahLink).toBeDefined();
    expect(surahLink).toBeInTheDocument();
  });

  describe("removing a bookmark", () => {
    const surah = mockSurahs[1].nameLatin;
    const target: Bookmark = { ...mockBookmarks[1], ayahNumber: 12, id: "2-12" };

    function setup(bookmarks: Bookmark[]) {
      mockGetAllBookmarks.mockReturnValue(bookmarks);
      return render(<BookmarksContent surahs={mockSurahs} />);
    }
    const trash = () =>
      screen.getByRole("button", { name: `Ukloni iz sačuvanih: ${surah}, 12. ajet` });
    const dialogName = `Ukloniti 12. ajet sure ${surah} iz sačuvanih?`;

    it("names the trash button by surah and ayah", () => {
      setup([target]);
      expect(trash()).toBeInTheDocument();
    });

    it("opens a native dialog named by the question, without body text when there is no note", async () => {
      const user = userEvent.setup();
      setup([target]);
      await user.click(trash());
      const dialog = screen.getByRole("dialog", { name: dialogName });
      expect(dialog.tagName).toBe("DIALOG");
      expect(dialog).not.toHaveAttribute("aria-modal");
      expect(within(dialog).queryByText(/bilješka uz ovaj ajet/i)).not.toBeInTheDocument();
    });

    it("warns that the note goes with the ayah when there is one", async () => {
      const user = userEvent.setup();
      setup([{ ...target, note: "Moja bilješka" }]);
      await user.click(trash());
      const dialog = screen.getByRole("dialog", { name: dialogName });
      expect(within(dialog).getByText("Bilješka uz ovaj ajet briše se s njim.")).toBeInTheDocument();
    });

    it("Odustani closes the dialog and keeps the bookmark", async () => {
      const user = userEvent.setup();
      setup([target]);
      await user.click(trash());
      const dialog = screen.getByRole("dialog", { name: dialogName });
      await user.click(within(dialog).getByRole("button", { name: "Odustani" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockRemoveBookmark).not.toHaveBeenCalled();
    });

    it("Ukloni removes the bookmark, closes the dialog and focuses the page heading", async () => {
      const user = userEvent.setup();
      setup([target, mockBookmarks[0]]);
      mockRemoveBookmark.mockImplementation(() => mockGetAllBookmarks.mockReturnValue([mockBookmarks[0]]));
      await user.click(trash());
      const dialog = screen.getByRole("dialog", { name: dialogName });
      await user.click(within(dialog).getByRole("button", { name: "Ukloni" }));
      expect(mockRemoveBookmark).toHaveBeenCalledWith(2, 12);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Sačuvani ajeti" })).toHaveFocus();
    });

    it("removing the only bookmark focuses the heading of the empty state", async () => {
      const user = userEvent.setup();
      setup([target]);
      mockRemoveBookmark.mockImplementation(() => mockGetAllBookmarks.mockReturnValue([]));
      await user.click(trash());
      const dialog = screen.getByRole("dialog", { name: dialogName });
      await user.click(within(dialog).getByRole("button", { name: "Ukloni" }));
      expect(document.querySelector("[data-empty-state]")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    });
  });

  it("note can be edited", async () => {
    const user = userEvent.setup();
    mockGetAllBookmarks.mockReturnValue([{ ...mockBookmarks[0], note: "My note" }]);
    render(<BookmarksContent surahs={mockSurahs} />);
    await user.click(screen.getByRole("button", { name: /uredi/i }));
    const noteInput = screen.getByDisplayValue("My note");
    await user.clear(noteInput);
    await user.type(noteInput, "Updated");
    noteInput.blur();
    expect(mockUpdateBookmarkNote).toHaveBeenCalledWith("1-1", "Updated");
  });

  it("has sort/filter options", () => {
    mockGetAllBookmarks.mockReturnValue(mockBookmarks);
    render(<BookmarksContent surahs={mockSurahs} />);
    const select = screen.getByRole("combobox", { name: "Redoslijed" });
    expect(select).not.toHaveAttribute("aria-label");
    expect(within(select).getByRole("option", { name: "Po redu u Kur'anu" })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Najnovije prvo" })).toBeInTheDocument();
  });
});
