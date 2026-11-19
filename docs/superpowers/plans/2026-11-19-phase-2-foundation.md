# Phase 2 "temelj" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The app gets the Tezhib tokens, typefaces, the name "Elif" with its mark, and the "ti" voice, without changing any screen layout.

**Architecture:** CSS variables per theme in `src/app/globals.css`, exposed as Tailwind 4 utilities through `@theme inline`; components move from palette classes to those utilities in three groups behind a local ESLint rule; two self-hosted font subsets built by one Python script; the name flows from `SITE_NAME`.

**Tech Stack:** Next.js 16 (static export), React 19, Tailwind CSS 4, zustand, Vitest, Playwright, ESLint 9 flat config, Python fontTools (already installed, user site).

**Spec:** `docs/superpowers/specs/2026-11-19-phase-2-foundation-design.md` (approved by the owner 2026-11-19, with both requests: the font downloads and merging 2.2 to 2.4 the same day).

## Global Constraints

- Storage keys `quran-learning-settings`, `quran-learning-progress` and the theme value `sepia` never change.
- No new npm or Python dependencies; Playwright, fontTools and brotli are already installed.
- Do not touch `src/lib/quran/tajwidStyles.ts`, `src/data/tajwid-lessons/**`, the `--color-amber-600` sepia override, `@custom-variant dark` or the `.dark` class (all Phase 3).
- Do not change layouts (element order, grid/flex structure, spacing classes) except where a task says so.
- Never hand-edit the generated `transliteration` field.
- Numbers and relative time only through `src/lib/format.ts`; never `Intl` with "bs" directly.
- `.github/workflows/ci.yml` does not change.
- Gates for every PR: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:a11y`, `npm run build`.
- Text files UTF-8 without BOM; code, comments and commits in English; plain ASCII punctuation in config and markdown.
- Git: stage files by name; commit messages follow the repo (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`); end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commits stay local until the owner says push.

## Branches (stacked)

| PR | Branch | Base |
|---|---|---|
| 2.1 | `claude/phase-2-1-tokens` | `main` (3f74ceb) |
| 2.2 | `claude/phase-2-2-shared` | 2.1 |
| 2.3 | `claude/phase-2-3-reader` | 2.2 |
| 2.4 | `claude/phase-2-4-screens` | 2.3 |
| 2.5 | `claude/phase-2-5-typefaces` | 2.4 |
| 2.6 | `claude/phase-2-6-name` | 2.5 |
| 2.7 | `claude/phase-2-7-voice` | 2.6 |

The spec and this plan are the first commit on 2.1. After the owner squash-merges a PR, rebase the next branch with `git rebase --onto main <old-base> <branch>` and retarget its PR to `main` before the old base branch is deleted.

## Review Focus

1. A user whose stored settings say `theme: "sepia"` (or an older blob without `pauseAfterAyah`) opens the new build: the Hartija theme loads, nothing resets. Pinned in Task 1.
2. Text on the playing ayah (`highlight`) and on the search hit (`mark`) in all three themes, including tajwid-colored Arabic: readable. Pinned by the contrast test (Task 1); axe never sees a playing ayah, so Task 3's screenshot list includes one in each theme.
3. Keyboard focus on every migrated control stays visible in all three themes and in forced colors (outline, not ring). Pinned by Task 2's ESLint rule (rejects `focus:ring-*` palette classes) and each migration task's keyboard pass.
4. Bosnian letters (c-caron, c-acute, d-stroke, s-caron, z-caron) and every transcription letter render in the new local fonts, not a fallback. Pinned by the coverage tests in Task 6.
5. An installed PWA (Android) after the rename shows "Elif" and the new icon; nothing that identifies the app to the browser (start_url, scope, storage, SW cache names) changes. Pinned in Task 7 by a manifest test.

---

### Task 1 (PR 2.1): Tezhib tokens

**Files:**
- Modify: `src/app/globals.css` (theme blocks at lines 6-47, `@theme inline` at 49-54)
- Create: `src/lib/theme/contrast.ts`
- Test: `src/lib/theme/__tests__/contrast.test.ts`, `src/app/__tests__/themeTokens.test.ts`, `src/store/__tests__/settingsStore.test.ts` (add cases)

