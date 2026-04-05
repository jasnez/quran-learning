"use client";

import { useState, useRef, useCallback } from "react";

export type DownloadStatus = "idle" | "downloading" | "done" | "error";

const TOTAL_SURAHS = 114;

export function useOfflineDownload() {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState(0); // 0–114
  const cancelledRef = useRef(false);

  const start = useCallback(async () => {
    if (status === "downloading") return;
    cancelledRef.current = false;
    setStatus("downloading");
    setProgress(0);

    let failed = 0;

    for (let i = 1; i <= TOTAL_SURAHS; i++) {
      if (cancelledRef.current) {
        setStatus("idle");
        setProgress(0);
        return;
      }

      try {
        // Dohvati stranicu sure — Service Worker presretne i sačuva u keš
        await fetch(`/surah/${i}`, {
          method: "GET",
          // cache: 'reload' prisiljava svjež fetch (ne koristi browser mem cache)
          cache: "reload",
        });
        // Dohvati i API podatke (za React Query IDB keš)
        await fetch(`/api/surahs/${i}`, { cache: "reload" });
      } catch {
        failed++;
        // Nastavi s ostalim surama i ako jedna ne uspije
      }

      setProgress(i);
    }

    if (cancelledRef.current) {
      setStatus("idle");
      setProgress(0);
      return;
    }

    setStatus(failed > 10 ? "error" : "done");
  }, [status]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setStatus("idle");
    setProgress(0);
  }, []);

  const progressPercent = Math.round((progress / TOTAL_SURAHS) * 100);

  return { start, cancel, reset, status, progress, progressPercent };
}
