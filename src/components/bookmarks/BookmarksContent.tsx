"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Bookmark } from "@/types/bookmarks";
import type { SurahSummary } from "@/types/quran";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useSettingsStore } from "@/store/settingsStore";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { getRelativeTimeBosnian } from "@/lib/utils/relativeTime";

type SortOption = "date" | "surah";

type BookmarksContentProps = { surahs: SurahSummary[] };

const EMPTY_MESSAGE =
  "Nemate označenih ajeta. Označite ajete klikom na bookmark ikonu dok čitate.";

export function BookmarksContent({ surahs }: BookmarksContentProps) {
  const getAllBookmarks = useBookmarkStore((s) => s.getAllBookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const updateBookmarkNote = useBookmarkStore((s) => s.updateBookmarkNote);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);

  const [sortBy, setSortBy] = useState<SortOption>("surah");
  const [confirmRemove, setConfirmRemove] = useState<Bookmark | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");

  const bookmarks = getAllBookmarks();
  const surahMap = useMemo(() => {
    const m = new Map<number, SurahSummary>();
    surahs.forEach((s) => m.set(s.surahNumber, s));
    return m;
  }, [surahs]);

  const grouped = useMemo(() => {
    const groups = new Map<number, Bookmark[]>();
    const sorted =
      sortBy === "date"
        ? [...bookmarks].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        : [...bookmarks].sort(
            (a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber
          );
    sorted.forEach((b) => {
      const list = groups.get(b.surahNumber) ?? [];
      list.push(b);
      groups.set(b.surahNumber, list);
    });
    const surahOrder = sortBy === "surah" ? Array.from(groups.keys()).sort((a, b) => a - b) : Array.from(groups.keys()).sort((a, b) => {
      const aMax = Math.max(...(groups.get(a) ?? []).map((x) => new Date(x.createdAt).getTime()));
      const bMax = Math.max(...(groups.get(b) ?? []).map((x) => new Date(x.createdAt).getTime()));
      return bMax - aMax;
    });
    return surahOrder.map((surahNumber) => ({
      surahNumber,
      surah: surahMap.get(surahNumber),
      bookmarks: groups.get(surahNumber) ?? [],
    }));
  }, [bookmarks, sortBy, surahMap]);

  const handleRemoveConfirm = (b: Bookmark) => {
    removeBookmark(b.surahNumber, b.ayahNumber);
    setConfirmRemove(null);
  };

  const startEditNote = (b: Bookmark) => {
    setEditingNoteId(b.id);
    setEditNoteValue(b.note ?? "");
  };

  const saveNote = (id: string) => {
    if (editingNoteId === id) {
      updateBookmarkNote(id, editNoteValue);
      setEditingNoteId(null);
      setEditNoteValue("");
    }
  };

  if (bookmarks.length === 0) {
    return (
      <main className="mx-auto max-w-[800px] px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 md:text-3xl">
          Označeni ajeti
        </h1>
        <div
          className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-6 py-16 dark:border-stone-700 dark:bg-stone-900/30"
          data-empty-state
        >
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
            aria-hidden
          >
            <BookmarkIcon className="h-8 w-8" />
          </span>
          <p className="mt-6 max-w-sm text-center text-stone-600 dark:text-stone-400">
            {EMPTY_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 md:text-3xl">
          Označeni ajeti
        </h1>
        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
          <span>Sortiraj:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
            aria-label="Sortiraj po"
          >
            <option value="surah">Po suri</option>
            <option value="date">Po datumu dodavanja</option>
          </select>
        </label>
      </div>

      <ul className="space-y-12 list-none" role="list">
        {grouped.map(({ surahNumber, surah, bookmarks: groupBookmarks }) => (
          <li key={surahNumber}>
            <h2
              className="mb-6 border-b border-stone-200 pb-2 dark:border-stone-700"
              id={`surah-${surahNumber}`}
            >
              <span className="font-arabic text-xl font-medium text-stone-900 dark:text-stone-100" dir="rtl" lang="ar">
                {surah?.nameArabic ?? ""}
              </span>
              <span className="ml-2 text-lg text-stone-600 dark:text-stone-400">
                {surah?.nameLatin ?? ""}
              </span>
            </h2>
            <ul className="space-y-6 list-none" role="list">
              {groupBookmarks.map((b) => (
                <li key={b.id}>
                  <article className="rounded-2xl border border-stone-200 bg-[var(--theme-card)] p-5 transition-colors dark:border-stone-700 md:px-6 md:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/surah/${b.surahNumber}?ayah=${b.ayahNumber}`}
                          className="group block"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400"
                              aria-hidden
                            >
                              {b.ayahNumber}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              {getRelativeTimeBosnian(b.createdAt)}
                            </span>
                          </div>
                          <div className="mt-3">
                            <TajwidTextRenderer
                              segments={[{ text: b.arabicText, rule: "normal" }]}
                              showColors={showTajwidColors}
                              className="text-left text-lg"
                            />
                          </div>
                          {b.translationBosnian && (
                            <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                              {b.translationBosnian}
                            </p>
                          )}
                        </Link>
                        {editingNoteId === b.id ? (
                          <div className="mt-4">
                            <input
                              type="text"
                              value={editNoteValue}
                              onChange={(e) => setEditNoteValue(e.target.value)}
                              onBlur={() => saveNote(b.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveNote(b.id);
                              }}
                              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                              placeholder="Dodaj bilješku..."
                              aria-label="Bilješka"
                              autoFocus
                            />
                          </div>
                        ) : (
                          (b.note || null) && (
                            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
                              {b.note}
                              <button
                                type="button"
                                onClick={() => startEditNote(b)}
                                className="ml-2 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                              >
                                Uredi
                              </button>
                            </p>
                          )
                        )}
                        {!b.note && editingNoteId !== b.id && (
                          <button
                            type="button"
                            onClick={() => startEditNote(b)}
                            className="mt-4 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                          >
                            + Dodaj bilješku
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(b)}
                          className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          aria-label="Ukloni bookmark"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {confirmRemove && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-remove-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Ukloniti bookmark?
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Ajet {confirmRemove.surahNameLatin} {confirmRemove.ayahNumber} će biti uklonjen iz označenih.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 rounded-lg border border-stone-200 py-2 text-sm font-medium text-stone-700 dark:border-stone-600 dark:text-stone-300"
              >
                Odustani
              </button>
              <button
                type="button"
                onClick={() => handleRemoveConfirm(confirmRemove)}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Ukloni
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