**Interfaces:**
- Produces: CSS custom properties `--paper --surface --surface-sunken --ink --ink-muted --line --line-strong --accent --accent-hover --accent-text --accent-wash --on-accent --gold --highlight --mark --danger --danger-text --success-text --warning-text --tj-medd --tj-gunne --tj-ihfa --tj-kalkala --overlay` on `:root, [data-theme="light"]`, `[data-theme="sepia"]`, `[data-theme="dark"]`; Tailwind utilities `{bg,text,border,outline,ring,fill,stroke}-{token}` via `--color-{token}: var(--{token})` for every color token except `overlay` (exposed as `--color-overlay` too); `rounded-control` (0.625rem), `rounded-card` (0.875rem), `rounded-sheet` (1.25rem).
- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number` in `src/lib/theme/contrast.ts` (WCAG 2.x formula, `#RRGGBB` only, throws on other input).

- [ ] **Step 1: Write failing tests.**
  - `contrast.test.ts`: `contrastRatio("#000000", "#FFFFFF")` is 21; `contrastRatio("#1E1B16", "#F7F4ED")` rounds (2 decimals) to the handoff's 15.6 within 0.1; symmetric; throws on `"red"`.
  - `themeTokens.test.ts`: reads `src/app/globals.css`, collects `--name: value` declarations from every block whose selector names that theme (`:root`/`[data-theme="light"]`, `[data-theme="sepia"]`, `[data-theme="dark"]`). Case 1: each theme's 23 hex tokens equal this table (copied verbatim from the handoff):

    | token | light | sepia | dark |
    |---|---|---|---|
    | paper | #F7F4ED | #F1E8D5 | #10141B |
    | surface | #FFFDF8 | #F8F1E2 | #171D27 |
    | surface-sunken | #EFE9DC | #E9DDC4 | #0C1015 |
    | ink | #1E1B16 | #33281A | #ECE6DA |
    | ink-muted | #5F584A | #64543D | #A69F91 |
    | line | #E2DBCB | #DCCDB0 | #2A3242 |
    | line-strong | #8A8170 | #8A7A5E | #6B7486 |
    | accent | #1F3A5F | #22406B | #3B5F95 |
    | accent-hover | #182E4C | #1B3456 | #4A6FA8 |
    | accent-text | #1F3A5F | #22406B | #A9C3EC |
    | accent-wash | #E3E9F2 | #DEDCD4 | #1F2A3D |
    | on-accent | #FFFFFF | #FFFFFF | #FFFFFF |
    | gold | #A9843A | #977532 | #D4B46C |
    | highlight | #F1E6CC | #E8D9B5 | #2A2618 |
    | mark | #F3DF9B | #EBD38A | #4A3F1A |
    | danger | #A3241B | #A3241B | #C2453B |
    | danger-text | #A3241B | #A3241B | #F2A196 |
    | success-text | #2E6B34 | #2B6631 | #9BD3A0 |
    | warning-text | #7A5200 | #734D00 | #E8C27A |
    | tj-medd | #B3261E | #A3241B | #FF8A80 |
    | tj-gunne | #2E7D32 | #2B6E2F | #81C784 |
    | tj-ihfa | #00796B | #0B6B5F | #4DB6AC |
    | tj-kalkala | #0E72A8 | #0B6A9C | #64B5F6 |

    and `--overlay` is `rgb(16 20 27 / 0.5)`, `rgb(51 40 26 / 0.45)`, `rgb(0 0 0 / 0.6)`.
    Case 2 (per theme, `it.each`): at least 4.5:1 for `ink`, `ink-muted`, `accent-text`, `danger-text`, `success-text`, `warning-text` on `paper` and on `surface`; `ink` on `surface-sunken`, `highlight`, `mark`, `accent-wash`; `accent-text` on `accent-wash`; `on-accent` on `accent`, `accent-hover`, `danger`. At least 3:1 for `line-strong` and `gold` on `paper` and `surface`, and for each `tj-*` on `surface` and `highlight`. The failure message names theme, pair and ratio.
    Case 3: every `--color-<token>` in `@theme inline` is `var(--<token>)`, and the three radius values are as above.
  - `settingsStore.test.ts`: (a) a stored blob `{"state":{"theme":"sepia","arabicFontSize":32,"arabicFontStyle":"uthmanic","showTransliteration":false,"showTranslation":true,"showTajwidColors":true,"selectedReciterId":"mishary-alafasy","playbackSpeed":1,"repeatMode":"off","autoPlayNext":true},"version":0}` under `quran-learning-settings` rehydrates to theme `sepia`, size 32, `uthmanic`, transcription off, and `pauseAfterAyah` default `"off"`; (b) `SETTINGS_STORAGE_KEY === "quran-learning-settings"`. Use the store's `persist.rehydrate()` after seeding `localStorage`, as the existing tests do.
