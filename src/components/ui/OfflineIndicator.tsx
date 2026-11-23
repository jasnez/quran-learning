"use client";

import { useSyncExternalStore } from "react";

function subscribeOnline(callback: () => void) {
  window.addEventListener("offline", callback);
  window.addEventListener("online", callback);
  return () => {
    window.removeEventListener("offline", callback);
    window.removeEventListener("online", callback);
  };
}

const getSnapshot = () => !navigator.onLine;
const getServerSnapshot = () => false;

export function OfflineIndicator() {
  const offline = useSyncExternalStore(subscribeOnline, getSnapshot, getServerSnapshot);

  // The live region is always in the DOM; only the pill (and its text) comes and goes.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[72px] left-0 right-0 z-50 flex items-center justify-center md:bottom-4"
    >
      {offline && (
        <div className="flex items-center gap-2 rounded-full border border-line-strong bg-ink/95 px-4 py-2 text-sm text-paper shadow-lg backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
          Nema interneta: dostupne su preuzete sure.
        </div>
      )}
    </div>
  );
}
