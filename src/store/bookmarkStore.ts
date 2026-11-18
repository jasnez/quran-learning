import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bookmark, BookmarkCollection } from "@/types/bookmarks";
import { getSafeStorage } from "./safeStorage";

/**
 * Version 0 cut the stored text at these lengths, mid-word and without an ellipsis (QA P2-8).
 * Version 1 stores the whole ayah; the bookmarks page clamps it to two lines.
 */
const LEGACY_ARABIC_LENGTH = 50;
const LEGACY_TRANSLATION_LENGTH = 80;

/**
 * A text saved by version 0: one at the old limit was most likely cut, so it ends after its
 * last whole word, with an ellipsis. (An ayah exactly that long loses its last word in the
 * preview; the full ayah is one click away.)
 */
function repairLegacyPreview(text: string, limit: number): string {
  if (text.length !== limit) return text;
  const lastSpace = text.lastIndexOf(" ");
  return `${(lastSpace > 0 ? text.slice(0, lastSpace) : text).trimEnd()}…`;
}

function migrateBookmarks(persisted: unknown, version: number): unknown {
  const state = persisted as { bookmarks?: Bookmark[] } | null;
  if (version >= 1 || !Array.isArray(state?.bookmarks)) return persisted;
  return {
    ...state,
    bookmarks: state.bookmarks.map((b) => ({
      ...b,
      arabicText: repairLegacyPreview(b.arabicText, LEGACY_ARABIC_LENGTH),
      ...(b.translationBosnian != null
        ? { translationBosnian: repairLegacyPreview(b.translationBosnian, LEGACY_TRANSLATION_LENGTH) }
        : {}),
    })),
  };
}

/**
 * Pure check over the bookmark list. Render code must use this through a
 * selector, `useBookmarkStore((s) => hasBookmark(s.bookmarks, surah, ayah))`,
 * not the `isBookmarked` action: actions read live state via `get()`, which
 * already holds localStorage data during hydration and breaks it (QA P1-6).
 */
export function hasBookmark(bookmarks: Bookmark[], surahNumber: number, ayahNumber: number): boolean {
  const id = bookmarkId(surahNumber, ayahNumber);
  return bookmarks.some((b) => b.id === id);
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
          arabicText,
          createdAt: new Date().toISOString(),
          ...(translationBosnian != null && translationBosnian !== "" ? { translationBosnian } : {}),
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

      isBookmarked: (surahNumber, ayahNumber) => hasBookmark(get().bookmarks, surahNumber, ayahNumber),

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
      version: 1,
      migrate: migrateBookmarks,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        collections: state.collections,
      }),
    }
  )
);