- [ ] **Step 2:** `npx vitest run src/lib/theme src/app/__tests__/themeTokens.test.ts src/store/__tests__/settingsStore.test.ts` fails (no module, no tokens). The store case may already pass: that is fine, it guards the future.
- [ ] **Step 3:** Implement `contrast.ts`; add the three theme token sets to the existing theme blocks in `globals.css` (keep every `--theme-*` line); add the `@theme inline` entries and radii; a comment above the blocks: values from "Tezhib u kodu", spacing follows Tailwind's 4 px scale (`space-1` = `1` ... `space-12` = `12`), no new spacing variables. If a contrast case fails with the verbatim values, stop and report the pair to the owner; do not change a value.
- [ ] **Step 4:** Tests pass; `npm run typecheck`, `npm run lint`.
- [ ] **Step 5:** No visible change: build, screenshot `/`, `/surah/1`, `/settings` at 375 and 1280 in three themes before (on `main`) and after; images identical (pixel diff 0). Screenshot tool: `shots.mjs` in the scratchpad (Playwright Chromium, serves `out/` with a small Node static server, sets `quran-learning-settings` in `localStorage` per theme, waits for fonts).
- [ ] **Step 6:** `npm test`, `npm run build`, `npm run test:a11y` (no allowlist change expected).
- [ ] **Step 7:** Commit spec + plan (`docs: phase 2 design and plan`), then `feat: Tezhib color and radius tokens for light, sepia and dark`. Tell the owner PR 2.1 is ready (Phase 3 waits for it).

### Task 2 (PR 2.2): palette guard + shared controls and bars

**Files:**
- Create: `eslint-rules/no-palette-colors.mjs`, `eslint-rules/__tests__/no-palette-colors.test.ts`
- Modify: `eslint.config.mjs`, `vitest.config.*` include (if it does not already collect `eslint-rules/**`), `src/app/globals.css` (`body`, `.settings-dialog`, its backdrop, `.letter-table*`, `[data-highlight-from-search]`, `.letter-table-region:focus-visible`)
- Migrate: `src/components/ui/*`, `src/components/layout/*`, `src/components/audio/AudioPlayer.tsx`, `src/components/settings/SettingsPanel.tsx`, `src/components/pwa/*`
- Modify: `tests/e2e/a11y.spec.ts` (drop entries that no longer match)

**Interfaces:**
- Produces: ESLint rule `local/no-palette-colors` (plugin object `local` defined in `eslint.config.mjs`), reporting a string literal, JSX text attribute or template element that contains a palette color class, a `dark:` variant, or `var(--theme-`. Message: `Use a Tezhib token class (bg-paper, text-ink, ...) instead of "<match>".`
- Produces: `PALETTE_GUARDED_FILES: string[]` constant in `eslint.config.mjs`, one glob list that Tasks 3 and 4 extend.

- [ ] **Step 1: Rule test first** (`RuleTester` from `eslint`, run by Vitest). Invalid: `"text-stone-500"`, `"hover:bg-emerald-800"`, `` `px-2 ${a} bg-white/95` ``, `"dark:text-stone-100"`, `"bg-[var(--theme-card)]"`, `"focus:ring-emerald-600"`. Valid: `"text-ink-muted"`, `"bg-surface/95"`, `"text-tj-medd"`, `"whitelist"`, `"border-stone"` (no shade, not a class here: the regex requires a known palette name followed by `-<shade>` or one of `white|black`), `"dark-mode"`.
  Regex (word-boundary on class tokens): `(?:^|[\s"'\x60:])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|decoration|placeholder|shadow|accent|caret)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?:\/\d+)?(?=$|[\s"'\x60])`, plus `(?:^|\s)dark:` and `var\(--theme-`.
