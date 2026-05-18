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

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[72px] left-0 right-0 z-50 flex items-center justify-center md:bottom-4"
    >
      <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-stone-800/95 px-4 py-2 text-sm text-stone-100 shadow-lg backdrop-blur dark:border-stone-600">
        <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        Offline — čitate sačuvane sure
      </div>
    </div>
  );
}
