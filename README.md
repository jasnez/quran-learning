# Quran Learning Platform

Static-only web aplikacija za čitanje i učenje Kur'ana — bez backend-a, bez auth-a, bez baze. Sve podatke učitava iz JSON fajlova u `src/data/`, audio sa everyayah.com.

## Funkcionalnosti

- **Sve sure (114)** — Pretraga po imenu i broju, lista u virtualizovanom listu
- **Surah reader** — Arapski tekst sa tajwid bojama, transliteracija, bosanski prijevod (Besim Korkut)
- **Learn mod** — Fokus na pojedinačnom ajetu sa kontrolama
- **Word-by-word** — Sinhronizirano označavanje riječi tokom audio reprodukcije (samo Al-Fatiha za sada)
- **Audio reprodukcija** — Po-ajet ili cijela sura, repeat (sura/ajet), playback speed, pauza između ajeta
- **Kur'anske dove** — 71 dova razvrstana u kategorije
- **Tajwid lekcije** — Interaktivni kvizovi
- **99 Allahovih imena**
- **Bookmarks, progress, settings** — Pohranjeno u localStorage + IndexedDB (lokalno, bez sync-a između uređaja)
- **Pretraga** — Full-text preko svih ajeta (arapski, transliteracija, bosanski prijevod)
- **PWA** — Offline support kroz service worker, install na home screen
- **Responsive** — Mobile-first, podrška za iOS safe areas

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Jezik:** TypeScript (strict mode)
- **Stilovi:** Tailwind CSS 4
- **State:** Zustand (player, settings, bookmarks, progress, toast) sa localStorage persist
- **Async cache:** React Query + IndexedDB persister (samo za pretragu)
- **Virtualizacija:** @tanstack/react-virtual (lista sura)
- **Fontovi:** Geist, Geist Mono, Amiri, KFGQPC Uthmanic Script HAFS (arapski)
- **Test:** Vitest, Testing Library, Playwright (e2e)

## Preduvjeti

- Node.js 18+
- npm

## Pokretanje

```bash
npm install

# Razvoj
npm run dev
# Otvori http://localhost:3000

# Production build
npm run build
npm start

# Lint
npm run lint

# Test (unit + integration)
npm test

# Test (e2e)
npm run test:e2e

# Build + test prije deploya
npm run deploy:check
```

**Nema env varijabli** koje moraju biti postavljene. Aplikacija radi van box-a.

Opciono (za alternativne audio izvore):
- `NEXT_PUBLIC_AUDIO_CDN_URL` — vlastiti CDN (default: everyayah.com)
- `NEXT_PUBLIC_AUDIO_VIA_PROXY=1` — proxy audio kroz `/api/audio` (CORS bypass)

## Rute

| Route | Opis |
|-------|------|
| `/` | Home: featured sure, dnevna dova, continue learning |
| `/surahs` | Lista svih sura sa pretragom + juzevi pregled |
| `/surah/[surahId]` | Reader (npr. `/surah/1`) |
| `/learn/[surahId]` | Learn mod sa fokusom na ajetu |
| `/juz/[juzId]` | Reader džuza (1-30) |
| `/search` | Full-text pretraga |
| `/bookmarks` | Označeni ajeti (local-only) |
| `/progress` | Napredak učenja (local-only) |
| `/duas` | Sve Kur'anske dove |
| `/duas/[category]` | Dove po kategoriji (rabbana, forgiveness, itd.) |
| `/tajwid` | Tajwid lekcije |
| `/tajwid/[lessonId]` | Pojedinačna lekcija |
| `/test/[surahId]` | Kviz po suri |
| `/names` | 99 Allahovih imena |
| `/settings` | Postavke (tema, font, audio opcije) |
| `/about`, `/contact`, `/sources` | Statičke info stranice |

API rute (sve čitaju iz static JSON-ova):

| Route | Opis |
|-------|------|
| `/api/surahs` | Lista svih sura |
| `/api/surahs/[n]` | Detalji sure + ajeti |
| `/api/surahs/[n]/words` | Word-by-word podaci (samo Al-Fatiha) |
| `/api/reciters` | Lista recitatora |
| `/api/search?q=...` | Pretraga ajeta |
| `/api/audio?path=...` | Audio proxy s everyayah fallback-om |
| `/api/quran/chapter-audio` | Proxy za Quran.com chapter audio |
| `/api/quran/chapter-words` | Proxy za Quran.com word-level data |

## Struktura projekta

