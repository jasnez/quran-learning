"use client";

import { useEffect, useState } from "react";
import type { VerseTimestamp } from "@/types/wordByWord";
import { fetchChapterAudioData } from "./wordTimingService";

type Loaded = { surahNumber: number; byVerse: Map<string, VerseTimestamp> | null; error: boolean };

/**
 * Word timestamps (Quran.com segments) for one surah, keyed by verse key ("2:255").
 * Fetches /data/chapter-audio only while `enabled` (word-by-word mode is on).
 */
export function useChapterTimestamps(
  surahNumber: number,
  enabled: boolean,
): { byVerse: Map<string, VerseTimestamp> | null; error: boolean } {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!enabled || surahNumber < 1 || surahNumber > 114) return;
    let cancelled = false;
    fetchChapterAudioData(surahNumber)
      .then((data) => {
        if (cancelled) return;
        setLoaded({
          surahNumber,
          byVerse: new Map(data.timestamps.map((t) => [t.verseKey, t])),
          error: false,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn(`Word timings for surah ${surahNumber} failed to load`, err);
        setLoaded({ surahNumber, byVerse: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [surahNumber, enabled]);

  if (!enabled || loaded?.surahNumber !== surahNumber) return { byVerse: null, error: false };
  return { byVerse: loaded.byVerse, error: loaded.error };
}
