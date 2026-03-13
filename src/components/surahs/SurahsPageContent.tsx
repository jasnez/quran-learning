"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "./SearchInput";
import { SurahList } from "./SurahList";
import { JuzListCard } from "./JuzListCard";
import type { SurahSummary } from "@/types/quran";
import type { JuzInfo } from "@/types/quran";

function filterSurahs(surahs: SurahSummary[], query: string): SurahSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return surahs;
  return surahs.filter(
    (s) =>
      String(s.surahNumber).includes(q) ||
      s.nameLatin.toLowerCase().includes(q) ||
      s.nameBosnian.toLowerCase().includes(q) ||
      s.nameArabic.includes(query.trim())
  );
}

type ViewMode = "surahs" | "juz";

type SurahsPageContentProps = {
  surahs: SurahSummary[];
  juzList: JuzInfo[];
  initialView?: ViewMode;
};

export function SurahsPageContent({ surahs, juzList, initialView = "surahs" }: SurahsPageContentProps) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const [view, setView] = useState<ViewMode>(() => {
    if (viewParam === "juz") return "juz";
    return initialView;
  });

  useEffect(() => {
    if (viewParam === "juz") setView("juz");
    else setView("surahs");
  }, [viewParam]);

  const [query, setQuery] = useState("");
  const filteredSurahs = useMemo(() => filterSurahs(surahs, query), [surahs, query]);
  const isEmptySearch = query.trim() !== "" && filteredSurahs.length === 0;

  const showSurahs = view === "surahs";
  const showJuz = view === "juz";

  const setViewSurahs = () => {
    setView("surahs");
    window.history.replaceState(null, "", "/surahs");
  };
  const setViewJuz = () => {
    setView("juz");
    window.history.replaceState(null, "", "/surahs?view=juz");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--theme-border)] pb-4">
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Pregled:</span>
        <div className="flex rounded-lg border border-[var(--theme-border)] p-0.5">
          <button
            type="button"
            onClick={setViewSurahs}
            aria-pressed={showSurahs}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              showSurahs
                ? "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            }`}
          >
            Sure
          </button>
          <a
            href="/surahs?view=juz"
            onClick={(e) => {
              e.preventDefault();
              setViewJuz();
            }}
            aria-pressed={showJuz}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              showJuz
                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            }`}
          >
            Džuzevi
          </a>
        </div>
      </div>

      {showSurahs && (
        <>
          <SearchInput value={query} onChange={setQuery} />
          {isEmptySearch ? (
            <div className="py-12 text-center" role="status">
              <p className="font-medium text-stone-700 dark:text-stone-300">Nije pronađeno</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Pokušajte ponovo s drugim pojmom ili provjerite pravopis.
              </p>
            </div>
          ) : (
            <SurahList surahs={filteredSurahs} />
          )}
        </>
      )}

      {showJuz && (
        <>
          <ul className="space-y-3" role="list">
            {juzList.map((juz) => (
              <li key={juz.juz}>
                <JuzListCard juz={juz} allSurahs={surahs} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
