"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "./SearchInput";
import { VirtualSurahList } from "./VirtualSurahList";
import { JuzListCard } from "./JuzListCard";
import type { SurahSummary } from "@/types/quran";
import { normalizeSurahName } from "@/lib/search/searchClient";
import type { JuzInfo } from "@/types/quran";

function filterSurahs(surahs: SurahSummary[], query: string): SurahSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return surahs;
  const qName = normalizeSurahName(q);
  return surahs.filter(
    (s) =>
      String(s.surahNumber).includes(q) ||
      (qName !== "" &&
        (normalizeSurahName(s.nameLatin).includes(qName) ||
          normalizeSurahName(s.nameBosnian).includes(qName) ||
          normalizeSurahName(s.slug).includes(qName))) ||
      s.nameArabic.includes(query.trim())
  );
}

type ViewMode = "surahs" | "juz";

type SurahsPageContentProps = {
  surahs: SurahSummary[];
  juzList: JuzInfo[];
  initialView?: ViewMode;
};

/**
 * Reports ?view to the page. Renders nothing. useSearchParams makes the static
 * export skip everything up to the nearest <Suspense>, so only this component
 * sits in one and the surah list stays in the static HTML (QA P1-6).
 */
function ViewParamSync({ onViewParam }: { onViewParam: (viewParam: string | null) => void }) {
  const viewParam = useSearchParams().get("view");
  useEffect(() => {
    onViewParam(viewParam);
  }, [viewParam, onViewParam]);
  return null;
}

export function SurahsPageContent({ surahs, juzList, initialView = "surahs" }: SurahsPageContentProps) {
  // The static HTML shows initialView; ?view=juz is applied right after hydration.
  const [view, setView] = useState<ViewMode>(initialView);
  const handleViewParam = useCallback(
    (viewParam: string | null) => setView(viewParam === "juz" ? "juz" : initialView),
    [initialView],
  );

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
      <Suspense fallback={null}>
        <ViewParamSync onViewParam={handleViewParam} />
      </Suspense>
      <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <span className="text-sm font-medium text-ink-muted">Pregled:</span>
        <div className="flex rounded-lg border border-line p-0.5">
          <button
            type="button"
            onClick={setViewSurahs}
            aria-pressed={showSurahs}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              showSurahs
                ? "bg-accent-wash text-accent-text"
                : "text-ink-muted hover:bg-surface-sunken"
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
            aria-current={showJuz ? "page" : undefined}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              showJuz
                ? "bg-accent-wash text-accent-text"
                : "text-ink-muted hover:bg-surface-sunken"
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
              <p className="font-medium text-ink">Nema takve sure</p>
              <p className="mt-1 text-sm text-ink-muted">
                Upiši broj od 1 do 114 ili dio naziva, npr. jasin.
              </p>
            </div>
          ) : (
            <VirtualSurahList surahs={filteredSurahs} />
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
