# Phase 3 tajwid (PR 3.1 and 3.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tajwid colors as in the Dar al-Maarifa mushaf from the `--tj-*` tokens only (3.1), then the rule
name on tap and the "boje i linije" option (3.2).

**Architecture:** `src/lib/quran/tajwidStyles.ts` stays the single map from rule to classes and text. 3.1
swaps the classes to `text-tj-*`, retires the `.dark` class and the guard exemptions, and turns the legend
into the keyboard path to the lessons. 3.2 adds a `data-tj-rule` attribute on colored spans, one
delegated click per ayah paragraph, a non-persisted bar store with one `TajwidRuleBar` in `AppShell`, and
line styles switched by a `data-tajwid-lines` attribute on `<html>` (no prop drilling through the readers).

**Tech Stack:** Next.js 16 static export, React 19, Tailwind 4, zustand 5 persist, Vitest + Testing
Library, Playwright (axe, browser checks).

**Spec:** `docs/superpowers/specs/2026-11-23-phase-3-tajwid-design.md` (approved 2026-11-23, option A).
PR 3.3 (lessons) gets its own plan after the review is confirmed.

## Global Constraints

- No new dependencies. Baseline Widely available; no Popover API.
- Storage keys `quran-learning-settings` and `quran-learning-progress`, lesson slugs and ids do not change.
- Code, comments, commits, PR text in English; UI text in Bosnian per `docs/glas.md` (ti voice).
  Docs: plain ASCII punctuation.
- Never type Quranic text or transcription by hand.
- Gates per PR: `npm run typecheck`, `npm run lint`, `npm test`, `npx next build`, `npm run test:a11y`
  (7-12 min, never in parallel with screenshots). Screenshots at 375 px and desktop in light, sepia, dark;
  keyboard pass.
- Git: work on `claude/phase-3-1-tajwid-colors` cut from `main` (a2db558). Commit, push and PR only when
  the owner says so; stage files by name. 3.2 is cut from `main` after 3.1 is merged.

## Review Focus

1. Settings stored before Phase 3 (no `tajwidNoticeSeen`, no `showTajwidLines`): load unchanged, lines
   off, notice shows once. Test in Task 4 and Task 7.
2. First visit, empty storage: zustand calls `merge(undefined, current)`; no throw, no notice. Task 4.
3. Collapsed legend: its links are not reachable by Tab. Task 3.
4. Word by word: a tap on a colored letter seeks and opens the bar (A); Enter or Space on a word seeks
   and never opens the bar. Task 9.
5. Colors off: no `data-tj-rule`, so taps open nothing and the lines attribute is absent. Tasks 8 and 9.

---

## PR 3.1 Colors and legend

### Task 1: Tokens and theme

**Files:**
- Modify: `src/app/globals.css` (line 7 `@custom-variant dark`; `--tj-ihfa` at the light/dark/sepia blocks;
  sepia `--color-amber-600/700` overrides and their comments at ~109-116)
- Modify: `src/app/themeInitScript.ts`, `src/components/layout/ThemeProvider.tsx` (drop the `dark` class;
  `data-theme` stays)
- Test: `src/app/__tests__/themeTokens.test.ts`, `src/app/__tests__/themeInitScript.test.ts`,
  `src/components/layout/__tests__/theme.test.tsx`

- [ ] **Step 1: Change the tests**
  - `EXPECTED["tj-ihfa"]` becomes `["#2E7D32", "#2B6E2F", "#81C784"]`.
  - tj pairs: each of `tj-medd`, `tj-gunne`, `tj-ihfa`, `tj-kalkala` against `paper`, `surface`,
    `surface-sunken`, `highlight`, `mark` at `NON_TEXT`, and against `paper`, `surface` at `AA_TEXT`.
  - New test `"%s: ihfa has the same color as gunne"`: `vars["tj-ihfa"] === vars["tj-gunne"]` per theme.
  - In "has retired the old palette": `sepia["color-amber-600"]` and `sepia["color-amber-700"]` are
    `undefined`; `CSS` does not match `/@custom-variant\s+dark/`.
  - New test: no file under `src/` (excluding `__tests__`) matches `/\bdark:/` in a `.ts`/`.tsx` file.
  - themeInitScript and ThemeProvider tests: replace the "adds class dark" cases with "never adds the
    dark class" for all three themes; keep the `data-theme` assertions.
- [ ] **Step 2: Run** `npx vitest run src/app/__tests__ src/components/layout/__tests__/theme.test.tsx`;
  expect FAIL on ihfa values, amber overrides, custom-variant, dark class, and the `dark:` scan (hits in
  `tajwidStyles.ts` and the lessons, fixed in Task 2).
