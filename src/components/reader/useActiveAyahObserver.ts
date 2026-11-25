"use client";

import { useEffect } from "react";
import type { Ayah } from "@/types/quran";
import { useReaderPositionStore } from "@/store/readerPositionStore";

/**
 * Tracks which ayah is at the top of the reading area and writes its number to
 * readerPositionStore. One observer for the whole surah; the header's counter and the desktop
 * ayah list read the store.
 */
export function useActiveAyahObserver(ayahs: readonly Ayah[]): void {
  useEffect(() => {
    const { setAyahNumber } = useReaderPositionStore.getState();
    // A new surah starts at its first ayah.
    setAyahNumber(1);
    if (ayahs.length === 0 || typeof IntersectionObserver === "undefined") return;

    const elements = ayahs
      .map((a) => document.querySelector(`[data-ayah-id="${a.id}"]`))
      .filter((el): el is Element => el != null);
    if (elements.length === 0) return;

    // The observer reports changes only: an ayah that stays in the band is not in the next
    // report. So the set remembers who is in the band, and the topmost of them all counts.
    const order = new Map(elements.map((el, index) => [el, index]));
    const inBand = new Set<number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = order.get(entry.target);
          if (index == null) continue;
          if (entry.isIntersecting) inBand.add(index);
          else inBand.delete(index);
        }
        // An empty band (a gap between two ayahs) keeps the last ayah.
        if (inBand.size === 0) return;
        const id = elements[Math.min(...inBand)].getAttribute("data-ayah-id");
        const ayahNumber = parseInt(id?.split(":")[1] ?? "", 10);
        if (Number.isFinite(ayahNumber)) setAyahNumber(ayahNumber);
      },
      // A band in the upper half of the screen: the ayah being read, not the one scrolling in.
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ayahs]);
}
