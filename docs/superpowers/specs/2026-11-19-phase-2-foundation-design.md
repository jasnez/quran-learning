# Phase 2 "temelj": design

Date: 2026-11-19. Status: draft for the owner's approval.

## Intent

The app gets the name, voice, colors and typefaces of the approved "Tezhib" direction
(paper, ink, lacivert accent, gold as ornament only), without changing any screen layout.
Phase 3 (tajwid colors, rule bar, lessons) waits only for the tokens (PR 2.1); Phase 4
(layouts) builds on all of Phase 2.

All look decisions are already made (2026-11-19) and written down in the owner's artifacts:
the developer handoff "Tezhib u kodu" (token values, type roles, class migration map), the
design system "Tezhib" (voice guide, `tokens.json`, the mark `elif-mark.svg`) and the UX copy
deck. This phase turns them into code; it makes no new look decisions.

## Goals

1. Tokens: color, radius (and the documented spacing scale) per theme in `globals.css`,
   mapped in the Tailwind 4 `@theme inline` block; themes light, sepia (shown as "Hartija",
   stored value stays `sepia`) and dark. Values verbatim from the handoff.
2. Components use tokens only: no fixed Tailwind palette colors and no `dark:` color pairs.
3. Typefaces: Gentium Book Plus for transcription, translation and page titles; Source Sans 3
   for the UI; Noto Naskh Arabic default, Scheherazade New as "Klasično pismo".
4. The name "Elif" and its mark everywhere the app names itself.
5. The voice: "ti", gender-neutral, per the voice guide and copy deck.

## Non-goals (later phases)

- Tajwid colors, the legend redesign, the rule-name bar, lesson texts (Phase 3). The `--tj-*`
  tokens are defined in PR 2.1 but nothing uses them yet.
- Layouts, navigation structure, the reader redesign, the rosette and surah frame (Phase 4).
- App stores, domain, analytics, contact channel. Per-surah link-preview images (later).

## Anti-goals (would be a failure even if it "works")

- Losing a user's stored settings or progress: the keys `quran-learning-settings` and
  `quran-learning-progress` and the theme value `sepia` stay; a test proves stored settings
  still load.
- A theme where text drops below WCAG AA, or the axe check getting new exceptions.
- More font bytes on the surah page than today.
- Gold used as text color, or color as the only carrier of state.

## Constraints

- Stack as in the repo: Next.js 16 static export, React 19, Tailwind CSS 4, zustand.
- No new dependencies. fontTools and brotli (Python, user site) are already installed from
  Phase 1; Playwright is already a devDependency.
- Every PR passes `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:a11y` and
  `next build`. `.github/workflows/ci.yml` does not change in this phase.
- Numbers and relative time only through `src/lib/format.ts`.
- The generated `transliteration` field is never edited by hand.
- Baseline Widely available; newer CSS only as progressive enhancement.

## Approaches considered

### How components move to the tokens

A. Staged migration behind the tokens (chosen). PR 2.1 only adds variables and utilities, so
   nothing changes on screen. PRs 2.2 to 2.4 then rewrite the classes of one group of
   components each (shared controls and bars; reader and learn mode; all other screens),
   following the handoff's map. A lint rule that rejects palette colors is switched on for each
   group as it lands, and for all of `src` in PR 2.4.
   Cost: between merges the app mixes old emerald and new lacivert. Mitigation: the owner
   reviews 2.2, 2.3 and 2.4 one by one but merges them the same day.

B. Big bang: one PR rewrites all 69 files (about 1,600 color classes and 750 `dark:`
   variants). Rejected: a diff that size cannot be reviewed well, and one bad mapping hides
   among a thousand good ones.

C. Remap the Tailwind palette to tokens (`--color-emerald-700: var(--accent)` and so on), then
   clean up later. Rejected: `stone-500` serves as muted text in one place and as a border in
   another, the `dark:` pairs would point at the same token twice, the class names would keep
   lying about their color, and the look would change in PR 2.1.

### How the sepia overrides are retired

Today `[data-theme="sepia"]` overrides Tailwind's `--color-stone-500` (muted text) and
`--color-amber-600` (the qalqalah tajwid color).

- `--color-stone-500`: removed in PR 2.4, when the lint rule proves no component uses a stone
  class any more (muted text is then `text-ink-muted`).
- `--color-amber-600`: stays until Phase 3. `src/lib/quran/tajwidStyles.ts` still colors
  qalqalah with `text-amber-600`, and Phase 3 replaces those classes with `text-tj-*`.
  Removing the override now would drop qalqalah below 3:1 in sepia.