```
quran-learning-main/
├── src/
│   ├── app/                     # Next.js App Router (rute)
│   │   ├── api/                 # API rute (static data, proxiji)
│   │   ├── bookmarks/, progress/, search/, settings/, ...
│   │   ├── surah/[surahId]/, learn/[surahId]/, juz/[juzId]/
│   │   ├── duas/, tajwid/, names/
│   │   ├── layout.tsx, page.tsx, error.tsx, not-found.tsx
│   ├── components/
│   │   ├── audio/              # AudioPlayer
│   │   ├── reader/             # SurahReaderContent, AyahCard
│   │   ├── learn/              # LearnModeContent, OptionToggle
│   │   ├── layout/             # AppShell, Header, MobileNav, Footer, ThemeProvider
│   │   ├── settings/, surahs/, search/, bookmarks/, duas/, tajwid/, names/
│   │   ├── quran/              # TajwidTextRenderer, WordByWordRenderer
│   │   ├── pwa/                # ServiceWorkerRegistration
│   │   └── ui/                 # Toast, OfflineIndicator, BackToTop
│   ├── lib/
│   │   ├── data/               # static-quran.ts (glavni izvor podataka), juzUtils
│   │   ├── audio/              # audioManager, getResolvedAudioUrl, reciterUtils, wordTimingService
│   │   ├── api/                # client.ts (fetch wrapperi), getBaseUrl
│   │   ├── quran/              # tajwidStyles, wordUtils, stripWaqfSigns, fetch-verses
│   │   ├── search/             # searchEngine, searchIndex
│   │   ├── duas/, names/       # data + helpers
│   │   ├── idb/                # IndexedDB persister za React Query
│   │   └── utils/, profile/
│   ├── store/                  # Zustand: player, settings, bookmark, progress, toast
│   ├── providers/              # QueryProvider
│   ├── hooks/                  # useMediaQuery, useIsMobile, useOfflineDownload
│   ├── contexts/               # SettingsOpenContext, ScrollContext
│   ├── types/                  # quran, settings, audio, bookmarks, wordByWord, duas
│   └── data/                   # Statički JSON: surahs, ayahs (114), reciters, juz, words, tajwid-lessons
├── public/
│   ├── sw.js                   # Service Worker
│   ├── manifest.webmanifest    # PWA manifest
│   └── icons/                  # PWA ikone
├── scripts/
│   ├── generate-ayahs-json.ts  # Generiše ayah JSON iz Quran.com API-ja
│   └── download-audio-sample.ts
├── tests/e2e/                  # Playwright e2e testovi
└── ... (config files: next.config.ts, vercel.json, tsconfig.json, eslint.config.mjs)
```

## Persistence

Sve user-podatke (bookmarks, progress, settings) čuvamo lokalno:

- **localStorage** — Zustand persist za settings, player state, audio postavke
- **IndexedDB** — React Query cache (search rezultati), offline kešovani API odgovori preko Service Worker-a
- **Service Worker** — Pre-keš za HTML stranice (`/`, `/surahs`, `/search`), runtime cache za API odgovore i statičke resurse

Nema cross-device sync-a (zahtjevalo bi auth + backend). Bookmarks/progress su vezane za uređaj/browser.

## Audio

Audio recitacije se serviraju s besplatnog javnog CDN-a [everyayah.com](https://everyayah.com):

```
https://everyayah.com/data/Alafasy_128kbps/{SSSAAA}.mp3
```

Trenutno podržan reciter: Mishary Alafasy. Za dodavanje novih recitatora vidi [src/lib/audio/getResolvedAudioUrl.ts](src/lib/audio/getResolvedAudioUrl.ts) (treba reciter-aware mapping na everyayah folder strukturu).

## Regeneracija podataka

Ayah JSON fajlovi (`src/data/ayahs/NNN-slug.json`) su pre-generisani iz Quran.com API-ja sa tajwid označavanjem. Da regenerišeš:

```bash
# Generiše samo sure koje nemaju JSON
npm run generate:ayahs

# Prepiše sve 114 sura (~1 minuta)
npm run generate:ayahs -- --force
```

## Deploy

### Vercel (default)

```bash
git push origin main  # Vercel auto-deploy
```

Bez env varijabli za osnovnu funkcionalnost. Build je ~5 sekundi.

### Drugi static host-ovi

Aplikacija je trenutno hibridna (SSR + Server Actions + API proxiji za Quran.com / everyayah). Za pure static export (Cloudflare Pages, Netlify, GitHub Pages):

1. Postaviti `output: "export"` u `next.config.ts`
2. Refaktorisati API proxije (`/api/audio`, `/api/quran/*`) na klijent-side fetch (možda CORS issues)

## License

Privatno / obrazovna upotreba. Tekst Kur'ana i prijevodi prate svoje izvore i licence — vidi [src/app/sources/page.tsx](src/app/sources/page.tsx).
