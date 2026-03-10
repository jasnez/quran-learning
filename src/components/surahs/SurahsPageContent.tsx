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

  const [ramadanDay, setRamadanDay] = useState<number | null>(null);

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
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-950/20">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Ramazanski raspored:</span>
            <select
              value={ramadanDay ?? ""}
              onChange={(e) => setRamadanDay(e.target.value === "" ? null : parseInt(e.target.value, 10))}
              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 dark:border-amber-700 dark:bg-stone-800 dark:text-stone-200"
              aria-label="Koji je dan Ramazana?"
            >
              <option value="">Nije Ramazan</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dan {d}
                </option>
              ))}
            </select>
            {ramadanDay != null && (
              <span className="text-sm text-stone-600 dark:text-stone-400">
                Dan {ramadanDay} = Džuz {ramadanDay}
              </span>
            )}
          </div>
          <ul className="space-y-3" role="list">
          {juzList.map((juz) => (
            <li key={juz.juz}>
              <JuzListCard juz={juz} allSurahs={surahs} ramadanDay={ramadanDay ?? undefined} />
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
