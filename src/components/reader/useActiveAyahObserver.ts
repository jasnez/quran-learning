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

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = top?.target.getAttribute("data-ayah-id");
        if (!id) return;
        const ayahNumber = parseInt(id.split(":")[1] ?? "1", 10);
        if (Number.isFinite(ayahNumber)) setAyahNumber(ayahNumber);
      },
      // A band in the upper half of the screen: the ayah being read, not the one scrolling in.
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ayahs]);
}