- [ ] **Step 3: Implement** the CSS and the two theme files.
- [ ] **Step 4: Run** the same command; all pass except the `dark:` scan (Task 2).

### Task 2: Rule classes, lesson data, one color source

**Files:**
- Modify: `src/lib/quran/tajwidStyles.ts`, `src/lib/quran/index.ts:10`
- Modify: `src/components/tajwid/TajwidLessonCard.tsx` (use `tajwidRuleClasses`)
- Modify: `src/data/tajwid-lessons/index.ts` (drop `color`/`colorHex` from the interface and the 5 lessons;
  the 5 color sentences)
- Modify: `src/app/tajwid/[lessonId]/__tests__/page.test.tsx`, `src/app/tajwid/__tests__/page.test.tsx`
  (fixtures lose the two fields)
- Modify: `eslint.config.mjs` (`PALETTE_UNGUARDED_FILES` keeps only `"**/__tests__/**"`; update the comment)
- Modify: comments that name old colors in `WordByWordRenderer.tsx`, `TajwidLegend.test.tsx:77`
- Test: `src/lib/quran/__tests__/tajwidStyles.test.ts`, create `src/lib/quran/__tests__/tajwidColorSource.test.ts`

**Interfaces:**
- Produces: `tajwidRuleClasses: Record<TajwidRule, string>` = normal `"text-foreground"`, mad `"text-tj-medd"`,
  ghunnah `"text-tj-gunne"`, ikhfa `"text-tj-ihfa"`, qalqalah `"text-tj-kalkala"`.
- Produces: `tajwidRuleLessonSlugs: Record<Exclude<TajwidRule, "normal">, string>` = mad `"mad-duljenje"`,
  ghunnah `"ghunnah-nazalni-zvuk"`, ikhfa `"ikhfa-skriveni-zvuk"`, qalqalah `"qalqalah-odskok"`.
- Removed: `tajwidRuleLabelClasses` (and its re-export).

- [ ] **Step 1: Tests**
  - tajwidStyles.test: the class values above; `tajwidRuleLabelClasses` block deleted; new block: for
    every lesson in `tajwidLessons` with `ruleType !== "normal"`, `tajwidRuleLessonSlugs[ruleType] === slug`,
    and every slug in the map exists in `tajwidLessons`.
  - tajwidColorSource.test: read `--tj-*` hex values from `globals.css`, drop any hex that a non-tj token
    also uses (`#A3241B` is `--danger`); walk `src/**/*.{ts,tsx,css}` except `__tests__`, `globals.css`,
    `tajwidStyles.ts`; fail on any of those hex values (case-insensitive) or `/\btj-(medd|gunne|ihfa|kalkala)\b/`.
    Expect it to flag `AyahCard.tsx` (comment, fixed in Task 5).
- [ ] **Step 2: Run** `npx vitest run src/lib/quran src/app/tajwid`; expect FAIL.
- [ ] **Step 3: Implement.** The five lesson sentences, exact text:
  - l.214 `"U aplikaciji: crvena boja ti pokazuje tačno gdje se primjenjuje pravilo mad."`
  - l.290 ends `"Crvena boja u aplikaciji označava mjesta gdje se primjenjuje mad."`
  - l.393 ends `"Zelena boja u aplikaciji označava ghunnah."`
  - l.488 ends `"U aplikaciji je ikhfa obojena istom zelenom bojom kao ghunnah."`
  - l.605 ends `"Plava boja u aplikaciji označava qalqalah."`
  Lesson 1 quiz (l.158-161) stays: the color options are distractors and the answer is still right.
  Other lesson wording waits for PR 3.3.
- [ ] **Step 4: Run** `npx vitest run src/lib/quran src/app` and `npm run lint`; pass, except the source
  scan on `AyahCard.tsx` until Task 5.

### Task 3: Legend with three rows and lesson links

**Files:**
- Modify: `src/components/quran/TajwidLegend.tsx`
- Test: `src/components/quran/__tests__/TajwidLegend.test.tsx`

**Interfaces:**
- Consumes: `tajwidRuleClasses`, `tajwidRuleLessonSlugs` (Task 2).

- [ ] **Step 1: Tests** (replace the 5-rule tests)
  - Opened: list items read exactly `"Crveno: produži (medd)"`, `"Zeleno: kroz nos (gunne, ihfa)"`,
    `"Plavo: odskok (kalkala)"`; no item "Bez pravila".
  - Links `medd`, `gunne`, `ihfa`, `kalkala` have `href` `/tajwid/<slug>` from `tajwidRuleLessonSlugs`.
  - Each row's dot has the row's class: `text-tj-medd`, `text-tj-gunne`, `text-tj-kalkala`.
  - Collapsed: the panel has the `inert` attribute and `aria-hidden="true"`; `userEvent.tab()` from the
    toggle does not land on a link. Opened: Tab order toggle -> medd -> gunne -> ihfa -> kalkala.
  - Intro line `"Boje pokazuju četiri pravila izgovora. Ostala pravila nisu obojena."` stays.