- [ ] **Step 2:** Rule test fails; write the rule; test passes.
- [ ] **Step 3:** Register in `eslint.config.mjs`: `{ files: PALETTE_GUARDED_FILES, plugins: { local }, rules: { "local/no-palette-colors": "error" } }` with this task's globs (`src/components/ui/**`, `src/components/layout/**`, `src/components/audio/AudioPlayer.tsx`, `src/components/settings/**`, `src/components/pwa/**`), tests ignored. `npm run lint` lists the offenders (expected: many).
- [ ] **Step 4: Migrate the group** (subagent, Sonnet, medium) with the **Class map** below. Remove every `dark:` color variant. Settings theme option `sepia` gets label `"Hartija"`. `globals.css`: `body` background `var(--paper)`, color `var(--ink)`; `.settings-dialog` border `var(--line)`, background `var(--surface)`, color `var(--ink)`, radius `var(--radius-sheet)` on the mobile sheet corners (was 1rem: allowed, it is the handoff's sheet radius), shadow `0 12px 32px rgb(0 0 0 / 0.18)`; backdrop `var(--overlay)` (the transition's transparent start stays `rgb(0 0 0 / 0)`); search highlight both rules become one `background-color: var(--mark) !important`; `.letter-table*` `--theme-*` become `paper/surface/ink/ink-muted/line`, focus outline `var(--accent-text)`.
- [ ] **Step 5:** Main-model review of the full diff: every replacement follows the map, no layout class changed, no text changed except "Hartija". `npm run lint` clean for the group.
- [ ] **Step 6:** Screenshots before/after: `/` (header, nav, footer, install prompt visible), settings dialog open, `/surah/1` with the player bar, a toast, at 375 and 1280 in three themes; keyboard pass through header, nav, settings and player in each theme (focus outline visible).
- [ ] **Step 7:** Gates; remove axe allowlist entries that are now stale. Commit `feat: palette guard and Tezhib tokens in shared controls and bars`.

**Class map** (used by Tasks 2 to 4; the left side includes every `hover:`, `focus:`, `group-hover:`, opacity `/N` form):

