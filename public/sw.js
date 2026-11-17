// Quran Learning -- service worker (static export; audio comes from everyayah.com and is not cached).
// Three caches: shell (HTML pages, including the surahs saved by the offline download),
// static (Next.js /_next/static files, icons and fonts from /public), api (JSON in /data/).

// scripts/stamp-sw-version.ts replaces the placeholder with the Next.js build id after
// `next build`. The browser installs a new worker only when this file changes, so the
// stamp makes every deploy run "activate", which removes static files no cached page needs.
const SW_VERSION = "__SW_VERSION__";

const SHELL_CACHE = "quran-shell-v1";
const STATIC_CACHE = "quran-static-v1";
const API_CACHE = "quran-api-v1";
const ALL_CACHES = [SHELL_CACHE, STATIC_CACHE, API_CACHE];

// Pages cached at install
const SHELL_URLS = ["/", "/surahs", "/search"];

// A surah page document. RSC payloads under /surah/ (/surah/1.txt?_rsc=..., /surah/1/__next.*.txt)
// are not cached: they change with every deploy, and offline Next.js falls back to loading the page.
const SURAH_PAGE = /^\/surah\/\d+\/?$/;

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // A URL that fails must not block the install
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    deleteUnusedCaches()
      .then(pruneCaches)
      .catch((err) => console.warn("[sw " + SW_VERSION + "] cache cleanup failed", err))
      .then(() => self.clients.claim())
  );
});

async function deleteUnusedCaches() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => !ALL_CACHES.includes(name)).map((name) => caches.delete(name)));
}

/**
 * Runs on every deploy (see SW_VERSION). Never deletes a saved page:
 * - shell: removes RSC payloads that older workers cached next to the pages;
 * - static: keeps every /_next/static file a cached page needs (directly, or through a
 *   script or stylesheet it loads) and removes the rest, i.e. files of older deploys.
 */
async function pruneCaches() {
  const names = await caches.keys();
  const pageTexts = [];
  if (names.includes(SHELL_CACHE)) {
    const shell = await caches.open(SHELL_CACHE);
    for (const request of await shell.keys()) {
      const url = new URL(request.url);
      if (url.searchParams.has("_rsc") || url.pathname.endsWith(".txt")) {
        await shell.delete(request);
        continue;
      }
      const response = await shell.match(request);
      if (response) pageTexts.push(await response.text());
    }
  }
  if (!names.includes(STATIC_CACHE)) return;

  const staticCache = await caches.open(STATIC_CACHE);
  const needed = new Set();
  const queue = pageTexts.flatMap(extractStaticRefs);
  while (queue.length > 0) {
    const path = queue.pop();
    if (needed.has(path)) continue;
    needed.add(path);
    if (!/\.(js|css)$/.test(path)) continue;
    const asset = await staticCache.match(self.location.origin + path);
    if (asset) queue.push(...extractStaticRefs(await asset.text()));
  }
  for (const request of await staticCache.keys()) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/_next/static/") && !needed.has(pathname)) await staticCache.delete(request);
  }
}

// Copy of src/lib/offline/staticRefs.ts (a test keeps them in sync).
function extractStaticRefs(text) {
  const refs = new Set();
  const re = /(?:\/_next\/)?static\/(chunks|media)\/([A-Za-z0-9._~-]+)|\.\.\/media\/([A-Za-z0-9._~-]+)/g;
  for (const m of text.matchAll(re)) {
    refs.add(m[3] ? "/_next/static/media/" + m[3] : "/_next/static/" + m[1] + "/" + m[2]);
  }
  return [...refs];
}

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Other origins (everyayah.com audio, Google Fonts, ...)
  if (url.origin !== self.location.origin) return;

  // Audio is too large to cache
  if (url.pathname.endsWith(".mp3")) return;

  // Next.js static files (immutable, content hash in the name) -> cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Static JSON in /data/ (words, chapter-audio, search-index) -> network-first
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(networkFirst(event, API_CACHE, request));
    return;
  }

  // Pages: surah pages also when fetched by the offline download, other pages on navigation.
  // The static HTML does not depend on the query (?ayah=5), so pages are cached by path.
  if (SURAH_PAGE.test(url.pathname) || request.mode === "navigate") {
    event.respondWith(networkFirst(event, SHELL_CACHE, url.origin + url.pathname));
    return;
  }

  // Other static files from /public (icons, images, fonts) -> cache-first
  if (url.pathname.startsWith("/icons/") || url.pathname.match(/\.(svg|png|ico|woff2|otf)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

// ─── Strategies ────────────────────────────────────────────────────────────

/**
 * Stores a copy of the response. A failed write (e.g. storage full) is logged and
 * does not fail the request; the offline download checks the cache and reports it.
 */
function store(cacheName, key, response) {
  const copy = response.clone();
  return caches
    .open(cacheName)
    .then((cache) => cache.put(key, copy))
    .catch((err) => console.warn("[sw] could not cache " + (key.url || key), err));
}

/**
 * Cache-first: return the cached response, otherwise fetch and cache it.
 * For immutable files (JS/CSS with a content hash). The write is awaited, so a file
 * fetched by the offline download is in the cache when the page gets the response.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(request);
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
  if (response.ok) await store(cacheName, request, response);
  return response;
}

/**
 * Network-first: fetch and cache a successful response; offline, use the cache.
 * The write is awaited except for navigations (the page renders while it streams), so
 * a surah fetched by the offline download is in the cache when the page gets the response.
 */
async function networkFirst(event, cacheName, key) {
  const { request } = event;
  let response;
  try {
    response = await fetch(request);
  } catch {
    const cached = await caches.match(key);
    if (cached) return cached;
    if (request.mode === "navigate") return offlinePage();
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
  if (response.ok) {
    const saving = store(cacheName, key, response);
    if (request.mode === "navigate") event.waitUntil(saving);
    else await saving;
  }
  return response;
}

/** Shown for a page that is not cached, instead of another page's HTML at this URL. */
function offlinePage() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const OFFLINE_HTML = `<!doctype html>
<html lang="bs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nema internet veze</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #fafaf9; color: #1c1917; }
  main { max-width: 32rem; margin: 0 auto; padding: 3rem 1rem; line-height: 1.5; }
  a { color: #047857; }
  @media (prefers-color-scheme: dark) { body { background: #1c1917; color: #e7e5e4; } a { color: #34d399; } }
</style>
</head>
<body>
<main>
<h1>Nema internet veze</h1>
<p>Ova stranica nije spremljena za čitanje bez interneta.</p>
<p>Bez veze rade sure koje ste preuzeli u Postavkama (Offline čitanje) i stranice koje ste ranije otvorili.</p>
<p><a href="/">Početna</a> &middot; <a href="/surahs">Sve sure</a></p>
</main>
</body>
</html>`;
