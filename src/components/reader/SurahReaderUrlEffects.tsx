"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { preferredScrollBehavior } from "@/lib/scrollBehavior";

type SurahReaderUrlEffectsProps = {
  ayahs: Ayah[];
  surahNameLatin: string;
  /** Overrides ?ayah (tests). */
  initialAyahNumber?: number;
  /** Overrides ?autoplay (tests). */
  initialAutoplay?: boolean;
};

/**
 * Side effects of the reader that depend on the URL (?ayah, ?autoplay). Renders
 * nothing. useSearchParams makes the static export skip everything up to the
 * nearest <Suspense>, so the reader wraps only this component in one and the
 * surah text stays in the static HTML (QA P1-6).
 */
export function SurahReaderUrlEffects({
  ayahs,
  surahNameLatin,
  initialAyahNumber: initialAyahNumberProp,
  initialAutoplay: initialAutoplayProp,
}: SurahReaderUrlEffectsProps) {
  const searchParams = useSearchParams();
  const ayahFromUrl = searchParams.get("ayah");
  const parsedUrlAyah = ayahFromUrl != null ? parseInt(ayahFromUrl, 10) : NaN;
  const initialAyahNumber =
    initialAyahNumberProp ??
    (Number.isInteger(parsedUrlAyah) && parsedUrlAyah >= 1 ? parsedUrlAyah : undefined);
  const initialAutoplay = initialAutoplayProp ?? searchParams.get("autoplay") === "1";

  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const progressTrackedRef = useRef(false);

  // Track surah opened and last position (lightweight: once per mount)
  useEffect(() => {
    if (ayahs.length === 0 || progressTrackedRef.current) return;
    const [surahPart] = ayahs[0].id.split(":");
    const surahNumber = parseInt(surahPart, 10) || 1;
    progressTrackedRef.current = true;
    const progress = useProgressStore.getState();
    progress.addSurahVisited(surahNumber);
    // Without ?ayah nothing has been read yet: a saved position in this surah (e.g. learn mode
    // closed at 2:150) stays as it is (QA P2-1).
    if (initialAyahNumber == null && progress.lastSurahNumber === surahNumber) return;
    progress.updateLastPosition(surahNumber, initialAyahNumber ?? 1, surahNameLatin, "reader");
  }, [ayahs, initialAyahNumber, surahNameLatin]);

  // Autoplay first ayah when navigated from "next surah" (e.g. after previous surah ended)
  useEffect(() => {
    if (!initialAutoplay || ayahs.length === 0) return;
    setQueue(ayahs);
    play(ayahs[0]);
  }, [initialAutoplay, ayahs, setQueue, play]);

  // Scroll to and briefly highlight ayah when opened from search (?ayah=N)
  useEffect(() => {
    if (initialAyahNumber == null || ayahs.length === 0) return;
    const surahId = ayahs[0].id.split(":")[0];
    const id = `${surahId}:${initialAyahNumber}`;
    const el = document.querySelector(`[data-ayah-id="${id}"]`);
    if (!el) return;
    const rafId = requestAnimationFrame(() => {
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
      }
      el.setAttribute("data-highlight-from-search", "true");
    });
    const timeoutId = setTimeout(() => {
      document.querySelector(`[data-ayah-id="${id}"]`)?.removeAttribute("data-highlight-from-search");
    }, 2000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [initialAyahNumber, ayahs]);

  return null;
}
