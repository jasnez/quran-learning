/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useBookmarkStore, BOOKMARK_STORAGE_KEY } from "../bookmarkStore";

describe("bookmarkStore", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") localStorage.clear();
    useBookmarkStore.setState({ bookmarks: [], collections: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("initial state", () => {
    it("has empty bookmarks and collections", () => {
      const state = useBookmarkStore.getState();
      expect(state.bookmarks).toEqual([]);
      expect(state.collections).toEqual([]);
    });
  });

  describe("addBookmark", () => {
    it("adds a bookmark with required fields and truncates arabicText to 50 chars", () => {
      const longArabic = "ا".repeat(60);
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", longArabic);
      const bookmarks = useBookmarkStore.getState().bookmarks;
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].id).toBe("1-1");
      expect(bookmarks[0].surahNumber).toBe(1);
      expect(bookmarks[0].ayahNumber).toBe(1);
      expect(bookmarks[0].surahNameLatin).toBe("Al-Fatihah");
      expect(bookmarks[0].arabicText).toHaveLength(50);
      expect(bookmarks[0].arabicText).toBe("ا".repeat(50));
      expect(bookmarks[0].createdAt).toBeDefined();
      expect(new Date(bookmarks[0].createdAt).toISOString()).toBe(bookmarks[0].createdAt);
    });

    it("does not add duplicate for same surah and ayah", () => {
      useBookmarkStore.getState().addBookmark(2, 3, "Al-Baqarah", "بِسْمِ");
      useBookmarkStore.getState().addBookmark(2, 3, "Al-Baqarah", "بِسْمِ");
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
    });
  });

  describe("removeBookmark", () => {
    it("removes bookmark by surah and ayah", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
      useBookmarkStore.getState().removeBookmark(1, 1);
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
    });

    it("does nothing when no matching bookmark", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      useBookmarkStore.getState().removeBookmark(2, 1);
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
    });
  });

  describe("toggleBookmark", () => {
    it("adds when not bookmarked", () => {
      useBookmarkStore.getState().toggleBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
      expect(useBookmarkStore.getState().isBookmarked(1, 1)).toBe(true);
    });

    it("removes when already bookmarked", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      useBookmarkStore.getState().toggleBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
      expect(useBookmarkStore.getState().isBookmarked(1, 1)).toBe(false);
    });
  });

  describe("isBookmarked", () => {
    it("returns true when surah-ayah is bookmarked", () => {
      useBookmarkStore.getState().addBookmark(2, 255, "Al-Baqarah", "آية");
      expect(useBookmarkStore.getState().isBookmarked(2, 255)).toBe(true);
    });

    it("returns false when not bookmarked", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      expect(useBookmarkStore.getState().isBookmarked(1, 2)).toBe(false);
      expect(useBookmarkStore.getState().isBookmarked(2, 1)).toBe(false);
    });
  });

  describe("updateBookmarkNote", () => {
    it("updates note for bookmark by id", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      const id = useBookmarkStore.getState().bookmarks[0].id;
      useBookmarkStore.getState().updateBookmarkNote(id, "My note");
      expect(useBookmarkStore.getState().bookmarks[0].note).toBe("My note");
    });

    it("does nothing for unknown id", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      useBookmarkStore.getState().updateBookmarkNote("99-99", "Note");
      expect(useBookmarkStore.getState().bookmarks[0].note).toBeUndefined();
    });
  });

  describe("getBookmarksBySurah", () => {
    it("returns only bookmarks for given surah", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "ا");
      useBookmarkStore.getState().addBookmark(1, 2, "Al-Fatihah", "ب");
      useBookmarkStore.getState().addBookmark(2, 1, "Al-Baqarah", "ت");
      const bySurah = useBookmarkStore.getState().getBookmarksBySurah(1);
      expect(bySurah).toHaveLength(2);
      expect(bySurah.every((b) => b.surahNumber === 1)).toBe(true);
    });

    it("returns empty array when no bookmarks for surah", () => {
      useBookmarkStore.getState().addBookmark(2, 1, "Al-Baqarah", "ا");
      expect(useBookmarkStore.getState().getBookmarksBySurah(1)).toEqual([]);
    });
  });

  describe("getAllBookmarks", () => {
    it("returns all bookmarks", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "ا");
      useBookmarkStore.getState().addBookmark(2, 1, "Al-Baqarah", "ب");
      const all = useBookmarkStore.getState().getAllBookmarks();
      expect(all).toHaveLength(2);
    });
  });

  describe("createCollection", () => {
    it("adds a collection with name and optional color", () => {
      useBookmarkStore.getState().createCollection("Favorites", "#3b82f6");
      const collections = useBookmarkStore.getState().collections;
      expect(collections).toHaveLength(1);
      expect(collections[0].name).toBe("Favorites");
      expect(collections[0].color).toBe("#3b82f6");
      expect(collections[0].id).toBeDefined();
      expect(collections[0].createdAt).toBeDefined();
    });

    it("adds collection without color", () => {
      useBookmarkStore.getState().createCollection("My list");
      expect(useBookmarkStore.getState().collections[0].color).toBeUndefined();
    });
  });

  describe("deleteCollection", () => {
    it("removes collection and clears collectionId from bookmarks in it", () => {
      useBookmarkStore.getState().createCollection("Favorites");
      const collId = useBookmarkStore.getState().collections[0].id;
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "ا");
      useBookmarkStore.getState().moveToCollection("1-1", collId);
      useBookmarkStore.getState().deleteCollection(collId);
      expect(useBookmarkStore.getState().collections).toHaveLength(0);
      expect(useBookmarkStore.getState().bookmarks[0].collectionId).toBeUndefined();
    });
  });

  describe("moveToCollection", () => {
    it("sets collectionId on bookmark", () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "ا");
      useBookmarkStore.getState().createCollection("Favorites");
      const collId = useBookmarkStore.getState().collections[0].id;
      useBookmarkStore.getState().moveToCollection("1-1", collId);
      expect(useBookmarkStore.getState().bookmarks[0].collectionId).toBe(collId);
    });

    it("does nothing for unknown bookmark id", () => {
      useBookmarkStore.getState().createCollection("Favorites");
      const collId = useBookmarkStore.getState().collections[0].id;
      useBookmarkStore.getState().moveToCollection("99-99", collId);
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
    });
  });

  describe("persistence", () => {
    it("uses expected localStorage key", () => {
      expect(BOOKMARK_STORAGE_KEY).toBe("quran-learning-bookmarks");
    });

    it("persists bookmarks to localStorage and rehydrates on refresh", async () => {
      useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatihah", "بِسْمِ");
      const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.bookmarks).toHaveLength(1);
      expect(parsed.state.bookmarks[0].id).toBe("1-1");

      useBookmarkStore.setState({ bookmarks: [], collections: [] });
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);

      // Simulate refresh: restore persisted data (setState above overwrote localStorage)
      localStorage.setItem(BOOKMARK_STORAGE_KEY, stored!);
      await useBookmarkStore.persist.rehydrate();
      expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
      expect(useBookmarkStore.getState().bookmarks[0].id).toBe("1-1");
      expect(useBookmarkStore.getState().bookmarks[0].surahNameLatin).toBe("Al-Fatihah");
    });
  });
});