- [ ] **Step 2: Run** `npx vitest run src/components/quran/__tests__/TajwidLegend.test.tsx`; FAIL.
- [ ] **Step 3: Implement.** Rows as data `{ color, verb, rules: TajwidRule[], dot: TajwidRule }`; link text
  is the lowercase rule name (`tajwidRuleNames[rule].toLowerCase()`), `next/link`, `text-accent-text underline`.
  `inert={!open}` (React 19 takes a boolean).
- [ ] **Step 4: Run** the test; PASS.

### Task 4: One-time notice and safe merge

**Files:**
- Modify: `src/types/settings.ts` (`tajwidNoticeSeen: boolean`), `src/store/settingsStore.ts` (default `true`,
  `partialize`, `markTajwidNoticeSeen(): void`, `merge`)
- Modify: `src/components/quran/TajwidLegend.tsx` (effect)
- Test: `src/store/__tests__/settingsStoreMigration.test.ts`, `TajwidLegend.test.tsx`

**Interfaces:**
- Produces: `useSettingsStore` field `tajwidNoticeSeen: boolean`, action `markTajwidNoticeSeen()`.

- [ ] **Step 1: Tests**
  - Migration: stored state without `tajwidNoticeSeen` -> `false`; stored with `true` -> `true`;
    `merge(undefined, current)` returns `current` unchanged (call the store's `persist.getOptions().merge`).
  - Legend: with `tajwidNoticeSeen: false`, mounting calls `showToast("Boje su sada kao u tedžvidskom mushafu.")`
    once and the flag becomes `true`; with `true`, no toast; a second legend mount shows nothing.
- [ ] **Step 2: Run** `npx vitest run src/store src/components/quran`; FAIL.
- [ ] **Step 3: Implement.** `merge`: return `currentState` when `persistedState` is not an object;
  otherwise as today plus `tajwidNoticeSeen`: the stored value when it is a boolean, else `false`.
  Legend `useEffect` on `[tajwidNoticeSeen]`.
- [ ] **Step 4: Run**; PASS.

### Task 5: Playing ayah highlight, docs, gates, checks

**Files:**
- Modify: `src/components/reader/AyahCard.tsx:178-183` (`bg-highlight/20` -> `bg-highlight`; comment says the
  tj tokens keep 4.13:1 or more on the full highlight, without naming tokens by class)
- Modify: `docs/TAJWID.md` (setting name "Tedžvid boje", three colors and what they mean, ihfa shares the
  gunne green, legend links; ASCII punctuation in changed lines)
- Test: existing AyahCard tests; source scan from Task 2.

- [ ] **Step 1:** Update any AyahCard test that asserts `bg-highlight/20`; implement; run `npx vitest run src/components/reader`.
- [ ] **Step 2: Gates** `npm run typecheck`, `npm run lint`, `npm test`, `npx next build`; all green.
- [ ] **Step 3: Browser check** (built app, Playwright Chromium): `/surah/2` reader, learn mode, `/tajwid`
  list and a lesson; 375 px and 1280 px; light, sepia, dark; legend open; playing ayah. Before shots from
  `main`. Keyboard: Tab through the legend to the four links.
- [ ] **Step 4:** `npm run test:a11y` alone; green, no new exceptions (remove any that turn stale).
- [ ] **Step 5:** Report to the owner; on their go-ahead commit by name (spec, plan, code), push, open PR 3.1.

---

## PR 3.2 Rule name on tap, and lines (cut from main after 3.1 is merged)

### Task 6: Line classes and the lines attribute

**Files:**
- Modify: `src/lib/quran/tajwidStyles.ts`, `src/components/layout/ThemeProvider.tsx`, `src/app/themeInitScript.ts`
- Test: `tajwidStyles.test.ts`, `theme.test.tsx`, `themeInitScript.test.ts`

**Interfaces:**
- Produces: `tajwidRuleLineClasses: Record<TajwidRule, string>`: normal `""`; the others underline only
  under an ancestor `[data-tajwid-lines]` (Tailwind arbitrary variant `[[data-tajwid-lines]_&]:...`), styles
  mad solid, ghunnah dotted, ikhfa dashed, qalqalah double (wavy failed the browser check); thickness and offset set in Task 8.
- Produces: `<html data-tajwid-lines>` present iff `showTajwidColors && showTajwidLines`.

- [ ] Tests: each line class contains its `decoration-<style>` and the ancestor variant; ThemeProvider and the
  init script set and remove the attribute for the four combinations. Run, FAIL, implement, PASS.

### Task 7: Stored shape and the three-way setting

**Files:**
- Modify: `src/types/settings.ts` (`showTajwidLines: boolean`), `src/store/settingsStore.ts` (default `false`,
  `partialize`, `setTajwidDisplay(mode: "off" | "colors" | "lines")`)
- Modify: `src/components/settings/SettingsPanel.tsx` (~195-200: the "Tedžvid boje" switch becomes a radio group
  "Tedžvid" with "Isključeno" / "Boje" / "Boje i linije", built like the theme radios at ~405-430)
- Test: `settingsStoreMigration.test.ts`, `settingsStore.test.ts`, `SettingsPanel.test.tsx`

- [ ] Tests: old stored state loads with `showTajwidLines: false` and its `showTajwidColors` kept;
  `setTajwidDisplay("off")` keeps `showTajwidLines`, `"colors"` -> colors on, lines off, `"lines"` -> both on;
  the radio checked is "Isključeno" when colors are off, else "Boje i linije" when lines are on, else "Boje";
  the reader chip still toggles colors only. Run, FAIL, implement, PASS.

### Task 8: Rule attribute and lines in the renderers

**Files:**
- Modify: `src/components/quran/TajwidTextRenderer.tsx`, `src/components/quran/WordByWordRenderer.tsx`,
  `src/components/quran/TajwidLegend.tsx` (swatch shows the line style when lines are on)
- Test: `TajwidTextRenderer.test.tsx`, `WordByWordRenderer.test.tsx`

- [ ] Tests: with `showColors`, each non-normal span has `data-tj-rule="<rule>"` and both the color and line
  class; with `showColors` false, no `data-tj-rule` and no line class. Run, FAIL, implement, PASS.
- [ ] Browser check: lines under kasra and under the dots of ba and ya (e.g. Al-Fatiha, Al-Baqarah 2:2-5)
  in Chromium, Firefox and WebKit, three themes; tune thickness and `underline-offset`, record values in a
  comment.

### Task 9: The bar and the tap

**Files:**
- Create: `src/store/tajwidRuleBarStore.ts`, `src/components/quran/TajwidRuleBar.tsx`, `src/lib/quran/tajwidRuleTap.ts`
- Modify: `src/lib/quran/tajwidStyles.ts` (`tajwidRuleSentences`), `src/components/layout/AppShell.tsx`
  (mount once), `TajwidTextRenderer.tsx`, `WordByWordRenderer.tsx` (container `onClick`),
  `TajwidLegend.tsx` (add line `"Dodirni obojeni harf za naziv pravila."` above the rows)
- Test: new tests next to each file; `WordByWordRenderer.test.tsx`, `LearnWordByWord.test.tsx`

**Interfaces:**
- Produces: `useTajwidRuleBarStore: { rule: Exclude<TajwidRule, "normal"> | null; open(rule): void; close(): void }`.
- Produces: `ruleFromTarget(target: EventTarget | null): Exclude<TajwidRule, "normal"> | null` (reads
  `closest("[data-tj-rule]")`, rejects unknown values and `normal`).
- Produces: `tajwidRuleSentences` text after the bold name, exact:
  mad `"ovdje se glas uči duže od običnog dugog vokala."`, ghunnah `"nun ili mim se ovdje uči kroz nos."`,
  ikhfa `"nun bez vokala, tenvin ili mim se ovdje prikriva i uči kroz nos."`,
  qalqalah `"harf bez vokala ovdje odskoči, da se jasno čuje."`

- [ ] Tests:
  - Tap on a colored span in TajwidTextRenderer opens the bar with that rule; tap on plain text does not.
  - Word by word (A): click on a colored letter calls `onWordClick` with the word index AND opens the bar;
    Enter and Space on a word call `onWordClick` and leave `rule` null; arrows unchanged.
  - Bar: the `role="status"` element is always in the DOM; open shows the bold name, the sentence, a
    "Lekcija" link to `/tajwid/<slug>` and a "Zatvori" button; focus stays where it was; closes on
    "Zatvori", on Escape, on a pathname change; the next tap replaces the rule.
  - Position: no audio -> above the mobile nav (`max-md:bottom-16`), with audio -> above the player too;
    z-index above the player (`z-40`) and below the toast (`z-50`).
  Run, FAIL, implement, PASS.
- [ ] Gates as Task 5 Step 2-4, plus: bar and lines at 375 px and desktop in three themes; keyboard pass
  reaches the four rule names through the legend; tap check in learn mode word by word. Report; commit and
  PR 3.2 only on the owner's go-ahead.
