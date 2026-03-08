"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "./SearchInput";
import { SurahList } from "./SurahList";
import type { SurahSummary } from "@/types/quran";

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

export function SurahsContent({ surahs }: { surahs: SurahSummary[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterSurahs(surahs, query),
    [surahs, query]
  );

  const isEmptySearch = query.trim() !== "" && filtered.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <SearchInput value={query} onChange={setQuery} />
      {isEmptySearch ? (
        <div className="py-12 text-center" role="status">
          <p className="font-medium text-stone-700 dark:text-stone-300">Nije pronađeno</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Pokušajte ponovo s drugim pojmom ili provjerite pravopis.
          </p>
        </div>
      ) : (
        <SurahList surahs={filtered} />
      )}
    </div>
  );
}
