/**
 * Runs public/sw.js in a VM with fake Cache Storage and fetch (QA P2-7):
 * - RSC payloads under /surah/ are not cached (they grew the cache on every deploy);
 * - a page fetched by the offline download is in the cache when its response arrives;
 * - offline, an unknown page gets an offline notice, not the home page HTML;
 * - on activate (every deploy), static files that no cached page needs are removed,
 *   while the user's saved pages and everything they need are kept.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import vm from "vm";
import { extractStaticRefs } from "@/lib/offline/staticRefs";

const ORIGIN = "https://quran.test";
const SW_SOURCE = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8");

type FakeRequest = { url: string; method: string; mode: string };

function keyOf(input: string | FakeRequest): string {
  return new URL(typeof input === "string" ? input : input.url, ORIGIN).href;
}

/** Writes finish on a later macrotask, like real Cache Storage I/O. */
const io = () => new Promise((r) => setTimeout(r, 0));

class FakeCache {
  entries = new Map<string, Response>();
  async match(input: string | FakeRequest) {
    const r = this.entries.get(keyOf(input));
    return r ? r.clone() : undefined;
  }
  async put(input: string | FakeRequest, response: Response) {
    const body = await response.arrayBuffer();
    await io();
    this.entries.set(keyOf(input), new Response(body, { status: response.status, headers: response.headers }));
  }
  async add(url: string) {
    const response = await sw.fetch(url);
    if (!response.ok) throw new TypeError("bad status");
    await this.put(url, response);
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url, method: "GET", mode: "cors" }));
  }
  async delete(input: string | FakeRequest) {
    return this.entries.delete(keyOf(input));
  }
  paths() {
    return [...this.entries.keys()].map((u) => {
      const url = new URL(u);
      return url.pathname + url.search;
    });
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(input: string | FakeRequest) {
    for (const store of this.stores.values()) {
      const r = await store.match(input);
      if (r) return r;
    }
    return undefined;
  }
}

type Listener = (event: unknown) => void;
let sw: {
  listeners: Map<string, Listener>;
  caches: FakeCacheStorage;
  fetch: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<Response>>>;
  context: vm.Context;
};

function loadServiceWorker() {
  const listeners = new Map<string, Listener>();
  const caches = new FakeCacheStorage();
  const fetchMock = vi.fn<(...args: unknown[]) => Promise<Response>>();
  const self = {
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    location: { origin: ORIGIN },
    skipWaiting: vi.fn(() => Promise.resolve()),
    clients: { claim: vi.fn(() => Promise.resolve()) },
  };
  const context = vm.createContext({
    self,
    caches,
    fetch: (...args: unknown[]) => fetchMock(...args),
    Response,
    Headers,
    URL,
    Promise,
    Set,
    Map,
    console: { log: () => {}, warn: () => {}, error: () => {} },
  });
  vm.runInContext(SW_SOURCE, context);
  sw = { listeners, caches, fetch: fetchMock, context };
}

