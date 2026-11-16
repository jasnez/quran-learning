"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";

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
    const ayahNumber = initialAyahNumber ?? 1;
    progressTrackedRef.current = true;
    useProgressStore.getState().addSurahVisited(surahNumber);
    useProgressStore.getState().updateLastPosition(surahNumber, ayahNumber, surahNameLatin, "reader");
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
        el.scrollIntoView({ behavior: "smooth", block: "center" });
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
