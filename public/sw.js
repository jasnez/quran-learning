// Quran Learning — Service Worker
// Tri cache-a: shell (HTML stranice), static (Next.js assets), api (JSON podaci)

const SHELL_CACHE = "quran-shell-v1";
const STATIC_CACHE = "quran-static-v1";
const API_CACHE = "quran-api-v1";
const ALL_CACHES = [SHELL_CACHE, STATIC_CACHE, API_CACHE];

// Stranice koje se pre-kešuju pri instalaciji
const SHELL_URLS = ["/", "/surahs", "/search"];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // addAll ignoriše greške pojedinih URL-ova da ne blokira SW install
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Preskoči zahtjeve ka vanjskim domenama (Supabase, audio CDN, Google Fonts…)
  if (url.origin !== self.location.origin) return;

  // Preskoči audio fajlove — preveliki za keš
  if (url.pathname.endsWith(".mp3")) return;

  // Next.js statički resursi (immutable, content-hash u imenu) → Cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API rute za sure i učače → Network-first + fallback na keš
  if (
    url.pathname.startsWith("/api/surahs") ||
    url.pathname.startsWith("/api/reciters")
  ) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Surah stranice — keširaj i navigate i programatske fetch pozive
  // (za "preuzmi offline" funkciju koja pre-kešira sve sure)
  if (url.pathname.match(/^\/surah\/\d+/)) {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Ostali navigacijski zahtjevi (HTML stranice) → Network-first + fallback na keš
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Ostali statički resursi (slike, fontovi iz /public) → Cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(svg|png|ico|woff2|otf)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

// ─── Strategije ────────────────────────────────────────────────────────────

/**
 * Cache-first: vrati iz keša ako postoji, inače dohvati s mreže i keširaj.
 * Idealno za immutable resurse (JS/CSS sa content hashom).
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

/**
 * Network-first: pokušaj mrežu, keširaj uspješan odgovor.
 * Ako mreža nije dostupna, vrati iz keša.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Za navigacijske zahtjeve — pokušaj root stranicu kao fallback
    if (request.mode === "navigate") {
      const rootCache = await caches.match("/");
      if (rootCache) return rootCache;
    }

    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