function html(body: string) {
  return new Response(body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function dispatchFetch(pathname: string, mode = "cors"): Promise<Response | undefined> {
  let responded: Promise<Response> | undefined;
  const request: FakeRequest = { url: ORIGIN + pathname, method: "GET", mode };
  sw.listeners.get("fetch")!({
    request,
    respondWith: (p: Promise<Response>) => {
      responded = p;
    },
    waitUntil: () => {},
  });
  return responded ? await responded : undefined;
}

async function dispatchActivate() {
  let done: Promise<unknown> | undefined;
  sw.listeners.get("activate")!({ waitUntil: (p: Promise<unknown>) => (done = p) });
  await done;
}

beforeEach(() => {
  loadServiceWorker();
});

describe("public/sw.js fetch handling", () => {
  it("does not cache RSC payloads under /surah/", async () => {
    sw.fetch.mockImplementation(
      async () => new Response("0:rsc", { status: 200, headers: { "Content-Type": "text/x-component" } })
    );
    await dispatchFetch("/surah/1.txt?_rsc=abc12");
    await dispatchFetch("/surah/1/__next.surah.$d$surahId.txt");
    await io();
    const all = await Promise.all([...sw.caches.stores.values()].map((c) => c.paths()));
    expect(all.flat()).toEqual([]);
  });

  it("has a surah page in the cache by the time the page receives its response", async () => {
    sw.fetch.mockResolvedValue(html("<p>Al-Fatiha</p>"));
    const response = await dispatchFetch("/surah/1");
    expect(response?.status).toBe(200);
    expect(await sw.caches.match(ORIGIN + "/surah/1")).toBeDefined();
  });

  it("does not cache a server error", async () => {
    sw.fetch.mockResolvedValue(new Response("boom", { status: 500 }));
    const response = await dispatchFetch("/surah/2");
    expect(response?.status).toBe(500);
    expect(await sw.caches.match(ORIGIN + "/surah/2")).toBeUndefined();
  });

  it("offline, serves a saved page from the cache", async () => {
    const shell = await sw.caches.open("quran-shell-v1");
    await shell.put(ORIGIN + "/surah/3", html("<p>Ali Imran</p>"));
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const response = await dispatchFetch("/surah/3", "navigate");
    expect(await response?.text()).toBe("<p>Ali Imran</p>");
  });

  it("offline, serves a saved surah for a link with ?ayah= (the home page links there)", async () => {
    const shell = await sw.caches.open("quran-shell-v1");
    await shell.put(ORIGIN + "/surah/113", html("<p>Al-Falaq</p>"));
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const response = await dispatchFetch("/surah/113?ayah=5", "navigate");
    expect(await response?.text()).toBe("<p>Al-Falaq</p>");
  });

  it("caches a page under its path, not once per ?ayah= value", async () => {
    sw.fetch.mockImplementation(async () => html("<p>Al-Baqara</p>"));
    await dispatchFetch("/surah/2?ayah=5");
    await dispatchFetch("/surah/2?ayah=6");
    const shell = await sw.caches.open("quran-shell-v1");
    expect(shell.paths()).toEqual(["/surah/2"]);
  });

  it("offline, answers an unknown page with an offline notice, not the home page", async () => {
    const shell = await sw.caches.open("quran-shell-v1");
    await shell.put(ORIGIN + "/", html("<p>HOME</p>"));
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const response = await dispatchFetch("/tajwid/3", "navigate");
    const text = await response!.text();
    expect(response!.status).toBe(503);
    expect(text).not.toContain("HOME");
    expect(text).toMatch(/internet/i);
    expect(response!.headers.get("Content-Type")).toMatch(/text\/html/);
  });
});

describe("public/sw.js cleanup on activate", () => {
  async function seed() {
    const shell = await sw.caches.open("quran-shell-v1");
    const staticCache = await sw.caches.open("quran-static-v1");
    await shell.put(
      ORIGIN + "/surah/1",
      html('<script src="/_next/static/chunks/app.js"></script><link rel="stylesheet" href="/_next/static/chunks/site.css">')
    );
    await shell.put(
      ORIGIN + "/surah/1.txt?_rsc=abc12",
      new Response("0:rsc", { headers: { "Content-Type": "text/x-component" } })
    );
    await staticCache.put(ORIGIN + "/_next/static/chunks/app.js", new Response('load("static/chunks/lazy.js")'));
    await staticCache.put(ORIGIN + "/_next/static/chunks/lazy.js", new Response(""));
    await staticCache.put(ORIGIN + "/_next/static/chunks/site.css", new Response("@font-face{src:url(../media/f.woff2)}"));
    await staticCache.put(ORIGIN + "/_next/static/media/f.woff2", new Response(""));
    await staticCache.put(ORIGIN + "/_next/static/chunks/old-deploy.js", new Response(""));
    await staticCache.put(ORIGIN + "/icons/icon-192.png", new Response(""));
    return { shell, staticCache };
  }

  it("removes static files no saved page needs, and keeps those the saved pages need", async () => {
    const { staticCache } = await seed();
    await dispatchActivate();
    expect(staticCache.paths().sort()).toEqual(
      [
        "/_next/static/chunks/app.js",
        "/_next/static/chunks/lazy.js",
        "/_next/static/chunks/site.css",
        "/_next/static/media/f.woff2",
        "/icons/icon-192.png",
      ].sort()
    );
  });

  it("removes RSC payloads from the page cache and keeps the saved pages", async () => {
    const { shell } = await seed();
    await dispatchActivate();
    expect(shell.paths()).toEqual(["/surah/1"]);
  });

  it("deletes caches with names this worker does not use", async () => {
    await sw.caches.open("quran-shell-v0");
    await sw.caches.open("quran-api-v1");
    await dispatchActivate();
    const names = await sw.caches.keys();
    expect(names).not.toContain("quran-shell-v0");
    expect(names).toContain("quran-api-v1");
  });
});

describe("public/sw.js version", () => {
  it("has a version placeholder that the build replaces, so every deploy updates the worker", () => {
    expect(SW_SOURCE).toMatch(/const SW_VERSION = "__SW_VERSION__";/);
  });

  it("finds static references the same way as the page-side helper", () => {
    const sample = [
      '<script src="/_next/static/chunks/a1.js"></script>',
      '"static/chunks/b2-x_y.js"',
      "url(../media/c3.p.woff2)",
      '\\"/_next/static/media/d4.png\\"',
      '"static/chunks/"',
    ].join("\n");
    const fromSw = (sw.context.extractStaticRefs as (t: string) => string[])(sample);
    expect([...fromSw].sort()).toEqual([...extractStaticRefs(sample)].sort());
    expect([...fromSw].sort()).toEqual([
      "/_next/static/chunks/a1.js",
      "/_next/static/chunks/b2-x_y.js",
      "/_next/static/media/c3.p.woff2",
      "/_next/static/media/d4.png",
    ]);
  });
});
