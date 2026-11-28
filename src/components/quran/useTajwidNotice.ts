"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";

/**
 * Says once that the tajwid colors changed (Phase 3, D7), to someone who used the old colors.
 * Called by the reading screens, where the colors are seen; while the colors are off it waits.
 */
export function useTajwidNotice(): void {
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const tajwidNoticeSeen = useSettingsStore((s) => s.tajwidNoticeSeen);
  const markTajwidNoticeSeen = useSettingsStore((s) => s.markTajwidNoticeSeen);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    // Only an explicit false: the flag is missing in tests that stub part of the store.
    if (!showTajwidColors || tajwidNoticeSeen !== false) return;
    showToast("Boje su sada kao u tedžvidskom mushafu.");
    markTajwidNoticeSeen();
  }, [showTajwidColors, tajwidNoticeSeen, markTajwidNoticeSeen, showToast]);
}