| Today | Becomes |
|---|---|
| `text-stone-900/800/700`, `text-zinc-900`, `text-gray-800`, `text-[var(--theme-text)]` | `text-ink` |
| `text-stone-600/500/400/300`, `text-zinc-600/500`, `text-[var(--theme-text-muted)]` | `text-ink-muted` |
| `hover:text-stone-*` | `hover:text-ink` |
| `text-white` on an accent or danger fill | `text-on-accent` |
| `text-stone-100` / `text-white` on a dark stone fill (toast) | `text-paper` |
| `text-emerald-*`, `hover:`/`group-hover:text-emerald-*`, `text-[var(--theme-accent)]` | `text-accent-text` |
| `text-amber-700/800/900` (notes, warnings) | `text-warning-text` |
| `text-amber-500/600`, `bg-amber-400/500/700` on an ornament (star, streak dot) | `text-gold` / `bg-gold` |
| `text-red-*`, `hover:text-red-*` | `text-danger-text` |
| `bg-white`, `bg-white/N`, `bg-[var(--theme-card)]` | `bg-surface`, `bg-surface/N` |
| `bg-stone-50`, `bg-stone-50/N`, `to-stone-50`, `bg-[var(--theme-bg)]` | `bg-paper` (same `/N`) |
| `bg-stone-100/200`, `bg-stone-200/80`, `bg-zinc-200` | `bg-surface-sunken` |
| `hover:bg-stone-50/100/200`, `hover:bg-amber-50/100` | `hover:bg-surface-sunken` |
| `bg-stone-700/800(/95)` (toast, inverse chip) | `bg-ink` (same `/N`) |
| `hover:bg-stone-600/700` | `hover:bg-ink/90` |
| `bg-emerald-400/500/600/700/800` (buttons, fills, progress) | `bg-accent` |
| `hover:bg-emerald-*` on those | `hover:bg-accent-hover` |
| `bg-emerald-50/100`, `from-emerald-50/90` (selected, current) | `bg-accent-wash` (with `text-accent-text`) |
| `hover:bg-emerald-100/200` | `hover:bg-accent-wash` |
| `bg-amber-50`, `bg-amber-50/50`, `bg-amber-50/80` (playing or current ayah) | `bg-highlight` |
| `bg-amber-100/200` (badge, note box) | `bg-highlight` |
| `hover:bg-amber-800`, `bg-amber-700` (amber button) | `bg-accent hover:bg-accent-hover` |
| `bg-red-50`, `hover:bg-red-50` | `bg-surface-sunken` |
| `bg-red-400/600`, `hover:bg-red-500` | `bg-danger`, `hover:bg-danger/90` |
| `border-stone-200`, `/80`, `border-zinc-100`, `divide-stone-*`, `border-[var(--theme-border)]` | `border-line` |
| `border-stone-300` and any border of an input, select, chip or toggle | `border-line-strong` |
| `border-emerald-*`, `hover:border-emerald-*` | `border-accent-text`, `hover:border-accent-text` |
| `border-amber-*` | `border-line` (`border-gold` only on an ornament frame) |
| `border-red-*` | `border-danger-text` |
| `focus:ring-*` / `focus-visible:ring-*` palette (+ `ring-2`, `ring-offset-*`) | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text` |
| `focus:border-emerald-*` (inputs) | `focus-visible:border-accent-text` |
| `ring-stone-400`, `ring-emerald-500/50` (non-focus) | `ring-line-strong`, `ring-accent-text/50` |
| any `dark:` color class | deleted |

Disabled controls: `text-ink-muted` plus the existing disabled mechanism; no new opacity rules. A class the map does not cover (e.g. `text-sky-600` outside the tajwid files): the subagent stops and reports it; the main model decides and adds a row here.

**Plan change (2026-11-19, during Task 2):** the page background stays on `--background` (body, `AppShell` as `bg-background`, the sticky letter-table header) until Task 4. Axe showed why: on the darker `paper`, not-yet-migrated `text-stone-500` drops to 4.4:1 and the old sepia link color fails too. Task 4 makes `--background`/`--foreground` aliases of `paper`/`ink`, which switches the page background with no class change.

### Task 3 (PR 2.3): reader and learn mode

**Files:** migrate `src/components/reader/**`, `src/components/quran/**` (not the classes read from `tajwidStyles.ts`), `src/components/learn/**`, `src/components/test/**`, `src/app/surah/**`, `src/app/juz/**`, `src/app/learn/**`; extend `PALETTE_GUARDED_FILES`; `tests/e2e/a11y.spec.ts` (the learn-mode pill entries go: `text-stone-400` becomes `text-ink-muted`).

**Interfaces:** consumes the rule and map from Task 2.

- [ ] **Step 1:** Add the globs; `npm run lint` lists offenders.
- [ ] **Step 2:** Subagent (Sonnet, medium) migrates with the map. Playing ayah: `bg-highlight`. Tajwid rule classes stay as they are (they come from `tajwidStyles.ts`).
- [ ] **Step 3:** Main-model diff review (as Task 2 Step 5).
- [ ] **Step 4:** Screenshots: `/surah/1` (top, a playing ayah, word-by-word view), `/surah/2?ayah=5` (search highlight), `/juz/30`, `/learn/1` at 375/1280, three themes; keyboard pass through the reader toolbar and learn controls.
- [ ] **Step 5:** Gates; drop the stale learn-pill allowlist entries. Commit `feat: Tezhib tokens in the reader and learn mode`.

### Task 4 (PR 2.4): all other screens, retire old variables

**Files:** migrate everything left under `src/app/**` and `src/components/**`; `eslint.config.mjs` (`PALETTE_GUARDED_FILES` becomes `["src/**/*.{ts,tsx}"]` with `ignores: ["src/lib/quran/tajwidStyles.ts", "src/data/tajwid-lessons/**", "**/__tests__/**"]`); `src/app/globals.css`; `tests/e2e/a11y.spec.ts`; `src/app/__tests__/themeTokens.test.ts` (add case).

- [ ] **Step 1: Test first.** `themeTokens.test.ts` case 4: `globals.css` declares no `--theme-` variable and the sepia block no `--color-stone-500`; it still declares `--color-amber-600` in sepia (Phase 3 removes it; the test says so); `--background` is `var(--paper)` and `--foreground` is `var(--ink)` in `@theme`/`:root`. Fails now.
- [ ] **Step 2:** Widen the guard; subagent (Sonnet, medium) migrates the rest with the map; main-model review.
- [ ] **Step 3:** Delete the `--theme-*` declarations, the `--color-stone-500` override and its comment; keep the amber override with a comment "Phase 3 removes this with the tajwid colors"; `--background`/`--foreground` alias `paper`/`ink`. Test case 4 passes; `npm run lint` clean for all of `src`.
- [ ] **Step 4:** Screenshots for every route in the axe spec's route list, 375/1280, three themes; keyboard pass on home, bookmarks, progress, search, tajwid quiz.
- [ ] **Step 5:** Gates; the axe allowlist has no "Phase 2: tokens" entry left (remove the `PHASE_2` constant if unused). Commit `feat: Tezhib tokens on all screens; retire the old theme variables`.

**Plan change (2026-11-19, during Task 4):** the rule chips on lesson cards (tajwid label colors, Phase 3) failed contrast on `surface-sunken`; the chip is now `bg-surface ring-1 ring-inset ring-line`, and sepia gets a second temporary override, `--color-amber-700: #A34300` (5.6:1 on the sepia surface), which Phase 3 removes with the amber-600 one. The palette guard's variant matching also had to learn arbitrary variants (`[&_mark]:`, `has-[:checked]:`).

### Task 5 (PR 2.5 prep): measure today's fonts

- [ ] **Step 1:** On a build of the PR 2.4 branch, Playwright (scratchpad `fontbytes.mjs`, same static server) records every response with `resource type === "font"` on `/` and `/surah/1` (theme light, default settings, after `document.fonts.ready` and a scroll to the end): file, transfer size. Save as the "before" table for the PR text.

### Task 6 (PR 2.5): typefaces

**Files:**
- Create: `scripts/subset-fonts.py` (replaces `scripts/subset-transliteration-font.py`, deleted), `src/app/fonts/ElifBook-Regular.woff2`, `ElifBook-Bold.woff2` (`ElifBook-Italic.woff2` only if Step 1 finds an italic use), `ElifSans.woff2` (variable, wght 400-700), `src/app/fonts/OFL-Gentium.txt`, `OFL-SourceSans.txt`, `src/app/fonts/font-coverage.json`
- Delete: `TranscriptionBook-*.woff2`, `transcription-font-coverage.json`, `OFL.txt` (replaced)
- Modify: `src/app/layout.tsx`, `src/app/globals.css`, components that render transcription, translation and `h1`, `src/components/settings/SettingsPanel.tsx`, `CLAUDE.md` gotcha line about the transcription font (propose to the owner in the PR text; edit only with the OK)
- Test: `src/app/__tests__/fonts.test.ts` (replaces `transliterationFont.test.ts`)

**Interfaces:**
- Produces: CSS variables `--font-elif-sans`, `--font-elif-book` (from `next/font/local`), theme entries `--font-sans: var(--font-elif-sans), system-ui, sans-serif`, `--font-read: var(--font-elif-book), Georgia, serif`, `--font-ar: var(--font-arabic)`; utility `font-read`. `--font-transliteration` is removed (its users get `font-read`).
- Produces: `font-coverage.json` shape `{ "files": { "<file>": { "sha256": string, "codepoints": number[] } } }` (same shape as Phase 1).

- [ ] **Step 0 (owner-approved downloads):** into a new empty scratchpad directory, from `https://github.com/google/fonts/tree/main/ofl/gentiumbookplus`: `GentiumBookPlus-Regular.ttf`, `GentiumBookPlus-Bold.ttf` (and `-Italic.ttf` if needed) and `OFL.txt`; from `ofl/sourcesans3`: `SourceSans3[wght].ttf` and `OFL.txt`. Record each file's size and sha256 in the PR text.
- [ ] **Step 1:** `grep` for `italic` on transcription/translation elements after removing `italic` from the transcription; decide Italic in or out.
- [ ] **Step 2: Test first** (`fonts.test.ts`): (a) every code point of `transliteration`, `translation` (Korkut) and surah `nameLatin`/`nameBosnian` in `src/data/**` is in `ElifBook-Regular` and `ElifBook-Bold`; (b) every Latin code point in string literals and JSX text of `src/**/*.tsx` (outside tests) is in `ElifSans`; (c) sha256 in the coverage file matches each woff2; (d) no file or CSS name in `src/app/fonts` or `layout.tsx` contains "Gentium" or "Source Sans"; (e) `layout.tsx` registers `--font-elif-sans` and `--font-elif-book` via `next/font/local` and no longer imports `Geist`; `Noto_Naskh_Arabic` weights are exactly `["400", "600"]`. Keep Phase 1's U+0331 assertion.
- [ ] **Step 3:** `scripts/subset-fonts.py <ttf-dir> src/app/fonts`: Phase 1's collector (same ranges, same `-I` and user-site handling); for Source Sans, `fontTools.varLib.instancer` limits `wght` to 400:700 before subsetting; families renamed to "Elif Book" and "Elif Sans" in the `name` table (IDs 1, 4, 6, 16), copyright kept; both OFL texts copied. Docstring: regeneration steps and the licence note.
- [ ] **Step 4:** `layout.tsx`: remove Geist; `localFont` for both families (`display: "swap"`; Elif Sans preloaded, Elif Book not preloaded); Noto Naskh Arabic weights `400`, `600`. `globals.css`: theme font entries, `body` font `var(--font-sans)`. Arabic `font-medium` (500) / `font-bold` (700) on Arabic text become `font-normal` / `font-semibold`.
- [ ] **Step 5:** Apply roles (no layout change): transcription `font-read not-italic text-[1.125rem] md:text-[1.1875rem] leading-[1.55] text-ink-muted`; translation `font-read` (sizes as today unless smaller than 17 px, then `text-[1.0625rem] md:text-lg leading-[1.6]`); every page `h1` `font-read font-bold`. Settings "Pismo": labels `"Moderno pismo"` (naskh) and `"Klasično pismo"` (uthmanic).
- [ ] **Step 6:** Tests pass. Measure "after" (Task 5 script). After must be <= before in total bytes on both routes; if not, drop the Italic, then preload of Elif Book, and re-measure; report both tables.
- [ ] **Step 7:** Real Chromium check: `/surah/1` and `/harfovi` with DevTools-like check via Playwright `document.fonts` that "Elif Sans" and "Elif Book" are `loaded` and used (computed `font-family` of a Bosnian label and a transcription line); screenshots 375/1280 three themes; keyboard pass.
- [ ] **Step 8:** Gates. Commit `feat: Elif Book and Elif Sans font subsets; upright, larger transcription`.

### Task 7 (PR 2.6): name and mark

**Files:**
- Create: `public/icons/elif-mark.svg` (the design system asset, sha256 `efcfbdac...fe7fe8`, 64x64 viewBox), `src/app/icon.svg` (same mark), `public/og.png` (1200x630)
- Modify: `scripts/generate-icons.ts` (draws from the SVG instead of the qaf), `public/icons/*.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`, `src/lib/site.ts`, `public/manifest.webmanifest`, `src/app/layout.tsx` (metadata, viewport), `public/sw.js` (header comment only), `src/app/__tests__/metadata.test.ts`
- Test: `src/app/__tests__/manifest.test.ts`

**Interfaces:** `SITE_NAME = "Elif"`; `SITE_TAGLINE = "Kur'an na bosanskom, harf po harf."` in `src/lib/site.ts` (copy deck first-visit line), used by the OG image.

- [ ] **Step 1: Tests first.** `manifest.test.ts`: `name` and `short_name` are `"Elif"`; `start_url` `"/"`, `display` `"standalone"`, no `orientation`; `theme_color` `#1F3A5F`, `background_color` `#F7F4ED`; icons 192, 512 (`any`) and maskable 512 exist on disk with those pixel sizes (read the PNG IHDR). `metadata.test.ts`: title default `"Elif"`, template `"%s | Elif"`, `openGraph.images[0]` is `/og.png` 1200x630, `twitter.card` `summary_large_image`; `viewport.themeColor` `#1F3A5F`. A test that `public/sw.js` cache names did not change (compare to the literal names on `main`).
- [ ] **Step 2:** Implement: `SITE_NAME`, manifest, metadata, viewport. `generate-icons.ts`: loads `public/icons/elif-mark.svg` into Chromium, renders 192 and 512 (rounded square as drawn), maskable 512 (background `#1F3A5F` full bleed, mark artwork scaled to 80% and centred), `src/app/apple-icon.png` 180 (full bleed), `favicon.ico` (32 px PNG inside a one-entry ICO container written by the script), and `public/og.png`: `paper` background, the mark at 240 px, "Elif" in Elif Book Bold 120 px, the tagline in Elif Sans 40 px `ink-muted`, fonts loaded from `src/app/fonts` via `@font-face` with file URLs.
- [ ] **Step 3:** Run the script; view each PNG; tests pass.
- [ ] **Step 4:** Footer reads "© 2026 Elif" via `SITE_NAME` (already wired; confirm). Header wordmark, install prompt and About use `SITE_NAME` (already wired; confirm rendering).
- [ ] **Step 5:** Screenshots (header, footer, About, install prompt) 375/1280 three themes; link preview checked by reading the built `out/index.html` meta tags.
- [ ] **Step 6:** Gates. Commit `feat: the app is called Elif; icons and link preview from the mark`. Tell the owner the two friends must re-add the app on iOS; Android updates on a later launch.

### Task 8 (PR 2.7): voice

**Files:** components with user-facing text found in Step 1; `src/app/about/page.tsx`; create `docs/glas.md`; modify `src/components/__tests__/copyRules.test.ts`.

- [ ] **Step 1:** Read the copy deck ("Po ekranima" tab) and list every approved "ti" text that differs from the code, with file and line, in the PR text.
- [ ] **Step 2: Test first.** `copyRules.test.ts`: new cases (a) no "Vi" address: `word("Vi|Vas|Vam|Vama|Vaš\\p{L}*", "u")` (case-sensitive, capitalised forms) and plural imperatives from a list built in Step 1 (e.g. `Pokušajte|Odaberite|Kliknite|Dodajte|Osvježite`, exact list from the code); (b) no "Quran Learning" anywhere in scanned files (comments included). Run: (a) fails if Step 1 found offenders, (b) fails until `public/sw.js` comment is fixed in Task 7 (it is outside `src`, so (b) also scans `public/sw.js` and `public/manifest.webmanifest`).
- [ ] **Step 3:** Rewrite the texts from the deck; About intro from the deck; numbers through `src/lib/format.ts`.
- [ ] **Step 4:** `docs/glas.md` in Bosnian: voice rules (from the design system README "Glas"), the glossary (deck), the forbidden list, examples; plain ASCII punctuation in markdown syntax.
- [ ] **Step 5:** Screenshots of every changed screen, 375/1280, three themes; keyboard pass on changed controls.
- [ ] **Step 6:** Gates. Commit `feat: the "ti" voice; voice guide in docs/glas.md`.

### Task 9: final verification and report

- [ ] On the 2.7 branch: all gates; axe run; a whole-branch review (one fresh reviewer on the main model) of `main..claude/phase-2-7-voice`; fix findings in the PR they belong to.
- [ ] Short Bosnian summary for the owner: what changed per PR, before/after font bytes, what Phase 3 picks up (`--tj-*` tokens ready, amber override and `dark:` variant to remove, tajwid legend), anything not verified.
