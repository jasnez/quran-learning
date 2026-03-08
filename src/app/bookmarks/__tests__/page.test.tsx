/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
      getAllBookmarks: mockGetAllBookmarks,
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
    expect(screen.getByRole("heading", { name: /označeni ajeti/i })).toBeInTheDocument();
  });

  it("shows empty state when no bookmarks", () => {
    mockGetAllBookmarks.mockReturnValue([]);
    render(<BookmarksContent surahs={mockSurahs} />);
    expect(
      screen.getByText(/nemate označenih ajeta|označite ajete klikom/i)
    ).toBeInTheDocument();
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

  it("each bookmark links to /surah/[id]?ayah=[number]", () => {
    mockGetAllBookmarks.mockReturnValue([mockBookmarks[0]]);
    render(<BookmarksContent surahs={mockSurahs} />);
    const links = screen.getAllByRole("link");
    const surahLink = links.find((el) => (el as HTMLAnchorElement).getAttribute("href") === "/surah/1?ayah=1");
    expect(surahLink).toBeDefined();
    expect(surahLink).toBeInTheDocument();
  });

  it("remove button opens confirmation and removes on confirm", async () => {
    const user = userEvent.setup();
    mockGetAllBookmarks.mockReturnValue([mockBookmarks[0]]);
    render(<BookmarksContent surahs={mockSurahs} />);
    const removeBtn = screen.getByRole("button", { name: /ukloni bookmark/i });
    await user.click(removeBtn);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const confirmBtn = within(dialog).getByRole("button", { name: "Ukloni" });
    await user.click(confirmBtn);
    expect(mockRemoveBookmark).toHaveBeenCalledWith(1, 1);
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
    expect(screen.getByRole("combobox", { name: /sortiraj po/i })).toBeInTheDocument();
  });
});
