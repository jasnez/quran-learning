"use client";

import { useEffect } from "react";

/** Must match the cache names in public/sw.js. */
const SW_CACHE_PREFIX = "quran-";

/**
 * `next dev` chunk names are not content-hashed, and public/sw.js serves /_next/static
 * cache-first, so a worker in development keeps serving stale code. Remove it there.
 */
async function removeDevServiceWorker(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(SW_CACHE_PREFIX)).map((k) => caches.delete(k)));
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      removeDevServiceWorker().catch((err: unknown) => {
        console.warn("Could not remove the development service worker", err);
      });
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err: unknown) => {
      // Not critical: the app works without the worker (no offline cache).
      console.warn("Service worker registration failed", err);
    });
  }, []);

  return null;
}
