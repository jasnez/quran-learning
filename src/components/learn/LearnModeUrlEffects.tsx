"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";

type LearnModeUrlEffectsProps = { ayahs: Ayah[] };

/**
 * Picks the ayah learn mode opens at: ?ayah=N (the "Nastavi učenje" card, QA P2-1), else the
 * ayah of this surah that is already current, else the first one. Renders nothing.
 * useSearchParams makes the static export skip everything up to the nearest <Suspense>, so
 * learn mode wraps only this component in one and the ayah stays in the static HTML (QA P1-6).
 */
export function LearnModeUrlEffects({ ayahs }: LearnModeUrlEffectsProps) {
  const searchParams = useSearchParams();
  const requestedNumber = parseInt(searchParams?.get("ayah") ?? "", 10);
  const requested = ayahs.find((a) => a.ayahNumber === requestedNumber);

  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const setCurrentAyah = usePlayerStore((s) => s.setCurrentAyah);
  const goToAyah = usePlayerStore((s) => s.goToAyah);
  // Applied once per surah and ?ayah, so moving between ayahs afterwards is not undone.
  const appliedEntryRef = useRef<string | null>(null);

  useEffect(() => {
    if (ayahs.length === 0) return;
    const entry = `${ayahs[0].id}|${requested?.id ?? ""}`;
    if (appliedEntryRef.current === entry) return;
    appliedEntryRef.current = entry;

    const currentInSurah = ayahs.some((a) => a.id === currentAyahId);
    const target = requested ?? (currentInSurah ? undefined : ayahs[0]);
    if (!target || target.id === currentAyahId) return;
    if (currentInSurah) {
      // Audio of this surah keeps its state (playing, paused or stopped) at the new ayah.
      goToAyah(target);
    } else {
      // Audio of another surah stops (QA P2-2): learn mode shows and controls the player's
      // current ayah, so it cannot leave an ayah of another surah playing behind it.
      setCurrentAyah(target);
    }
  }, [ayahs, requested, currentAyahId, setCurrentAyah, goToAyah]);

  return null;
}
