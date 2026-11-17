"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { extractStaticRefs } from "@/lib/offline/staticRefs";

export const TOTAL_SURAHS = 114;
const ALL_SURAHS = Array.from({ length: TOTAL_SURAHS }, (_, i) => i + 1);

/** On a first visit the service worker installs and takes control within a few seconds. */
const DEFAULT_CONTROLLER_TIMEOUT_MS = 10_000;

export type DownloadStatus = "checking" | "unsupported" | "idle" | "downloading" | "done" | "error";
export type DownloadError = "not-controlled" | "incomplete";
export type SurahFailure = { surah: number; reason: "network" | "http" | "not-saved"; httpStatus?: number };

type SaveResult = { ok: true; text: string | null } | { ok: false; reason: SurahFailure["reason"]; httpStatus?: number };

function isSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window;
}

const surahPath = (surah: number) => `/surah/${surah}`;

/** Surahs whose page is in Cache Storage, i.e. readable offline. */
async function findSavedSurahs(): Promise<Set<number>> {
  const saved = await Promise.all(ALL_SURAHS.map((s) => window.caches.match(surahPath(s))));
  return new Set(ALL_SURAHS.filter((_, i) => saved[i] !== undefined));
}

function waitForController(timeoutMs: number): Promise<boolean> {
  const sw = navigator.serviceWorker;
  if (sw.controller) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      sw.removeEventListener("controllerchange", onChange);
      resolve(!!sw.controller);
    };
    const onChange = () => {
      if (sw.controller) finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    sw.addEventListener("controllerchange", onChange);
  });
}

/**
 * Fetches a URL through the service worker, which stores it (public/sw.js awaits the
 * write for these requests), then checks that it really is in the cache: a fetch that
 * resolves says nothing about HTTP status or about the worker having stored it.
 */
async function saveForOffline(path: string, readText: boolean, init?: RequestInit): Promise<SaveResult> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    return { ok: false, reason: "network" };
  }
  if (!response.ok) return { ok: false, reason: "http", httpStatus: response.status };
  let text: string | null = null;
  if (readText) {
    try {
      text = await response.text();
    } catch {
      return { ok: false, reason: "network" };
    }
  }
  if (!(await window.caches.match(path))) return { ok: false, reason: "not-saved" };
  return { ok: true, text };
}

/**
 * Saves every surah page, and the static files those pages need, for offline reading.
 * Audio is not included (public/sw.js does not cache it).
 *
 * The state comes from Cache Storage, so it survives a reload and reflects a cache the
 * browser or a new deploy has cleaned. "done" means all 114 pages are in the cache;
 * anything that could not be saved is reported in `failures` / `failedAssetCount`.
 */
export function useOfflineDownload({
  active = true,
  controllerTimeoutMs = DEFAULT_CONTROLLER_TIMEOUT_MS,
}: { active?: boolean; controllerTimeoutMs?: number } = {}) {
  // The settings panel is rendered only in the browser (ssr: false), so this cannot mismatch.
  const [status, setStatus] = useState<DownloadStatus>(() => (isSupported() ? "checking" : "unsupported"));
  const [error, setError] = useState<DownloadError | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(TOTAL_SURAHS);
  const [availableCount, setAvailableCount] = useState(0);
  const [failures, setFailures] = useState<SurahFailure[]>([]);
  const [failedAssetCount, setFailedAssetCount] = useState(0);
  const runningRef = useRef(false);
  const cancelledRef = useRef(false);
  const failedAssetsRef = useRef<string[]>([]);

  // Check what is saved whenever the panel is shown.
  useEffect(() => {
    if (!active || !isSupported()) return;
    let current = true;
    findSavedSurahs()
      .then((saved) => {
        if (!current || runningRef.current) return;
        setAvailableCount(saved.size);
        setStatus((s) => (s === "checking" || s === "idle" || s === "done" ? (saved.size === TOTAL_SURAHS ? "done" : "idle") : s));
      })
      .catch((err: unknown) => {
        console.warn("Could not read the offline cache", err);
        if (current) setStatus((s) => (s === "checking" ? "idle" : s));
      });
    return () => {
      current = false;
    };
  }, [active]);

  const run = useCallback(
    async (surahs: number[], assetsToRetry: string[]) => {
      if (runningRef.current) return;
      if (!isSupported()) {
        setStatus("unsupported");
        return;
      }
      runningRef.current = true;
      cancelledRef.current = false;
      setStatus("downloading");
      setError(null);
      setFailures([]);
      setFailedAssetCount(0);
      setProgress(0);
      setTotal(surahs.length);

      try {
        if (!(await waitForController(controllerTimeoutMs))) {
          // Without a controlling worker nothing would be stored: do not fetch at all.
          setError("not-controlled");
          setStatus("error");
          return;
        }

        const runFailures: SurahFailure[] = [];
        const failedAssets: string[] = [];
        const seenAssets = new Set<string>();
        const assetQueue = [...assetsToRetry];
        const saveQueuedAssets = async () => {
          while (assetQueue.length > 0 && !cancelledRef.current) {
            const path = assetQueue.shift()!;
            if (seenAssets.has(path)) continue;
            seenAssets.add(path);
            // Scripts and stylesheets load further files (lazy chunks, fonts).
            const result = await saveForOffline(path, /\.(js|css)$/.test(path));
            if (!result.ok) failedAssets.push(path);
            else if (result.text) assetQueue.push(...extractStaticRefs(result.text));
          }
        };

        for (let i = 0; i < surahs.length && !cancelledRef.current; i++) {
          const surah = surahs[i];
          const result = await saveForOffline(surahPath(surah), true, { cache: "reload" });
          if (result.ok) {
            assetQueue.push(...extractStaticRefs(result.text ?? ""));
            await saveQueuedAssets();
          } else {
            runFailures.push(
              result.httpStatus
                ? { surah, reason: result.reason, httpStatus: result.httpStatus }
                : { surah, reason: result.reason }
            );
          }
          setProgress(i + 1);
        }
        await saveQueuedAssets();

        const saved = await findSavedSurahs();
        setAvailableCount(saved.size);
        if (cancelledRef.current) {
          setStatus(saved.size === TOTAL_SURAHS ? "done" : "idle");
          return;
        }

        // A page missing from the cache is a failure even if its request looked fine.
        const reported = new Set(runFailures.map((f) => f.surah));
        const missing = ALL_SURAHS.filter((s) => !saved.has(s) && !reported.has(s));
        const allFailures = [...runFailures, ...missing.map((surah) => ({ surah, reason: "not-saved" as const }))].sort(
          (a, b) => a.surah - b.surah
        );
        failedAssetsRef.current = failedAssets;
        setFailures(allFailures);
        setFailedAssetCount(failedAssets.length);
        if (allFailures.length > 0 || failedAssets.length > 0) {
          setError("incomplete");
          setStatus("error");
        } else {
          setStatus("done");
        }
      } finally {
        runningRef.current = false;
      }
    },
    [controllerTimeoutMs]
  );

  /** Downloads all 114 surahs (again: a new download refreshes saved pages). */
  const start = useCallback(() => run(ALL_SURAHS, []), [run]);

  /** Downloads only what the last run could not save. */
  const retry = useCallback(
    () =>
      run(
        failures.map((f) => f.surah),
        failedAssetsRef.current
      ),
    [run, failures]
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return {
    start,
    retry,
    cancel,
    status,
    error,
    progress,
    total,
    progressPercent,
    availableCount,
    failures,
    failedAssetCount,
  };
}
