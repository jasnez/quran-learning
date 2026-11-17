/**
 * @vitest-environment jsdom
 *
 * The offline download fetches every /surah/N page through the service worker, which
 * stores it in Cache Storage. "Done" may only be reported when every page (and the
 * static files those pages need) is really in the cache: QA P2-7 found that network
 * errors, HTTP errors and an uncontrolled page were all reported as success.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOfflineDownload, TOTAL_SURAHS } from "../useOfflineDownload";

type EnvOptions = {
  controlled?: boolean;
  networkErrors?: string[];
  httpErrors?: Record<string, number>;
  notSaved?: string[];
  preCached?: string[];
  withCaches?: boolean;
};

const PAGE_HTML = '<html><head><script src="/_next/static/chunks/app.js"></script></head></html>';
const APP_JS = 'loadChunk("static/chunks/lazy.js")';

function pathOf(input: unknown): string {
  const raw = typeof input === "string" ? input : (input as { url: string }).url;
  return new URL(raw, window.location.href).pathname;
}

function bodyFor(path: string): string {
  if (path.startsWith("/surah/")) return PAGE_HTML;
  if (path === "/_next/static/chunks/app.js") return APP_JS;
  return "";
}

function installEnv(opts: EnvOptions = {}) {
  const env = {
    networkErrors: new Set(opts.networkErrors ?? []),
    httpErrors: { ...(opts.httpErrors ?? {}) },
    notSaved: new Set(opts.notSaved ?? []),
    stored: new Set(opts.preCached ?? []),
  };
  const controllerListeners = new Set<() => void>();
  const sw = {
    controller: (opts.controlled ?? true) ? ({} as object) : null,
    ready: Promise.resolve({}),
    addEventListener: vi.fn((type: string, fn: () => void) => {
      if (type === "controllerchange") controllerListeners.add(fn);
    }),
    removeEventListener: vi.fn((type: string, fn: () => void) => {
      if (type === "controllerchange") controllerListeners.delete(fn);
    }),
  };
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: sw });

  const fetchMock = vi.fn(async (input: unknown) => {
    const path = pathOf(input);
    if (env.networkErrors.has(path)) throw new TypeError("Failed to fetch");
    const status = env.httpErrors[path];
    if (status) return new Response("error", { status });
    // A controlling service worker stores the response; without one nothing is cached.
    if (sw.controller && !env.notSaved.has(path)) env.stored.add(path);
    return new Response(bodyFor(path), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);

  if (opts.withCaches ?? true) {
    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        match: vi.fn(async (input: unknown) => (env.stored.has(pathOf(input)) ? new Response("") : undefined)),
      },
    });
  } else {
    Reflect.deleteProperty(window, "caches");
  }

  const takeControl = () => {
    sw.controller = {};
    controllerListeners.forEach((fn) => fn());
  };
  const surahFetches = () => fetchMock.mock.calls.map((c) => pathOf(c[0])).filter((p) => p.startsWith("/surah/"));
  return { env, fetchMock, takeControl, surahFetches };
}

const allSurahPaths = Array.from({ length: TOTAL_SURAHS }, (_, i) => `/surah/${i + 1}`);

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderReady(options?: Parameters<typeof useOfflineDownload>[0]) {
  const hook = renderHook(() => useOfflineDownload(options));
  await waitFor(() => expect(hook.result.current.status).not.toBe("checking"));
  return hook;
}

async function startAndFinish(result: { current: ReturnType<typeof useOfflineDownload> }) {
  await act(async () => {
    await result.current.start();
  });
}

describe("useOfflineDownload", () => {
  it("reports done only after every surah page and the files it needs are in the cache", async () => {
    const { fetchMock } = installEnv();
    const { result } = await renderReady();
    await startAndFinish(result);

    expect(result.current.status).toBe("done");
    expect(result.current.availableCount).toBe(TOTAL_SURAHS);
    expect(result.current.failures).toEqual([]);
    const fetched = fetchMock.mock.calls.map((c) => pathOf(c[0]));
    expect(fetched).toContain("/_next/static/chunks/app.js");
    // A chunk loaded lazily by another chunk is needed offline too.
    expect(fetched).toContain("/_next/static/chunks/lazy.js");
  });

  it("reports the surahs that failed with a network error instead of done", async () => {
    installEnv({ networkErrors: ["/surah/5", "/surah/17", "/surah/44"] });
    const { result } = await renderReady();
    await startAndFinish(result);

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("incomplete");
    expect(result.current.failures).toEqual([
      { surah: 5, reason: "network" },
      { surah: 17, reason: "network" },
      { surah: 44, reason: "network" },
    ]);
    expect(result.current.availableCount).toBe(TOTAL_SURAHS - 3);
  });

  it("counts HTTP 404 and 500 responses as failures", async () => {
    installEnv({ httpErrors: { "/surah/9": 500, "/surah/10": 404 } });
    const { result } = await renderReady();
    await startAndFinish(result);

    expect(result.current.status).toBe("error");
    expect(result.current.failures).toEqual([
      { surah: 9, reason: "http", httpStatus: 500 },
      { surah: 10, reason: "http", httpStatus: 404 },
    ]);
  });

  it("counts a surah the service worker did not save as failed", async () => {
    installEnv({ notSaved: ["/surah/3"] });
    const { result } = await renderReady();
    await startAndFinish(result);

    expect(result.current.status).toBe("error");
    expect(result.current.failures).toEqual([{ surah: 3, reason: "not-saved" }]);
  });

  it("reports a static file that could not be saved, and is not done", async () => {
    installEnv({ httpErrors: { "/_next/static/chunks/lazy.js": 404 } });
    const { result } = await renderReady();
    await startAndFinish(result);

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("incomplete");
    expect(result.current.failures).toEqual([]);
    expect(result.current.failedAssetCount).toBe(1);
  });

  it("does not download, and says why, when the service worker never controls the page", async () => {
    const { surahFetches } = installEnv({ controlled: false });
    const { result } = await renderReady({ controllerTimeoutMs: 20 });
    await startAndFinish(result);

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("not-controlled");
    expect(surahFetches()).toEqual([]);
  });

  it("waits for the service worker to take control, then downloads", async () => {
    const { takeControl } = installEnv({ controlled: false });
    const { result } = await renderReady({ controllerTimeoutMs: 5000 });

    let run: Promise<void> | undefined;
    act(() => {
      run = result.current.start();
    });
    await act(async () => {
      takeControl();
      await run;
    });

    expect(result.current.status).toBe("done");
    expect(result.current.availableCount).toBe(TOTAL_SURAHS);
  });

  it("knows after a reload that every surah is already saved", async () => {
    const { fetchMock } = installEnv({ preCached: allSurahPaths });
    const { result } = await renderReady();

    expect(result.current.status).toBe("done");
    expect(result.current.availableCount).toBe(TOTAL_SURAHS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("knows after a reload how many surahs are saved when not all are", async () => {
    installEnv({ preCached: allSurahPaths.slice(0, 10) });
    const { result } = await renderReady();

    expect(result.current.status).toBe("idle");
    expect(result.current.availableCount).toBe(10);
  });

  it("retry downloads only the surahs that failed", async () => {
    const { env, surahFetches, fetchMock } = installEnv({ networkErrors: ["/surah/5"] });
    const { result } = await renderReady();
    await startAndFinish(result);
    expect(result.current.status).toBe("error");

    env.networkErrors.clear();
    fetchMock.mockClear();
    await act(async () => {
      await result.current.retry();
    });

    expect(surahFetches()).toEqual(["/surah/5"]);
    expect(result.current.status).toBe("done");
    expect(result.current.failures).toEqual([]);
  });

  it("is unsupported when the browser has no Cache Storage", async () => {
    installEnv({ withCaches: false });
    const { result } = await renderReady();
    expect(result.current.status).toBe("unsupported");
  });
});
