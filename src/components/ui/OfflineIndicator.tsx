"use client";

import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Postavi inicijalni status — navigator.onLine može biti false odmah
    setOffline(!navigator.onLine);

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

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
