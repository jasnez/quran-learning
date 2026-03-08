"use client";

import { useSyncExternalStore } from "react";

function subscribeMatchMedia(query: string, callback: () => void): () => void {
  const m = window.matchMedia(query);
  m.addEventListener("change", callback);
  return () => m.removeEventListener("change", callback);
}

function getMatchMediaSnapshot(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

/**
 * Returns true when the viewport matches the given media query.
 * On SSR and before mount returns false (assumes desktop).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMatchMedia(query, onStoreChange),
    () => getMatchMediaSnapshot(query),
    () => false
  );
}

/** True when viewport width <= 640px (Tailwind sm breakpoint). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 640px)");
}
