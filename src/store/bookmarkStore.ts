import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bookmark, BookmarkCollection } from "@/types/bookmarks";
import { getSafeStorage } from "./safeStorage";

const ARABIC_PREVIEW_LENGTH = 50;
const TRANSLATION_PREVIEW_LENGTH = 80;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max);
}

function bookmarkId(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}-${ayahNumber}`;
}

type BookmarkState = {
  bookmarks: Bookmark[];
  collections: BookmarkCollection[];
};

type BookmarkActions = {
  addBookmark: (
    surahNumber: number,
    ayahNumber: number,
    surahNameLatin: string,
    arabicText: string,
    translationBosnian?: string
  ) => void;
  removeBookmark: (surahNumber: number, ayahNumber: number) => void;
  toggleBookmark: (
    surahNumber: number,
    ayahNumber: number,
    surahNameLatin: string,
    arabicText: string,
    translationBosnian?: string
  ) => void;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  updateBookmarkNote: (id: string, note: string) => void;
  getBookmarksBySurah: (surahNumber: number) => Bookmark[];
  getAllBookmarks: () => Bookmark[];
  createCollection: (name: string, color?: string) => void;
  deleteCollection: (id: string) => void;
  moveToCollection: (bookmarkId: string, collectionId: string) => void;
};

export const BOOKMARK_STORAGE_KEY = "quran-learning-bookmarks";

export const useBookmarkStore = create<BookmarkState & BookmarkActions>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      collections: [],

      addBookmark: (surahNumber, ayahNumber, surahNameLatin, arabicText, translationBosnian) => {
        const id = bookmarkId(surahNumber, ayahNumber);
        if (get().bookmarks.some((b) => b.id === id)) return;
        const bookmark: Bookmark = {
          id,
          surahNumber,
          ayahNumber,
          surahNameLatin,
          arabicText: truncate(arabicText, ARABIC_PREVIEW_LENGTH),
          createdAt: new Date().toISOString(),
          ...(translationBosnian != null && translationBosnian !== ""
            ? { translationBosnian: truncate(translationBosnian, TRANSLATION_PREVIEW_LENGTH) }
            : {}),
        };
        set((s) => ({ bookmarks: [...s.bookmarks, bookmark] }));
      },

      removeBookmark: (surahNumber, ayahNumber) => {
        const id = bookmarkId(surahNumber, ayahNumber);
        set((s) => ({
          bookmarks: s.bookmarks.filter((b) => b.id !== id),
        }));
      },

      toggleBookmark: (surahNumber, ayahNumber, surahNameLatin, arabicText, translationBosnian) => {
        if (get().isBookmarked(surahNumber, ayahNumber)) {
          get().removeBookmark(surahNumber, ayahNumber);
        } else {
          get().addBookmark(surahNumber, ayahNumber, surahNameLatin, arabicText, translationBosnian);
        }
      },

      isBookmarked: (surahNumber, ayahNumber) => {
        const id = bookmarkId(surahNumber, ayahNumber);
        return get().bookmarks.some((b) => b.id === id);
      },

      updateBookmarkNote: (id, note) => {
        set((s) => ({
          bookmarks: s.bookmarks.map((b) =>
            b.id === id ? { ...b, note } : b
          ),
        }));
      },

      getBookmarksBySurah: (surahNumber) => {
        return get().bookmarks.filter((b) => b.surahNumber === surahNumber);
      },

      getAllBookmarks: () => get().bookmarks,

      createCollection: (name, color) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `col-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const collection: BookmarkCollection = {
          id,
          name,
          color,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ collections: [...s.collections, collection] }));
      },

      deleteCollection: (id) => {
        set((s) => ({
          collections: s.collections.filter((c) => c.id !== id),
          bookmarks: s.bookmarks.map((b) =>
            b.collectionId === id ? { ...b, collectionId: undefined } : b
          ),
        }));
      },

      moveToCollection: (bookmarkId, collectionId) => {
        set((s) => ({
          bookmarks: s.bookmarks.map((b) =>
            b.id === bookmarkId ? { ...b, collectionId } : b
          ),
        }));
      },
    }),
    {
      name: BOOKMARK_STORAGE_KEY,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        collections: state.collections,
      }),
    }
  )
);
