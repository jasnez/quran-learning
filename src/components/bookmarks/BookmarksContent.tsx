"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Bookmark } from "@/types/bookmarks";
import type { SurahSummary } from "@/types/quran";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useSettingsStore } from "@/store/settingsStore";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { ButtonLink } from "@/components/ui/Button";
import { formatTimeAgo } from "@/lib/format";

type SortOption = "date" | "surah";

type BookmarksContentProps = { surahs: SurahSummary[] };

const EMPTY_MESSAGE =
  "Još nema sačuvanih ajeta. Ajet se čuva dodirom na ikonu za čuvanje pored njega.";

// The bookmarks are in localStorage, so the static HTML (and the hydration render) cannot know
// them: false until then, so the page does not claim "no bookmarks" before it has looked.
const subscribeMount = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export function BookmarksContent({ surahs }: BookmarksContentProps) {
  const mounted = useSyncExternalStore(subscribeMount, getMounted, getMountedServer);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const updateBookmarkNote = useBookmarkStore((s) => s.updateBookmarkNote);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);

  const [sortBy, setSortBy] = useState<SortOption>("surah");
  const sortId = useId();
  const [confirmRemove, setConfirmRemove] = useState<Bookmark | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  // After a removal the trash button is gone with its item, so focus goes to the page heading.
  // The flag is set on confirm; the effect below runs after the list (or empty state) rendered.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeadingRef = useRef(false);

  useEffect(() => {
    if (!focusHeadingRef.current) return;
    focusHeadingRef.current = false;
    headingRef.current?.focus();
  });

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
    focusHeadingRef.current = true;
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

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-read font-bold text-ink md:text-3xl">
          Sačuvani ajeti
        </h1>
        <div
          className="mt-8 min-h-48 w-full animate-pulse rounded-2xl border border-line bg-surface/50"
          aria-hidden
          data-testid="bookmarks-placeholder"
        />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-read font-bold text-ink md:text-3xl"
        >
          Sačuvani ajeti
        </h1>
        <div
          className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/50 px-6 py-16"
          data-empty-state
        >
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-wash text-accent-text"
            aria-hidden
          >
            <BookmarkIcon className="h-8 w-8" />
          </span>
          <p className="mt-6 max-w-sm text-center text-ink-muted">
            {EMPTY_MESSAGE}
          </p>
          <ButtonLink href="/surahs" variant="secondary" size="md" className="mt-6">
            Sve sure
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-read font-bold text-ink md:text-3xl"
        >
          Sačuvani ajeti
        </h1>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <label htmlFor={sortId}>Redoslijed</label>
          <select
            id={sortId}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink"
          >
            <option value="surah">Po redu u Kur&apos;anu</option>
            <option value="date">Najnovije prvo</option>
          </select>
        </div>
      </div>

      <ul className="space-y-12 list-none" role="list">
        {grouped.map(({ surahNumber, surah, bookmarks: groupBookmarks }) => (
          <li key={surahNumber}>
            <h2
              className="mb-6 border-b border-line pb-2"
              id={`surah-${surahNumber}`}
            >
              <span className="font-arabic text-xl font-normal text-ink" dir="rtl" lang="ar">
                {surah?.nameArabic ?? ""}
              </span>
              <span className="ml-2 text-lg text-ink-muted">
                {surah?.nameLatin ?? ""}
              </span>
            </h2>
            <ul className="space-y-6 list-none" role="list">
              {groupBookmarks.map((b) => (
                <li key={b.id}>
                  <article className="rounded-2xl border border-line bg-surface p-5 transition-colors md:px-6 md:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/surah/${b.surahNumber}?ayah=${b.ayahNumber}`}
                          className="group block"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-sm font-medium text-ink-muted"
                              aria-hidden
                            >
                              {b.ayahNumber}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {formatTimeAgo(b.createdAt)}
                            </span>
                          </div>
                          <div className="mt-3">
                            <TajwidTextRenderer
                              segments={[{ text: b.arabicText, rule: "normal" }]}
                              showColors={showTajwidColors}
                              className="line-clamp-2 text-right text-2xl"
                            />
                          </div>
                          {b.translationBosnian && (
                            <p className="mt-2 line-clamp-2 font-read text-sm text-ink-muted">
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
                              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                              placeholder="Bilješka uz ajet"
                              aria-label="Bilješka uz ajet"
                              autoFocus
                            />
                          </div>
                        ) : (
                          (b.note || null) && (
                            <p className="mt-4 text-sm text-ink-muted">
                              {b.note}
                              <button
                                type="button"
                                onClick={() => startEditNote(b)}
                                className="ml-2 text-xs text-accent-text hover:underline"
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
                            className="mt-4 text-sm text-ink-muted hover:text-ink"
                          >
                            Dodaj bilješku
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(b)}
                          className="rounded-lg p-2 text-ink-muted hover:bg-surface-sunken hover:text-danger-text"
                          aria-label={`Ukloni iz sačuvanih: ${surah?.nameLatin ?? b.surahNameLatin}, ${b.ayahNumber}. ajet`}
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

      <ModalDialog
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        labelledBy="confirm-remove-title"
        className="max-w-sm"
      >
        {confirmRemove && (
          <>
            <h2 id="confirm-remove-title" className="text-lg font-semibold text-ink">
              Ukloniti {confirmRemove.ayahNumber}. ajet sure{" "}
              {surahMap.get(confirmRemove.surahNumber)?.nameLatin ?? confirmRemove.surahNameLatin} iz sačuvanih?
            </h2>
            {confirmRemove.note && (
              <p className="mt-2 text-sm text-ink-muted">
                Bilješka uz ovaj ajet briše se s njim.
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 rounded-lg border border-line py-2 text-sm font-medium text-ink"
              >
                Odustani
              </button>
              <button
                type="button"
                onClick={() => handleRemoveConfirm(confirmRemove)}
                className="flex-1 rounded-lg bg-danger py-2 text-sm font-medium text-on-accent hover:bg-danger/90"
              >
                Ukloni
              </button>
            </div>
          </>
        )}
      </ModalDialog>
    </div>
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
