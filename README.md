# Quran Learning Platform

A web app for reading and learning the Quran with tajwid helpers, transliteration (Bosnian Latin), Bosnian translation, and per-ayah audio playback.

## Features

- **Surah list** — Browse all 114 surahs with search
- **Surah reader** — Arabic text with tajwid colors, transliteration, and Bosnian translation (Besim Korkut)
- **Learn mode** — Focus on first/last ayahs of a surah with optional audio
- **Audio player** — Per-ayah playback with repeat, next/previous, and playback speed
- **Settings** — Theme (light/dark), Arabic font size, toggles for transliteration, translation, tajwid colors, repeat ayah, auto-play next
- **Responsive** — Mobile-friendly layout and touch targets

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State:** Zustand (player + settings)
- **Fonts:** Geist, Geist Mono, Amiri (fallback), KFGQPC Uthmanic Script HAFS (Arabic)
- **Testing:** Vitest, Testing Library

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

## Install and run

```bash
# Install dependencies
npm install

# Development
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm start

# Lint
npm run lint

# Tests
npm test
```

## Generating ayah data

Ayah JSON files (`src/data/ayahs/NNN-slug.json`) include Arabic text, transliteration, and Bosnian translation (Besim Korkut) from the Quran.com API. To (re)generate them:

```bash
cd quran-learning

# Generiše samo sure koje nemaju JSON
npm run generate:ayahs

# Prepiše sve 114 sura (uključujući 1, 112, 113, 114)
npm run generate:ayahs -- --force
```

Without `--force`, existing files are skipped. With `--force`, all 114 surahs are fetched and written (takes about 1 minute).

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home: hero, featured surahs, feature list |
| `/surahs` | List of all surahs with search |
| `/surah/[surahId]` | Surah reader (e.g. `/surah/1`) |
| `/learn/[surahId]` | Learn mode for first/last ayahs (e.g. `/learn/1`) |

## Folder structure

```
quran-learning/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout, fonts, theme script
│   │   ├── page.tsx            # Home
│   │   ├── globals.css
│   │   ├── surahs/             # Surah list page
│   │   ├── surah/[surahId]/    # Surah reader page
│   │   └── learn/[surahId]/    # Learn mode page
│   ├── components/
│   │   ├── audio/              # AudioPlayer
│   │   ├── layout/             # AppShell, Header, Footer, ThemeProvider, MobileNav
│   │   ├── learn/              # LearnModeContent
│   │   ├── reader/             # SurahReaderContent, AyahCard, SurahHeader
│   │   ├── settings/           # SettingsPanel
│   │   ├── surahs/             # SurahList, SurahListItem, SearchInput
│   │   ├── quran/              # TajwidTextRenderer, TajwidLegend, AyahLine
│   │   ├── navigation/
│   │   └── ui/
│   ├── lib/
│   │   ├── audio/              # audioManager (load, play, seek, events)
│   │   ├── data/               # getSurah, getAllSurahs, getAyahs
│   │   ├── quran/              # fetch-verses, tajwidStyles, constants, api-types
│   │   └── utils/
│   ├── store/                   # Zustand: playerStore, settingsStore
│   ├── hooks/                   # useMediaQuery, useIsMobile
│   ├── types/                   # quran, settings, audio
│   └── data/                   # Static JSON: surahs, ayahs, reciters
├── public/
├── eslint.config.mjs
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Settings persistence

Settings (theme, font size, toggles) are stored in `localStorage` under the key `quran-learning-settings` and are rehydrated on load so they persist across page refreshes.

## License

Private / educational use. Quran text and translations follow their respective sources and licenses.

## Push to GitHub

If this project is not yet in a Git repo:

```bash
cd quran-learning
git init
git add .
git commit -m "Initial commit: Quran Learning Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If the repo root is the parent folder (`Quran-learning`), run `git add .` and `git commit` from that folder and ensure `quran-learning/.gitignore` is respected.