- For the same reason the `@custom-variant dark` and the `.dark` class on `<html>` stay until
  Phase 3: the tajwid classes use `dark:`. They are kept with a comment saying why.

### How fonts are built

A. Extend the Phase 1 subsetting script (chosen): one script builds both local families from
   the upstream TTFs, keeps every Latin code point found in `src`, renames the families and
   writes a coverage file that a Vitest test reads. No new tools.
B. `next/font/google` for Source Sans 3 (the handoff's first idea). Rejected by the task: the
   Bosnian letters c-caron, s-caron, z-caron, c-acute and d-stroke are in Google's `latin-ext`
   subset, so Bosnian text needs two files per weight, and the subset is not ours to check.
   (Correction, 2026-11-19: today's Geist does render these letters; next/font declares its
   `latin-ext` file too, which the browser fetches on demand, about 16.5 KB.)

## Design, per PR

The seven PRs are stacked: each branch starts from the previous one, and each PR targets the
previous PR's branch. After a base PR is squash-merged, its dependent PR is rebased onto `main`
and retargeted before the base branch is deleted (GitHub closes PRs whose base disappears).

### PR 2.1 Tokens

- `globals.css`: the three theme blocks from the handoff, verbatim (including `--overlay`),
  next to today's `--theme-*` variables, which stay untouched in this PR.
- `@theme inline`: `--color-*` for every color token, `--radius-control` (0.625rem),
  `--radius-card` (0.875rem), `--radius-sheet` (1.25rem). Pills keep `rounded-full`.
- Spacing: the design system's `space-1` to `space-12` (4 to 48 px) are exactly Tailwind's
  default 4 px scale, so no new spacing variables; the doc comment in `globals.css` says so.
  Bar heights, z-index and motion tokens come with the layouts that use them (Phase 4).
- Test (Vitest, pure logic): parses `globals.css`, reads each theme block and checks
  (1) every token has the handoff's value, and (2) the contrast of every pair the handoff
  names: `ink`, `ink-muted`, `accent-text`, `danger-text`, `success-text`, `warning-text` on
  `paper` and `surface` at 4.5:1 or more; `ink` on `surface-sunken`, `highlight` and `mark`;
  `on-accent` on `accent` and `accent-hover`; `accent-text` on `accent-wash`; `line-strong`
  and `gold` at 3:1 or more (non-text). The tajwid tokens are checked against `surface` at 3:1
  (large Arabic text) so Phase 3 starts from a proven set.
- Test: a settings blob as stored today (`quran-learning-settings`, theme `sepia`, older
  shape) loads into the store unchanged.
- No visible change: checked with before/after screenshots of three routes in three themes.

### PRs 2.2 to 2.4 Class migration

- Map: the handoff's table, plus, where it is silent: red and rose text to `danger-text`,
  red fills to `danger`, green and emerald status text to `success-text`, amber notes to
  `warning-text`, highlight-from-search to `mark`, the dialog backdrop to `overlay`,
  `focus:ring-*` to the handoff's `focus-visible:outline-*` form. Anything still unclear is
  decided on the main model and added to the plan's map before the subagent continues.
- `dark:` color variants are deleted in every migrated file.
- Group 1 (PR 2.2): `ui/*`, `layout/*`, `audio/AudioPlayer`, `settings/SettingsPanel`,
  `pwa/*`, the `--theme-*` uses in `globals.css` (settings dialog, letter table) and `body`.
  The theme option reads "Hartija" (value `sepia`).
- Group 2 (PR 2.3): `reader/*`, `quran/*` (except the tajwid rule classes), `learn/*`,
  `test/*`, the surah, juz and learn routes.
- Group 3 (PR 2.4): everything else (home, surahs, bookmarks, progress, duas, names, tajwid
  pages and quiz, search, about, contact, sources, harfovi, errors, loading states). Then the
  `--theme-*` variables, `--color-stone-500` override and old `--background` values go;
  `--background`/`--foreground` become aliases of `paper`/`ink` (the tajwid "normal" class
  uses `text-foreground`).
- Guard: an ESLint `no-restricted-syntax` selector on string literals and template parts that
  match a palette color class (`(bg|text|border|ring|outline|fill|stroke|from|to|via|divide|
  decoration|placeholder|shadow|accent|caret)-(white|black|<22 palettes>)`) and on `dark:`.
  It reuses the existing `no-restricted-syntax` selectors (flat config replaces a rule's
  options per file, so the list is shared, not duplicated). Each PR adds its group's globs;
  PR 2.4 widens it to `src/**` minus `src/lib/quran/tajwidStyles.ts`,
  `src/data/tajwid-lessons/**` (both Phase 3) and tests.
- The axe allowlist in `tests/e2e/a11y.spec.ts` loses each "Phase 2: tokens" entry as its
  node is fixed (a stale entry fails the run, so this is enforced).
- Implementation of each group by a subagent (Sonnet, medium effort) from the plan's map;
  every diff reviewed on the main model before it counts.
- Screenshots: 375 px and 1280 px, three themes, before and after, for the routes each group
  touches, plus a keyboard pass (focus outline visible in all three themes).

### PR 2.5 Typefaces

- One script, `scripts/subset-fonts.py`, generalised from `subset-transliteration-font.py`
  (same code-point collection, same coverage-file format, same `-I` usage), builds:
  - the reading family from Gentium Book Plus Regular and Bold (Italic only if a measured use
    remains after transcription becomes upright);
  - the UI family from Source Sans 3 (400, 600, 700).
  OFL: Gentium reserves "Gentium" and "SIL", Source Sans reserves "Source"; subsets are
  Modified Versions, so the families, files and CSS names are renamed ("Elif Book" and
  "Elif Sans"), the copyright notices stay and each OFL text ships next to the fonts.
- `layout.tsx`: both via `next/font/local`; Geist removed; Noto Naskh Arabic only 400 and 600
  (today 400 to 700); Scheherazade New unchanged (not preloaded).
- `@theme inline`: `--font-sans` (so `font-sans` and the body default) to the UI family,
  `--font-read`, `--font-ar`. `font-read` on transcription, translation and `h1` page titles.
  Transcription: upright, 18 px mobile / 19 px desktop, line-height 1.55, `ink-muted`.
- Settings: "Pismo" options read "Moderno pismo" / "Klasično pismo" (values unchanged).
- Tests: every character of the ayah data (transcription, translation, surah names) is in the
  reading font; every Latin character in UI strings is in the UI font.
- Budget: font bytes transferred on `/surah/1` and `/` on a production build, measured with
  Playwright before and after; the PR states both numbers and fails the goal if after > before.

### PR 2.6 Name and mark

- `SITE_NAME = "Elif"` feeds titles, Open Graph and Apple web-app title. Manifest `name` and
  `short_name` "Elif", `theme_color` and `background_color` from the light tokens; the viewport
  `themeColor` too. Header, install prompt, About page and footer ("(c) 2026 Elif") use the
  constant. Storage keys and service-worker cache names stay.
- The mark: `public/icons/elif-mark.svg` from the design system (shapes only, no text).
  `scripts/generate-icons.mjs` renders it with Playwright to PNG 192, 512, maskable 512 (full
  bleed, artwork inside the 80% safe zone) and 180 (`apple-touch-icon`), plus the SVG favicon,
  and a 1200x630 link-preview image (mark, name, tagline from the copy deck) using the app's
  own font files. The Twitter card becomes `summary_large_image`.
- Installed PWAs pick up the new name and icon only when the browser refreshes the manifest
  (Android Chrome: on a later launch; iOS: only after re-adding). The owner tells the two
  friends when this PR is live.

### PR 2.7 Voice

- The remaining sentences that address the user move to "ti", gender-neutral, from the copy
  deck; the About page gets the deck's intro.
- `docs/glas.md`: the voice guide and glossary (from the design system and copy deck), in
  Bosnian, plain ASCII punctuation where it is markup.
- `src/components/__tests__/copyRules.test.ts` also rejects "Vi" forms (Vi, Vas, Vam, Vama,
  Vaš and its forms, and plural imperatives on a word list) and the old name "Quran Learning".

## Left to the builder

- The exact palette-to-token choice for classes the map does not cover, recorded in the plan.
- The font family names (proposed "Elif Book" / "Elif Sans").
- Which routes the screenshot script covers per group (at least every route the group renders).

## Needs the owner's OK (asked with this doc)

1. Font downloads (OFL, from github.com/google/fonts): Source Sans 3 (new), and Gentium Book
   Plus Bold (Phase 1 had Regular and Italic for the transcription line only; this extends it
   to translation and titles).
2. Merging 2.2, 2.3 and 2.4 on the same day, so production never shows the mixed look for long.
