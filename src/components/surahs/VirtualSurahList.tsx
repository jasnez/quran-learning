"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SurahListItem } from "./SurahListItem";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";
import type { SurahSummary } from "@/types/quran";

// Prag ispod kojeg se koristi obična lista (filtrirana pretraga = mali broj rezultata)
const VIRTUAL_THRESHOLD = 20;

// Visina jedne stavke: min-h-[4rem]=64px + space-y-3=12px razmak
const ITEM_ESTIMATE_PX = 76;

type Props = { surahs: SurahSummary[] };

export function VirtualSurahList({ surahs }: Props) {
  const scrollCtx = useScrollContainer();
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: surahs.length,
    // Koristi AppShell-ov scroll container kao scroll roditelja
    getScrollElement: () => scrollCtx?.scrollContainerRef.current ?? null,
    estimateSize: () => ITEM_ESTIMATE_PX,
    overscan: 6,
    // Mjeri stvarnu visinu stavki nakon rendera (za tačniji scroll)
    measureElement:
      typeof window !== "undefined"
        ? (el) => el.getBoundingClientRect().height
        : undefined,
  });

  const items = virtualizer.getVirtualItems();

  // Za mali broj rezultata (pretraga) – obična lista, bez virtualizacije
  if (surahs.length <= VIRTUAL_THRESHOLD) {
    return (
      <ul className="space-y-3" role="list">
        {surahs.map((surah) => (
          <li key={surah.id}>
            <SurahListItem surah={surah} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div ref={listRef} role="list" aria-label="Lista sura">
      {/* Outer div: ukupna visina virtualne liste — browser rezerviše prostor za scrollbar */}
      <div
        style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        aria-hidden="false"
      >
        {items.map((virtualItem) => {
          const surah = surahs[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              role="listitem"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: "12px", // space-y-3 ekvivalent
              }}
            >
              <SurahListItem surah={surah} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
