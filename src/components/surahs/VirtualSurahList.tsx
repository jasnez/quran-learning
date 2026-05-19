"use client";

import { SurahListItem } from "./SurahListItem";
import type { SurahSummary } from "@/types/quran";

type Props = { surahs: SurahSummary[] };

/**
 * Surah grid: single column mobile/tablet, multi-column desktop.
 * 114 items — small enough that virtualization is unnecessary overhead.
 */
export function VirtualSurahList({ surahs }: Props) {
  return (
    <ul
      className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3"
      role="list"
      aria-label="Lista sura"
    >
      {surahs.map((surah) => (
        <li key={surah.id}>
          <SurahListItem surah={surah} />
        </li>
      ))}
    </ul>
  );
}
