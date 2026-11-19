# Phase 1: Decision-Free UX Fixes -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship every UX/UI fix that does not depend on the open decisions (app name, "ti"/"Vi", visual direction, tajwid colors and terms): correct Bosnian numbers, plurals and relative times; the WCAG 2.2 fixes that keep today's look; neutral, glossary-consistent copy; a one-line title template; two layout bugs; and, with the owner's OK, a transliteration font that covers every letter.

**Architecture:** One formatting module on `Intl` (`src/lib/format.ts`) replaces two hand-written time helpers and three inline plural rules. Accessibility fixes stay inside the existing components; one small `ModalDialog` wraps the native `<dialog>` for the two div dialogs. Copy changes are literal string edits; the app name comes only from `SITE_NAME`. No new runtime dependencies.

**Tech Stack:** Next.js 16.4 (static export), React 19.2, Tailwind CSS 4.2, zustand 5, Vitest 4 + Testing Library (jsdom 28), Playwright Chromium for the browser check.

**Spec:** the Phase 1 brief of 2026-11-19 (parent session) and the owner's reports it names: UX copy deck https://claude.ai/artifact/9vgq2G5mfMz3WHqYKFAfjo, WCAG 2.2 report https://claude.ai/artifact/4a58PVfFfaCH5CoohXiKN3, screen critique https://claude.ai/artifact/YSU5nUQPBABk5MtyTa7BGH, research synthesis https://claude.ai/artifact/Xf1ZHecEmrwK47m4t5LArA. Context only (Phase 2, not implemented): handoff https://claude.ai/artifact/Ee9PwZ7cMxGmAr8U7fQZQJ, design system https://claude.ai/artifact/XWMMukrCWzkCGrHguhenCs.

## Global Constraints

- Do not change in this branch: the name "Quran Learning" and its icons; tajwid colors; the theme label "Sepia"; "Selam!" and "Mašallah!" only where Task 13 puts them; "Sva prava zadržana"; the contact channel (GitHub Issues); lesson texts in `src/data/tajwid-lessons`; colors, tokens and typography (except Task 11); the reader layout; `src/app/_test`.
- Address: no "Vi" and no new "ti" sentence. The 19 "Vi" strings become neutral (impersonal "Treba + infinitive", passive "Traži se ...", or a plain statement). Imperative singular on buttons and links is allowed ("Sačuvaj", "Preuzmi", "Počni od Fatihe", "Preskoči na sadržaj"). Existing "ti" sentences stay "ti"; the deck's edits to them are applied as written.
- No gendered forms. Errors say what happened, then what to do. Confirmations reuse the button's verb with the ayah number ("12. ajet je sačuvan."). A toggle is named by its state ("Ponavljanje: sura") or has a fixed name plus `aria-pressed` -- never both. Placeholders without "...". No arrows or "+" in link or button text. No emoji.
- Glossary: platforma -> aplikacija; označeni/označi/oznaka/bookmark -> sačuvani/sačuvaj/ukloni iz sačuvanih; offline/spremljeno/sačuvane sure (downloads) -> preuzeto/preuzete sure/bez interneta; označavanje riječi/ajeta (audio sync) -> praćenje riječi/istaknut ajet; recitator -> učač; recitacija/audio (content) -> učenje/snimak; player -> zvuk/kontrole zvuka; režim/način/fokusirano učenje -> Učenje, entry button "Uči ajet po ajet"; font/Naskh/Scheherazade -> slova/osnovno pismo/klasično pismo; klik/tapni -> dodirni; Lista sura/Pregled sura -> Sve sure; Nepočete -> Nezapočete; Zadnji pristup -> Nedavno otvorene; "kur'anske" lowercase mid-sentence; "s" not "sa" except before s, z, š, ž.
- Keep the storage keys `quran-learning-settings` and `quran-learning-progress` and the theme value `sepia`. Never hand-edit the generated `transliteration` field.
- Browser target: Baseline Widely available. `:has()` qualifies (Baseline since 2023-12-19). `<dialog closedby>` does not (no Safari): keep the pointer fallback that `SettingsPanel.tsx` already uses.
- No new dependencies, except `@axe-core/playwright` as a devDependency (approved 2026-11-19, Task 14). Task 11 downloads font files and installs fonttools (approved).
- Code, comments and commits in English; UI copy in Bosnian; quotes in JSX text as `&bdquo;...&ldquo;`. Files UTF-8 without BOM. In tests, build Arabic characters with `String.fromCodePoint` (escapes typed through the tools land as literal characters).
- Gates for every task: `npm run typecheck`, `npm run lint`, `npm test` (full suite). Task 12 adds `npm run build` and the browser check. Dependency changes only with `npx npm@11`.
- Pushing or merging needs the owner's request. (The baseline reader test was postponed on 2026-11-19, so no deployment waits on it.)

## Plan Change: Owner Decisions of 2026-11-19

Relayed by the parent session after the plan was approved, quoting the owner: "9 - Nazivi pravila: medd, gunne, ihfa i kalkala", "10 - Transkripcija", "14 - Da za sve" ("Selam!" greeting a new user, "Mašallah!" when a lesson is passed and a surah finished, counting listened ayahs, ornament next to the Quranic text), "4 - za sada samo git" (contact unchanged), "6 - besplatna je, barem trenutno" ("besplatna" stays), "3 - © 2026 Elif" (footer changes with the rename in Phase 2, not now). User research is postponed.

- "transliteracija" becomes "transkripcija" in all user-visible text; identifiers, the generated `transliteration` field, settings keys and scripts keep their names.
- Tajwid rule names in the UI become Medd, Gunne, Ihfa, Kalkala; the `TajwidRule` values, lesson slugs and URLs, lesson texts in `src/data/tajwid-lessons` and the colors stay.
- "Selam!" and "Mašallah!" go only into the three places Task 13 lists; the rest of each sentence stays neutral ("ti"/"Vi" is still open).
- Tasks 1-7 had already run with the old terms, so Task 13 (after Task 8, before Task 9) applies these three changes everywhere at once, with a guard test. Task 8 and later write "transkripcija" directly.

Second batch, relayed the same way (owner, quoted): "3. Opisi sura: ... - ukloni" and "4. Alat za automatsku provjeru pristupačnosti (`@axe-core/playwright`, besplatna razvojna zavisnost): da ili ne? - da". So:

- The four surah notes in `FeaturedSurahsSection.tsx` (`NOTES`) are removed with their rendering (Task 10).
- `@axe-core/playwright` is approved as a devDependency; Task 14 adds it and an axe regression test over the key routes in light, dark and sepia, with every accepted exception listed and justified. CI (`.github/workflows/ci.yml`) does not run `test:e2e`; changing CI needs the owner's explicit OK, so Task 14 does not touch it.
- For information only (Phases 2 and 3, not this branch): the owner confirmed the name "Elif", "ti" address, the Tezhib direction, and approved the tajwid color and lesson proposals. This branch keeps "Quran Learning", the current colors and the lesson texts.

## Decisions This Plan Makes (the owner can veto any)

| # | Decision | Alternative | Why |
|---|---|---|---|
| D1 | `Intl` locale list `["bs", "hr"]` | `"bs"` only | If a browser lacks Bosnian data, Croatian gives the same plural categories and number format (tested), so server HTML and hydration still agree; only "tjedna" instead of "sedmice" could differ in relative time. Without it the fallback is English. |
| D2 | Relative time: under 60 s "sada"; then minutes, hours, days (1 "jučer", 2 "prekjučer"), weeks under 30 days, months under 365 days, then years; future timestamps read as "sada"; missing/invalid gives "" (label hidden) | calendar-day logic of `relativeTime.ts` | One rule set, the forms from the brief, no "prije NaN". |
| D3 | "N od M ajeta" keeps "ajeta" (genitive after "od": od 21 ajeta, od 31 ajeta); the deck row "ProgressContent 149: 31 ajet" becomes "3 od 31 ajeta" | "3/31 ajet" | "31 ajet" is right for a bare count, wrong after "od". |
| D4 | After a bookmark is removed, focus goes to the page heading (`h1`, `tabIndex={-1}`), in the list and in the empty state | next item's button | The trigger is gone with the item; the heading always exists. |
| D5 | Closing the iOS install steps (Razumijem, Esc, backdrop) closes only the steps; the banner stays until its own X | today: both close and the 30-day dismissal is stored | The brief asks for focus to return to the trigger, which is in the banner. |
| D6 | Repeat is one cycling button whose name carries the state ("Ponavljanje: sura"), without `aria-pressed` | a three-option group | The deck pattern; fits the 70 px player bar; `aria-pressed` cannot express three states. |
| D7 | `scroll-padding` on `html`: top 7.5rem (fixed header 3rem + sticky reader/search bar), bottom sized to the bottom bars plus the back-to-top button, via media query and `:root:has([data-audio-player])` | per-page JS measurement | Pure CSS; over-padding at the top is harmless. Values confirmed in the browser in Task 12. |
| D8 | Per-ayah names add the surah in the juz reader ("Pusti 1. ajet sure En-Nebe'"), number only elsewhere | number only | Juz 30 shows many "1. ajet" cards. |
| D9 | Hero `h1` "Aplikacija za učenje Kur'ana" (glossary only), not the deck's "Uči Kur'an od elifa do hatme" | deck | The slogan belongs with the name decision and is a new "ti" sentence. |
| D10 | Cheap good-practice items from the WCAG report are in: header stays visible while it holds focus, skip link, reduced-motion scrolling, toast 5 s, install banner as `aside`, manifest orientation unlocked, surah list rows wrap instead of truncating, juz link out of `role="separator"`, distinct names for dua and name play buttons | defer | Each is a few lines and changes no look. |
| D11 | The NASTAVI badge moves under the surah name, normal case, `text-xs` | keep 10 px uppercase | The deck ("Nastavi, ispod naziva sure"); 10 px lowercase is too small. |

## Deferred to Phase 2 or a Follow-up

- Tajwid shown by color only (WCAG 1.4.1, high): the rule popover needs the tajwid terms, the colors and the reader redesign.
- Contrast fixes (1.4.3 notes on about/contact/sources in dark, "Uredi" link, learn-mode disabled text; 1.4.11 bookmark icon amber-500): colors belong to the token work.
- Search: links inside `role="option"` (best practice): the report also praises the combobox; restructuring the search interaction needs a decision.
- "Prati ajet koji se uči" setting and the warning before auto-advancing to the next surah: new settings and behavior, reader redesign.
- Surah `h1` with both names (best practice): the reader header is redesigned in Phase 2.
- Copy that waits for Phase 2: every [naziv] (the name "Elif" comes with the rename), "Hartija", the hero slogan, footer rights line ("© 2026 Elif" comes with the rename), the contact channel (stays GitHub).
- Running the e2e/axe tests in CI (needs the owner's OK to change `.github/workflows/ci.yml`).
- Uppercase labels and transliteration size/italic (typography).
- Testing with real screen readers (NVDA, TalkBack, VoiceOver) and Safari on iPhone (install step wording): not possible from this machine.

## Review Focus

1. A browser without Bosnian `Intl` data: text stays Bosnian-like and server HTML equals hydration. Pinned by Task 1 "Croatian fallback" test.
2. Zero and large counts ("0 ajeta", "1.234 ajeta", "Preuzeto: 0 od 114 sura"). Pinned by Task 1 and Task 2 tests.
3. Timestamps from the future (device clock) or corrupted in localStorage: "sada" and no label, never "prije NaN". Pinned by Task 1 tests.
4. Removing the last bookmark from the dialog: dialog closed, empty state shown, focus on its heading. Pinned by Task 4 test.
5. Status messages: the live region exists empty before the message, so the message is announced; the same component never mounts region and text together. Pinned by Task 6 tests.

## File Map

- Create: `src/lib/format.ts`, `src/lib/scrollBehavior.ts`, `src/components/ui/ModalDialog.tsx`, tests listed per task; Task 11 only: `src/app/fonts/` (subset fonts, OFL.txt, coverage JSON), `scripts/subset-transliteration-font.py`.
- Delete: `src/lib/timeSince.ts`, `src/lib/utils/relativeTime.ts` (callers move to `formatTimeAgo`).
- Modify: about 45 components, pages, `globals.css`, `layout.tsx`, `public/manifest.webmanifest`, and the tests that assert the old copy.

---

### Task 1: Intl formatting helpers

**Files:**
- Create: `src/lib/format.ts`, `src/lib/__tests__/format.test.ts`
- Modify: `src/lib/spokenDuration.ts` (use `formatCount`; output unchanged), `src/app/search/page.tsx:22-27` (`resultCountLabel` on the helper)
- Must stay green unchanged: `src/lib/__tests__/spokenDuration.test.ts`, `src/app/search/__tests__/page.test.tsx`

**Interfaces -- Produces:**
```ts
export const LOCALES: readonly string[];            // ["bs", "hr"]
export type PluralForms = Readonly<{ one: string; few: string; other: string }>;
export const AYAH_FORMS: PluralForms;               // ajet / ajeta / ajeta
export const SURAH_FORMS: PluralForms;              // sura / sure / sura
export function pluralForm(n: number, forms: PluralForms): string;  // category outside one/few -> other
export function formatNumber(n: number): string;    // Intl.NumberFormat(LOCALES)
export function formatCount(n: number, forms: PluralForms): string; // `${formatNumber(n)} ${pluralForm(n, forms)}`
export function formatTimeAgo(isoTimestamp: string, now?: number): string; // now defaults to Date.now()
```

- [ ] **Step 1: Write the failing tests** in `src/lib/__tests__/format.test.ts`

```ts
describe("formatNumber", () => {
  it("groups thousands with a dot and uses a decimal comma", () => {
    expect(formatNumber(6236)).toBe("6.236");
    expect(formatNumber(0.75)).toBe("0,75");
    expect(formatNumber(1.25)).toBe("1,25");
    expect(formatNumber(114)).toBe("114");
  });
});

describe("formatCount", () => {
  it.each([[0, "0 ajeta"], [1, "1 ajet"], [2, "2 ajeta"], [5, "5 ajeta"], [11, "11 ajeta"],
    [21, "21 ajet"], [22, "22 ajeta"], [31, "31 ajet"], [111, "111 ajeta"], [1234, "1.234 ajeta"]])(
    "%i ayahs -> %s", (n, expected) => expect(formatCount(n, AYAH_FORMS)).toBe(expected));
  it.each([[1, "1 sura"], [2, "2 sure"], [5, "5 sura"], [21, "21 sura"], [114, "114 sura"]])(
    "%i surahs -> %s", (n, expected) => expect(formatCount(n, SURAH_FORMS)).toBe(expected));
});

describe("Croatian fallback (D1)", () => {
  it("has the same plural categories and number format as Bosnian", () => {
    const bs = new Intl.PluralRules("bs");
    const hr = new Intl.PluralRules("hr");
    for (let n = 0; n <= 1000; n++) expect(hr.select(n)).toBe(bs.select(n));
    expect(new Intl.NumberFormat("hr").format(6236.75)).toBe(new Intl.NumberFormat("bs").format(6236.75));
  });
});

describe("formatTimeAgo", () => {
  const now = Date.parse("2026-11-19T12:00:00Z");
  const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const ago = (ms: number) => new Date(now - ms).toISOString();
  it.each([
    [0, "sada"], [59_000, "sada"], [MIN, "prije 1 minutu"], [2 * MIN, "prije 2 minute"],
    [5 * MIN, "prije 5 minuta"], [HOUR, "prije 1 sat"], [2 * HOUR, "prije 2 sata"],
    [5 * HOUR, "prije 5 sati"], [DAY, "jučer"], [2 * DAY, "prekjučer"], [3 * DAY, "prije 3 dana"],
    [7 * DAY, "prošle sedmice"], [14 * DAY, "prije 2 sedmice"], [30 * DAY, "prošli mjesec"],
    [60 * DAY, "prije 2 mjeseca"], [365 * DAY, "prošle godine"], [730 * DAY, "prije 2 godine"],
  ])("%i ms ago -> %s", (ms, expected) => expect(formatTimeAgo(ago(ms), now)).toBe(expected));
  it("reads a timestamp in the future as now", () => expect(formatTimeAgo(ago(-5 * MIN), now)).toBe("sada"));
  it("returns an empty string for a missing or invalid timestamp", () => {
    expect(formatTimeAgo("", now)).toBe("");
    expect(formatTimeAgo("not a date", now)).toBe("");
  });
});
```

- [ ] **Step 2: Run, expect FAIL** -- `npx vitest run src/lib/__tests__/format.test.ts` (module not found).
- [ ] **Step 3: Implement `src/lib/format.ts`.** Create the three `Intl` objects once at module level with `LOCALES` (`RelativeTimeFormat` with `{ numeric: "auto" }`). `formatTimeAgo` thresholds per D2: seconds < 60 -> `format(0, "second")`; minutes < 60; hours < 24; days < 7; days < 30 -> `floor(days / 7)` weeks; days < 365 -> `floor(days / 30)` months; else `floor(days / 365)` years, each as a negative value.
- [ ] **Step 4: Move the existing plurals onto the helper.** `spokenDuration.ts`: replace `form()` with `formatCount` and four `PluralForms` (minute nominative minuta/minute/minuta, genitive minute/minute/minuta; second nominative sekunda/sekunde/sekundi, genitive sekunde/sekunde/sekundi). `search/page.tsx`: `formatCount(total, { one: "rezultat", few: "rezultata", other: "rezultata" })`, and "Prikazano {formatNumber(shown)} od {formatNumber(total)} rezultata".
- [ ] **Step 5: Run, expect PASS** -- the new file plus `spokenDuration.test.ts` and `search/__tests__/page.test.tsx` unchanged; then the gates.
- [ ] **Step 6: Commit** `feat: Intl helpers for Bosnian numbers, plurals and relative time`

### Task 2: Counts, numbers and times on screen

**Files:**
- Modify: `src/components/home/ContinueLearningSection.tsx` (all its copy), `src/components/bookmarks/BookmarksContent.tsx:179` (time only), `src/components/home/FeaturedSurahsSection.tsx:115-119`, `src/components/reader/SurahHeader.tsx:70-82`, `src/components/surahs/SurahListItem.tsx:37`, `src/components/progress/ProgressContent.tsx:58-92,149`, `src/app/juz/[juzId]/page.tsx:62`, `src/components/settings/SettingsPanel.tsx` (pause options, speed, offline counts)
- Delete: `src/lib/timeSince.ts`, `src/lib/utils/relativeTime.ts`
- Test: the existing `__tests__` of each component, plus `src/app/juz/[juzId]/__tests__/page.test.tsx` (new)

**Interfaces -- Consumes:** Task 1 `formatCount`, `formatNumber`, `pluralForm`, `formatTimeAgo`, `AYAH_FORMS`, `SURAH_FORMS`.

| Where | Now | New |
|---|---|---|
| ContinueLearningSection 69, 110 | Dobrodošli! Počnite sa kratkim surama. | Dobar početak su kratke sure ispod. |
| ContinueLearningSection 91 | {name} · Ajet {n} | {name}, {n}. ajet |
| ContinueLearningSection 94-95 | Način: Čitanje · prije 3 sata | Čitanje, prije 3 sata (Učenje, ...) |
| ContinueLearningSection 102 | Učenje | Uči ajet po ajet |
| ContinueLearningSection 120-124 | 5 sura posjećeno · 12 ajeta preslušano · 25 min ukupno slušanje | Otvorene sure: 5 · Preslušani ajeti: 12 · Slušanje: {formatListeningTime} |
| ContinueLearningSection and ProgressContent tiles | Sure započeto / Ajeta preslušano / Ukupno slušanje / Napredak | Započete sure / Preslušani ajeti / Vrijeme slušanja / Od cijelog Kur'ana |
| both, 4th tile value | 30/6236 ajeta (home), 30/6236 (progress) | 30 od 6.236 ajeta (values through `formatNumber`) |
| FeaturedSurahsSection 117-118 | 43% završeno · 31 ajeta / 31 ajeta | 43% preslušano · 31 ajet / 31 ajet |
| SurahHeader 71 | 31 ajeta · Meka | 31 ajet · Meka |
| SurahHeader 79-81 | 3/7 ajeta preslušano (+ aria-label) | Preslušano: 3 od 7 ajeta (visible text only, drop the `aria-label` on the div) |
| SurahListItem 37 | ... · 21 ajeta | ... · 21 ajet |
| ProgressContent 149 | 3/31 ajeta · 10% | 3 od 31 ajeta · 10% (D3) |
| juz page 62 | 148 ajeta · 2 sura | 148 ajeta · 2 sure |
| SettingsPanel 16-18 | 3 sek / 5 sek / 10 sek | 3 sekunde / 5 sekundi / 10 sekundi (sekunda/sekunde/sekundi) |
| SettingsPanel 235-238 | 0.75x (text and aria-label) | 0,75× (text and aria-label, `${formatNumber(s)}×`) |
| SettingsPanel 496 | Bez interneta je dostupno 12 od 114 sura. | Preuzeto: 12 od 114 sura. |
| SettingsPanel 539 | Preuzimanje 37/114… | Preuzimanje: 37 od 114 sura |
| SettingsPanel 590-594 | Preuzimanje nije potpuno. / Sure koje nisu spremljene (3): 2, 5, 7. | Preuzimanje nije završeno. / Nedostaje 1 sura: 5. -- Nedostaju 3 sure: 2, 5, 7. -- Nedostaje 5 sura: ... (verb Nedostaje/Nedostaju/Nedostaje by `pluralForm`) |
| SettingsPanel 597 | Datoteke aplikacije koje nisu spremljene: 2 (potrebne su za prikaz sura). | Nedostaje 1 dio aplikacije potreban za prikaz sura. / Nedostaju 2 dijela aplikacije potrebna ... / Nedostaje 5 dijelova aplikacije potrebnih ... |
| BookmarksContent 179, ContinueLearningSection 54 | timeSince / getRelativeTimeBosnian | formatTimeAgo |

- [ ] **Step 1: Write the failing tests** (update the existing component tests to the new copy, add new cases):
  - `ContinueLearningSection.test.tsx`: welcome "Dobar početak su kratke sure ispod."; with a position 3 h old (fake timers) "El-Mulk, 12. ajet" and "Čitanje, prije 3 sata"; button "Uči ajet po ajet"; stats row texts "Otvorene sure: 5", "Preslušani ajeti: 12"; tiles "Započete sure" ... and "30 od 6.236 ajeta".
  - `SurahHeader` (in `reader/__tests__`): surah 76 -> "31 ajet · Medina"; 3 listened -> "Preslušano: 3 od 31 ajeta".
  - `FeaturedSurahsSection.test.tsx`: surah 76 in progress -> "43% preslušano · 31 ajet"; surah 112 -> "4 ajeta".
  - `SurahListItem.test.tsx`: surah 92 -> "21 ajet".
  - `progress/__tests__/page.test.tsx`: tile "30 od 6.236 ajeta"; row "3 od 31 ajeta · 10%".
  - `juz/[juzId]/__tests__/page.test.tsx` (new): juz 1 renders "148 ajeta · 2 sure" (check 148 against `getAyahsForJuz(1)` in the test, not by hand).
  - `SettingsPanel.test.tsx`: buttons named "0,75×", "1,25×"; "3 sekunde", "5 sekundi", "10 sekundi"; "Preuzeto: 12 od 114 sura."; failures [5] -> "Nedostaje 1 sura: 5."; [2, 5, 7] -> "Nedostaju 3 sure: 2, 5, 7."; 2 assets -> "Nedostaju 2 dijela aplikacije potrebna za prikaz sura."
  - `bookmarks/__tests__/page.test.tsx`: createdAt 2 min ago -> "prije 2 minute".
- [ ] **Step 2: Run, expect FAIL** -- `npx vitest run src/components src/app` (old copy).
- [ ] **Step 3: Implement** the table above; delete the two old helpers once no import remains (`grep -rn "timeSince\|relativeTime" src` is empty).
- [ ] **Step 4: Run, expect PASS**; gates; `hydration.test.tsx` must stay green (SurahHeader, SurahListItem, ProgressContent, ContinueLearningSection).
- [ ] **Step 5: Commit** `fix: Bosnian plurals, numbers and relative time on screen (copy deck 1-2)`

### Task 3: Focus never hidden, visible in forced colors; skip link; reduced motion

**Files:**
- Modify: `src/app/globals.css` (scroll padding), `src/components/audio/AudioPlayer.tsx:366-371` (`data-audio-player` on the root), `src/components/layout/Header.tsx` (stays shown while focused), `src/components/layout/AppShell.tsx` (skip link, `main` id), every file with `outline-none` (19 uses in 10 files: search page, BackToTop, LearnModeContent, ReaderToolbar, SurahAyahNav, SettingsPanel, JuzListCard, SearchInput, SurahListItem, Button), the four smooth scrolls (`SurahReaderContent.tsx:53`, `SurahReaderUrlEffects.tsx:72`, `SurahAyahNav.tsx:51`, `BackToTop.tsx:44-46`)
- Create: `src/lib/scrollBehavior.ts`, `src/lib/__tests__/scrollBehavior.test.ts`, `src/components/__tests__/focusVisible.test.ts`, `src/components/layout/__tests__/headerFocus.test.tsx`, `src/components/layout/__tests__/skipLink.test.tsx`

**Interfaces -- Produces:** `preferredScrollBehavior(): ScrollBehavior` -- `"auto"` when `(prefers-reduced-motion: reduce)` matches, else `"smooth"`.

- [ ] **Step 1: Write the failing tests**
  - `focusVisible.test.ts` (source scan like `focusRings.test.ts`): no `.tsx` outside `__tests__` contains `outline-none` (Tailwind 4 `outline-none` is `outline-style: none`; `outline-hidden` keeps a transparent outline that forced-colors mode shows). Second case: `globals.css` sets `scroll-padding-top` and `scroll-padding-bottom` on `html` and has a `:root:has([data-audio-player])` rule.
  - `headerFocus.test.tsx`: mock `useStickyHeader` to `{ isHidden: true }`; the banner has `data-hidden="true"`; focus the "Pretraga" link -> `data-hidden="false"`; move focus to a button outside the header -> `"true"` again.
  - `skipLink.test.tsx`: in `AppShell`, the first focusable element is a link "Preskoči na sadržaj" with `href="#main-content"`; `main` has `id="main-content"` and `tabIndex` -1.
  - `scrollBehavior.test.ts`: `matchMedia` reporting reduce -> `"auto"`; otherwise `"smooth"`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
  - `globals.css`: `html { scroll-padding-top: 7.5rem; scroll-padding-bottom: 6rem; }`; `@media (width < 48rem) { html { scroll-padding-bottom: 10rem; } }`; `:root:has([data-audio-player]) { scroll-padding-bottom: 10rem; }` and under `width < 48rem` `12.5rem`. Comment the arithmetic: bars (nav 3.5rem, player 70px) and the back-to-top button (bottom 2rem/6rem/8.5rem + 3rem) + 1rem air. The `:root:has()` rule inside the media query comes after the one outside it (same specificity).
  - `Header.tsx`: `const [hasFocus, setHasFocus] = useState(false)`; `onFocus` sets true; `onBlur` sets false when `relatedTarget` is outside the header; `const hidden = isHidden && !hasFocus` drives both `data-hidden` and the translate class (so `--app-header-offset` follows).
  - `AppShell.tsx`: first child of the scroll container: `<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-[var(--theme-card)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--theme-text)] focus:shadow-lg focus:ring-2 focus:ring-emerald-600">Preskoči na sadržaj</a>`; `<main id="main-content" tabIndex={-1} className="... focus:outline-hidden">`.
  - Replace every `outline-none` with `outline-hidden` (the existing rings stay).
  - Use `preferredScrollBehavior()` in the four `scrollIntoView`/`scrollTo` calls.
- [ ] **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: focus never hidden by the bars, visible in forced colors; skip link; reduced motion (WCAG 2.4.11, 2.4.7)`

### Task 4: Native dialogs for bookmark removal and the iOS install steps

**Files:**
- Create: `src/components/ui/ModalDialog.tsx` (export from `src/components/ui/index.ts`), `src/components/ui/__tests__/ModalDialog.test.tsx`
- Modify: `src/components/bookmarks/BookmarksContent.tsx` (dialog, remove button, heading focus), `src/components/pwa/InstallPrompt.tsx` (banner as `aside`, steps dialog, all its copy), `src/app/globals.css` (generic modal scroll containment)
- Test: `src/app/bookmarks/__tests__/page.test.tsx`, `src/components/pwa/__tests__/InstallPrompt.test.tsx`

**Interfaces -- Produces:**
```ts
type ModalDialogProps = {
  open: boolean;
  onClose: () => void;      // called on the native "close" event (Esc, backdrop, close())
  labelledBy: string;       // id of the dialog's heading
  className?: string;
  children: React.ReactNode;
};
export function ModalDialog(props: ModalDialogProps): React.JSX.Element;
```
Behavior: renders `<dialog aria-labelledby closedby="any">` (no `role`, no `aria-modal`); an effect calls `showModal()` when `open` turns true and `close()` when false; the pointer-down/up light-dismiss fallback for browsers without `closedBy` (same logic as `SettingsPanel.tsx:31-35,78-85`). Initial focus: the browser focuses the first focusable control, so the safe action comes first in DOM order. No code returns focus: the browser does.

| Where | Now | New |
|---|---|---|
| BookmarksContent 240 (trash `aria-label`) | Ukloni oznaku | Ukloni iz sačuvanih: {surah}, {n}. ajet |
| BookmarksContent 267 | Ukloniti bookmark? | Ukloniti {n}. ajet sure {surah} iz sačuvanih? |
| BookmarksContent 270 | Ajet {surah} {n} će biti uklonjen iz označenih. | Bilješka uz ovaj ajet briše se s njim. (only when the bookmark has a note) |
| BookmarksContent buttons | Odustani / Ukloni | unchanged; Odustani first |
| InstallPrompt 146, 149 | Instaliraj Quran Learning / Brži pristup, radi offline | Instaliraj aplikaciju / Otvara se s početnog ekrana; preuzete sure rade i bez interneta. |
| InstallPrompt 187 | Instaliraj na iOS | Dodaj na iPhone |
| InstallPrompt 195-199 | Tapni dugme za dijeljenje 📤 na dnu Safari-ja | Dodirni ikonu za dijeljenje {lucide `Share` icon, aria-hidden} u Safariju. |
| InstallPrompt 207-208 | Pomakni dolje i odaberi "Add to Home Screen" | Izaberi &bdquo;Dodaj na početni zaslon&ldquo; (engleski: &bdquo;Add to Home Screen&ldquo;). |
| InstallPrompt 216 | Tapni "Add" u gornjem desnom uglu | Dodirni &bdquo;Dodaj&ldquo; gore desno. |

- [ ] **Step 1: Write the failing tests**
  - `ModalDialog.test.tsx`: `open=false` -> no `open` attribute; rerender `open=true` -> `showModal` called once (spy) and `open` set; rerender `false` -> closed; native `close` event -> `onClose` called; no `role` or `aria-modal` attribute; `aria-labelledby` set.
  - bookmarks page: the trash button is named "Ukloni iz sačuvanih: El-Mulk, 12. ajet"; clicking it opens a dialog (`getByRole("dialog")`) named "Ukloniti 12. ajet sure El-Mulk iz sačuvanih?"; no note -> no body text; with a note -> "Bilješka uz ovaj ajet briše se s njim."; "Odustani" closes and keeps the bookmark; "Ukloni" removes it, closes the dialog and focuses the `h1` "Sačuvani ajeti"; removing the only bookmark focuses the empty-state `h1`.
  - `InstallPrompt.test.tsx`: the banner is a `complementary` landmark named "Instaliraj aplikaciju" (not `dialog`); iOS UA: "Instaliraj" opens a dialog named "Dodaj na iPhone" with the three steps and an `svg`, and no character in U+1F300-U+1FAFF; "Razumijem" closes the dialog, the banner stays; the banner's "Zatvori" stores the dismissal and hides it.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** `globals.css`: `dialog:modal { overscroll-behavior: contain; }` and `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }` (the settings dialog already has its own). Dialog boxes keep today's card classes (`rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-800`) plus `backdrop:bg-black/40`, centered by the UA. In `BookmarksContent`, a ref flag set on confirm and an effect after render focus the `h1` (`tabIndex={-1}`, one ref shared by both headings).
- [ ] **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: native dialogs for bookmark removal and iOS install steps (WCAG 2.4.3, 2.1.1)`

### Task 5: Names, labels and language of parts

**Files (all copy in these files moves here, glossary applied):**
- Modify: `src/components/reader/AyahCard.tsx`, `src/components/reader/ReaderToolbar.tsx`, `src/components/reader/SurahAyahNav.tsx`, `src/components/reader/SurahReaderContent.tsx`, `src/components/learn/LearnModeContent.tsx`, `src/components/audio/AudioPlayer.tsx`, `src/components/names/NameCard.tsx`, `src/components/duas/DuaCard.tsx`, `src/app/tajwid/[lessonId]/page.tsx:106-110` (lang only), `src/components/surahs/SurahListItem.tsx:33,36` (wrap), `public/manifest.webmanifest:10`
- Test: the existing tests of these components (`reader/__tests__/*`, `learn/__tests__/*`, `audio/__tests__/*`, `NameCard.test.tsx`, `DuaCard.test.tsx`, `hydration.test.tsx`), plus `src/app/__tests__/manifest.test.ts` (new)

AyahCard ({n} = ayah number; {label} = "{n}. ajet", in the juz reader "{n}. ajet sure {surah}" per D8):
- `article` gets `aria-labelledby` = the number badge, which loses `aria-hidden` and reads "{n}<span class="sr-only">. ajet</span>".
- bookmark button: "Sačuvaj {label}" / "Ukloni {label} iz sačuvanih" (`aria-label` and `title`), no `aria-pressed`.
- play button: "Pusti {label}" / "Pauziraj {label}".
- toast: "{n}. ajet je sačuvan." / "{n}. ajet je uklonjen iz sačuvanih."; "Sada se pušta" -> "Sluša se".

ReaderToolbar: "Smanji font"/"Povećaj font" -> "Manja slova"/"Veća slova"; value "28px" with `aria-label` on a span -> visible "28" with sr-only prefix "Veličina slova: "; group "Stil arapskog fonta" -> "Arapsko pismo", buttons "Naskh"/"Scheherazade" -> "Osnovno"/"Klasično"; group "Način sinhronizacije" -> "Praćenje uz zvuk"; chips "Tr"/"Bs"/icon -> visible words "Transliteracija", "Prijevod", "Tedžvid boje" with `aria-pressed` and no `aria-label`; settings "Više" + `aria-label` "Sve postavke" -> visible "Postavke", no `aria-label` (button and link variants).

SurahAyahNav: span `aria-label="Označen"` -> dot `aria-hidden` plus sr-only ", sačuvan" inside the link.

SurahReaderContent: juz divider loses `role="separator"` and its `aria-label`; the two lines get `aria-hidden`; "Podaci za ovu suru će uskoro biti dostupni." -> "Sura se nije učitala. Treba osvježiti stranicu."; "Sinhronizacija s audioom" -> "Praćenje uz zvuk"; "Podaci za označavanje riječi se nisu učitali. Provjerite vezu i pokušajte ponovo." -> "Praćenje riječi se nije učitalo. Treba provjeriti internet i pokušati ponovo."

LearnModeContent: toasts as AyahCard; "Zatvori režim učenja" -> "Zatvori učenje"; "Prethodna: X"/"Sljedeća: X" with arrows -> "Prethodna sura: X"/"Sljedeća sura: X" without arrows; empty state as SurahReaderContent; word error as SurahReaderContent; "Završili ste ovu suru." -> "Sura je završena."; bookmark "Dodaj u označene"/"Ukloni iz označenih" -> "Sačuvaj ajet"/"Ukloni iz sačuvanih"; play "Pusti audio"/"Pauza" -> "Pusti ajet"/"Pauziraj"; toggles: name = visible text, `aria-pressed`, no `aria-label` ("Riječ po riječ", "Transliteracija", "Prijevod"); repeat (D6): visible and name "Ponavljanje: isključeno" / "Ponavljanje: sura" / "Ponavljanje: ajet", no `aria-pressed`, styled active when not off. `OptionToggle` gets an optional `pressed?: boolean` instead of `ariaLabel`/`ariaPressed`.

AudioPlayer: region "Audio player" -> "Kontrole zvuka"; label "Sura 36 · Ajet 12" -> "Jā-sīn, 12. ajet" (fallback "Sura 36, 12. ajet"); "Pauza" -> "Pauziraj"; repeat icon button `aria-label` "Ponavljanje: isključeno|sura|ajet" (D6, no `aria-pressed`); autoplay `aria-label` "Pusti sljedeću suru" + `aria-pressed`; slider "Trajanje" -> "Mjesto u ajetu"; "Više opcija playera" -> "Više opcija zvuka"; "Dodatne kontrole playera" -> "Dodatne kontrole zvuka"; in the menu: "Ponavljanje" + state word in normal case ("isključeno", "sura", "ajet"; no uppercase classes) named "Ponavljanje: sura"; "Automatski sljedeća sura" + UKLJ./ISKLJ. -> "Pusti sljedeću suru" + `aria-hidden` "uključeno"/"isključeno", `aria-pressed`, no `aria-label`.

NameCard: Arabic `p` gets `lang="ar"`; button visible "Pusti"/"Pauziraj" (was "Pauza"), `aria-label` "Pusti: {transliteration}" / "Pauziraj: {transliteration}".

DuaCard: "Slušaj dovu" -> "Slušaj dovu, {citationLabel}" (e.g. "Slušaj dovu, Kur'an 2:201").

Tajwid lesson examples: `lang="ar"` next to `dir="rtl"`. SurahListItem: remove `truncate` from both lines (text-spacing 1.4.12). Manifest: remove `"orientation"` (1.3.4).

- [ ] **Step 1: Write the failing tests** -- queries by role and name for each line above, e.g. `getByRole("article", { name: "12. ajet" })`, `getByRole("button", { name: "Pusti 12. ajet" })`, in the juz reader `getByRole("button", { name: "Pusti 1. ajet sure En-Nebe'" })`, `getByRole("button", { name: "Postavke" })`, `getByRole("button", { name: "Prijevod", pressed: true })`, `getByRole("button", { name: "Ponavljanje: sura" })` without `aria-pressed`, `getByRole("region", { name: "Kontrole zvuka" })`, `getByRole("slider", { name: "Mjesto u ajetu" })`, NameCard Arabic has `lang="ar"`, 18 dua buttons with 18 distinct names, no link inside an element with `role="separator"`, manifest JSON has no `orientation`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** the lists above.
- [ ] **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: names that match the visible text and say which ayah; Arabic marked as Arabic (WCAG 2.5.3, 1.3.1, 3.1.2)`

### Task 6: Status messages that screen readers announce

**Files:**
- Modify: `src/components/ui/Toast.tsx`, `src/components/ui/OfflineIndicator.tsx`, `src/components/tajwid/TajwidQuiz.tsx` (all its copy)
- Test: `src/components/ui/__tests__/Toast.test.tsx`, `src/components/ui/__tests__/OfflineIndicator.test.tsx` (new), `src/components/tajwid/__tests__/TajwidQuiz.test.tsx`

Rules: the live region element is always rendered (empty when there is nothing to say) and only its text changes; nothing mounts a region together with its text.

| Where | Now | New |
|---|---|---|
| Toast | mounted with the message, 2 s | `role="status"` always rendered, visible styles only with a message, 5 s (`TOAST_DURATION_MS = 5000`) |
| OfflineIndicator | mounted when offline; "Offline — čitate sačuvane sure" | `role="status"` always rendered; pill only when offline: "Nema interneta: dostupne su preuzete sure." |
| TajwidQuiz answer | no announcement; chosen option `disabled` (focus lost) | sr-only `role="status"` outside the swapped content: "Tačno." / "Nije tačno. Tačan odgovor je {letter}: {option}."; options `aria-disabled` while feedback shows (handler already ignores clicks) |
| TajwidQuiz finish | focus lost with the "Završi kviz" button | focus moves to `h2` "Kviz završen" (`tabIndex={-1}`); the status region is cleared |
| TajwidQuiz 87 | Odlično! Savladao/la si ovu lekciju. | Sve je tačno. Lekcija je savladana. |
| TajwidQuiz 89 | Dobro! Možeš ponoviti lekciju za još bolji rezultat. | Lekcija je savladana. Kviz možeš ponoviti kad god hoćeš. |
| TajwidQuiz 90 | Za završetak lekcije treba bar 4 od 5 tačnih odgovora. Ponovi lekciju i pokušaj ponovo. | Za završetak lekcije treba najmanje 4 tačna odgovora od 5. Pročitaj lekciju još jednom pa ponovi kviz. ("4 tačna odgovora" by `formatCount` with tačan odgovor/tačna odgovora/tačnih odgovora; `correctAnswersOf` is removed) |
| TajwidQuiz 106 | Sljedeća lekcija: X → | Sljedeća lekcija: X |

- [ ] **Step 1: Write the failing tests** -- Toast: with no message a `status` element exists and is empty; after `showToast` the same element (same node reference) holds the text; cleared after 5000 ms, not after 2000. OfflineIndicator: online -> empty `status`; dispatch `offline` -> same node holds "Nema interneta: dostupne su preuzete sure.". TajwidQuiz: before answering the `status` is empty; a wrong answer -> "Nije tačno. Tačan odgovor je B: ..." and the chosen option still has focus and `aria-disabled="true"`; finishing focuses heading "Kviz završen"; 5/5 -> "Sve je tačno. Lekcija je savladana."; failing -> "Za završetak lekcije treba najmanje 4 tačna odgovora od 5. ..."; no "/la" anywhere.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: status messages announced by screen readers; quiz keeps focus (WCAG 4.1.3)`

### Task 7: Copy -- home, navigation, static pages, error pages

**Files:** `src/app/page.tsx`, `src/components/home/DailyDuaSection.tsx`, `src/components/home/FeaturedSurahsSection.tsx:70`, `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`, `src/components/reader/SurahReaderStickyHeader.tsx`, `src/components/layout/Footer.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/sources/page.tsx`, `src/app/harfovi/page.tsx`, `src/app/duas/page.tsx`, `src/app/duas/[category]/page.tsx`, `src/app/names/page.tsx`, `src/app/tajwid/page.tsx`, `src/app/tajwid/[lessonId]/page.tsx` (labels, arrows), `src/app/juz/[juzId]/page.tsx:69`, `src/app/not-found.tsx`, `src/app/error.tsx`, the four route `error.tsx` files. Tests: the existing page tests of these routes.

| Where | Now | New |
|---|---|---|
| page.tsx 30 | Platforma za učenje Kur'ana | Aplikacija za učenje Kur'ana (D9) |
| page.tsx 33 | Uči Kur'an uz tedžvid pomagala, transliteraciju, prijevod i audio. | Arapski tekst, transliteracija po pravilima Rijaseta IZ BiH, Korkutov prijevod i učač Mishary Alafasy, ajet po ajet. |
| page.tsx 37, 40 | Počni učiti / Pregled sura | Počni od Fatihe / Sve sure |
| page.tsx 61 | Šta nudi platforma | Šta je u aplikaciji |
| page.tsx 70, 73 | Tedžvid boje / Obojeni segmenti za pravila izgovora (mad, ghunnah, ikhfa, qalqalah). | Tedžvid u boji / Četiri pravila izgovora obojena su u tekstu: mad, ghunnah, ikhfa i qalqalah. |
| page.tsx 86 | Latinični zapis arapskog teksta za lakše učenje izgovora. | Izgovor svakog ajeta latinicom, po pravilima Rijaseta IZ BiH. |
| page.tsx 96, 99 | Bosanski prijevod / Prijevod značenja (Besim Korkut) uz svaki ajet. | Prijevod Besima Korkuta / Prijevod značenja uz svaki ajet. |
| page.tsx 109, 112 | Audio s označavanjem ajeta / Slušaj recitaciju uz istovremeno označavanje trenutnog ajeta. | Slušanje ajet po ajet / Dok učač uči, istaknut je ajet koji se čuje. |
| DailyDuaSection 34, 51 | Jedna Kur'anska dova svaki dan. / Sve Kur'anske dove → | Svaki dan jedna dova iz Kur'ana. / Sve dove iz Kur'ana |
| FeaturedSurahsSection 70 | Nedavno započete + preporučene kratke sure. | Započete sure i kratke sure za početak. |
| Header 56, StickyHeader 58 | Nazad na listu sura | Nazad na sve sure |
| Header 80 | Pauza / Pusti | Pauziraj / Pusti |
| Header 113, MobileNav 137 | Označeni ajeti | Sačuvani ajeti |
| Header 150 | Učenje – Tedžvid, Allahova lijepa imena | Učenje: tedžvid, harfovi i Allahova imena |
| Footer 4 | Platforma za učenje Kur'ana s transliteracijom, prijevodom i audio recitacijom. | Kur'an na bosanskom: arapski tekst, transliteracija, Korkutov prijevod i učač Mishary Alafasy. |
| Footer 30, 48 | Footer navigacija / O platformi | Podnožje / O aplikaciji |
| about 14 | O platformi | O aplikaciji |
| about 23-26 | Quran Learning je besplatna platforma ... | {SITE_NAME} je besplatna aplikacija za učenje Kur'ana na bosanskom jeziku. Uz svaki ajet su arapski tekst, transliteracija po pravilima Rijaseta Islamske zajednice u Bosni i Hercegovini, prijevod značenja Besima Korkuta i učenje Mishary Alafasyja. Tu su i lekcije tedžvida, Allahova lijepa imena i dove iz Kur'ana. |
| about 35-40 | six list items | Čitanje sure ajet po ajet, s transliteracijom i prijevodom / Slušanje svakog ajeta, uz ponavljanje / Lekcije tedžvida s kvizom / Sačuvani ajeti s bilješkama / Pretraga po riječi, nazivu sure ili broju ajeta / Čitanje bez interneta, kad se sure preuzmu |
| about 49-50 | Koristimo pouzdane ... Detalje možete pogledati na stranici Izvori. | Tekst, transliteracija i snimci dolaze iz otvorenih izvora, navedenih na stranici Izvori. |
| about 62-64 | Ova platforma je izrađena u dobronamjernoj namjeri ... ni sa jednom ... institucijom. | Aplikacija je napravljena da olakša učenje Kur'ana. Nije zvanično povezana ni s jednom vjerskom ni obrazovnom ustanovom. |
| about 73, contact 59, sources 123 | ← Povratak na početnu | Na početnu |
| about 7 (description) | Quran Learning je platforma ... audio recitacijom. | {SITE_NAME} je besplatna aplikacija za učenje Kur'ana: arapski tekst, transliteracija, Korkutov prijevod i učač Mishary Alafasy. |
| contact 7 | Kontaktirajte nas ... | Pitanja, prijedlozi i prijave grešaka. |
| contact 19-20 | Imate pitanja ... Slobodno nam pišite preko GitHub Issues. | Pitanja, prijedlozi i prijave grešaka stižu nam preko GitHub Issues. |
| contact 38-39 | ... Prijave su javno vidljive, pa ne upisujte lične podatke. | Za prijavu je potreban besplatan GitHub nalog. Prijave su javne, pa u njih ne treba upisivati lične podatke. |
| contact 48-49 | Ako primijetite grešku ..., molimo navedite suru i ajet (ili link) u poruci. | Kod greške u tekstu, transliteraciji, prijevodu ili snimku najviše pomaže kad prijava navodi suru i ajet ili link. |
| sources 8 | Izvori podataka: kur'anski tekst, tedžvid oznake, transliteracija, prijevod i audio recitacija. | Izvori: arapski tekst, tedžvid oznake, transliteracija, prijevod i snimci učenja. |
| sources 35, 109 | ... preuzet je preko API-ja platforme Quran.com. | ... preuzet je sa servisa Quran.com. |
| sources 55-56 | ... a bojom se označavaju samo četiri pravila ... | ... a bojom su istaknuta samo četiri pravila (mad, ghunnah, ikhfa i qalqalah). |
| sources 65 | ... napravljena je pravilima iz arapskog teksta, sistemom | ... napravljena je iz arapskog teksta, sistemom |
| sources 84-85 | ... za praćenje recitacije preuzeti su s platforme Quran.com. | ... za praćenje učenja preuzeti su sa servisa Quran.com. |
| sources 94 | Audio recitacija | Snimci učenja |
| sources 114 | Ova platforma nije zvanično povezana ni sa jednom od navedenih institucija. | Aplikacija nije zvanično povezana ni s jednom od navedenih ustanova. |
| harfovi 139-141 | Ako uočite grešku, javite nam. | Greške se prijavljuju na stranici Kontakt. (link on "Kontakt") |
| duas 7 | ... Sa tačnom referencom (sura i ajet). | ... Uz tačno mjesto u Kur'anu. |
| duas 18 | Dove iz Kur'ana po kategorijama, sa tačnom referencom (sura i ajet) | Dove iz Kur'ana po temama, uz tačno mjesto u Kur'anu (sura i ajet) |
| duas/[category] 22 | Kur'anske dove – kategorija X. Sa tačnom referencom (sura i ajet). | Kur'anske dove: X. Uz tačno mjesto u Kur'anu. |
| duas/[category] 39 | ← Sve Kur'anske dove | Sve dove iz Kur'ana |
| duas/[category] 46 | Dove iz Kur'ana – kategorija sa tačnom referencom (sura i ajet) | Dove iz Kur'ana na ovu temu, uz tačno mjesto u Kur'anu |
| names 7, 18 | El-Esmāʼul-Ḥusnā – 99 ... na bosanski | El-Esmāʼul-Ḥusnā: 99 Allahovih lijepih imena s arapskim tekstom, transliteracijom i prijevodom |
| tajwid 19-20 | Kratke, fokusirane lekcije koje te vode kroz ... mini kviz na kraju. | Kratke lekcije o najvažnijim pravilima tedžvida, s primjerima iz Kur'ana i kvizom na kraju. |
| tajwid lesson 87, 131 | Kako proizvesti ovaj zvuk / Vježba na pravim ajetima | Kako se izgovara / Vježba na ajetima iz Kur'ana |
| tajwid lesson 143, 188, 206 | ↗, ←, → in links | removed |
| juz 69 | ← Pregled džuzeva | Svi džuzevi |
| not-found 15, 18 | Stranica nije pronađena / Adresa koju si tražio ne postoji ili je premještena. | Ova stranica ne postoji / Možda je adresa pogrešno upisana ili je stranica premještena. |
| error 21, 24-35 | Nešto nije u redu / Došlo je do neočekivane greške ... prijavi je preko GitHub Issues. | Stranica se nije učitala / Osvježi stranicu. Ako se greška ponovi, javi je preko stranice Kontakt. (link to /contact) |
| surah/error 20, 23, 42 | Greška pri učitavanju sure / Nije moguće učitati ovu suru. Provjeri internet vezu i pokušaj ponovo. / Lista sura | Sura se nije učitala / Provjeri internet i pokušaj ponovo. / Sve sure |
| learn/error 20, 23, 42 | Greška u načinu učenja / Nije moguće pokrenuti način učenja ... / Lista sura | Učenje se nije otvorilo / Provjeri internet i pokušaj ponovo. / Sve sure |
| search/error 20, 23 | Greška pretrage / Pretraga trenutno nije dostupna. Provjeri internet vezu i pokušaj ponovo. | Pretraga se nije učitala / Provjeri internet i pokušaj ponovo. |
| tajwid/[lessonId]/error 20, 23 | Greška pri učitavanju lekcije / Nije moguće učitati ovu tajwid lekciju. ... | Lekcija se nije učitala / Provjeri internet i pokušaj ponovo. |

- [ ] **Step 1: Update the failing tests** (page tests assert the new strings; `error.test.tsx` the new error copy).
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: neutral, consistent wording on home, navigation and static pages (copy deck)`

### Task 8: Copy -- reader and app screens; copy rules guard

**Files:** `src/app/surah/[surahId]/page.tsx:88-121`, `src/components/reader/JuzReaderContent.tsx:63,82`, `src/components/quran/AyahWordByWord.tsx:91`, `src/components/quran/TajwidLegend.tsx`, `src/app/bookmarks/page.tsx`, `src/components/bookmarks/BookmarksContent.tsx` (rest), `src/components/progress/ProgressContent.tsx` (rest), `src/app/search/page.tsx` (rest), `src/components/surahs/SurahsPageContent.tsx`, `src/components/surahs/SearchInput.tsx`, `src/components/surahs/VirtualSurahList.tsx`, `src/components/settings/SettingsPanel.tsx` (rest), `src/app/learn/[surahId]/page.tsx:22`. Create `src/components/__tests__/copyRules.test.ts`.

| Where | Now | New |
|---|---|---|
| surah page 89, 96, 107, 120 | ← Prethodna: X / Pregled sura / Režim učenja / Sljedeća: X → | Prethodna sura: X / Sve sure / Uči ajet po ajet / Sljedeća sura: X (no arrows; if "sura" makes the pills wrap into three rows at 375 px, keep "Prethodna:"/"Sljedeća:") |
| JuzReaderContent 63, 82 | ← / → | removed |
| AyahWordByWord 91 | Označavanje riječi nije dostupno za ovaj ajet. | Za ovaj ajet nema praćenja riječ po riječ. |
| TajwidLegend 33, 45, 10 | Legenda tedžvida / Boje se prikazuju kada u podacima ajeta postoje anotacije ... / Normalan | Šta znače boje / Boje pokazuju četiri pravila izgovora. Ostala pravila nisu obojena. / Bez pravila |
| bookmarks page 6-7 | Označeni ajeti / Pregled ajeta koje ste označili dok čitate. | Sačuvani ajeti / Ajeti sačuvani tokom čitanja, s bilješkama. |
| BookmarksContent 17 | Nemate označenih ajeta. Označite ajete klikom na bookmark ikonu dok čitate. | Još nema sačuvanih ajeta. Ajet se čuva dodirom na ikonu za čuvanje pored njega. + link-button "Sve sure" to /surahs |
| BookmarksContent 92, 107, 131 | Označeni ajeti | Sačuvani ajeti |
| BookmarksContent 134, 139 | Sortiraj: + `aria-label` "Sortiraj po" | visible "Redoslijed" as the label, no `aria-label` |
| BookmarksContent 141-142 | Po suri / Po datumu dodavanja | Po redu u Kur'anu / Najnovije prvo |
| BookmarksContent 206, 231 | Dodaj bilješku... / + Dodaj bilješku | Bilješka uz ajet / Dodaj bilješku |
| ProgressContent 58 | Ukupna statistika | Ukupno |
| ProgressContent 118 | Nepočete | Nezapočete |
| ProgressContent 122, 127 | Sortiraj: + `aria-label` "Sortiraj po" | "Redoslijed" as the `label` of the select, no `aria-label` |
| ProgressContent 129-131 | Redoslijed sura / Po napretku % / Zadnji pristup | Po redu u Kur'anu / Po napretku / Nedavno otvorene |
| search 11 | Pretraži ajete, sure, prijevod... | npr. milost, jasin ili 2:255 |
| search 12 | Unesite pojam za pretragu (npr. Milostivog, Allah). | Traži se po riječi iz prijevoda, nazivu sure ili broju ajeta (2:255), a može i arapskim pismom. |
| search 13 | Nije pronađeno. Pokušajte sa drugim pojmom. | Ništa nije pronađeno. Može pomoći druga riječ ili broj ajeta. |
| search 199 | Nedavne pretrage: | Nedavno traženo |
| SearchInput 12 | Pretraži po broju ili nazivu... | Broj ili naziv sure |
| SurahsPageContent 115, 117 | Nije pronađeno / Pokušajte ponovo s drugim pojmom ili provjerite pravopis. | Nema takve sure / Traži se po broju od 1 do 114 ili po dijelu naziva, npr. jasin. |
| VirtualSurahList 17 | Lista sura | Sve sure |
| SettingsPanel 132, 138, 153 | Veličina arapskog fonta / Smanji veličinu fonta / Povećaj veličinu fonta | Veličina arapskih slova / Manja slova / Veća slova |
| SettingsPanel 163, 179, 184 | Stil arapskog fonta / Naskh (zaobljen), Scheherazade / Naskh = ... Scheherazade = ... | Arapsko pismo / Osnovno, Klasično / Klasično pismo ima tradicionalniji oblik slova; osnovno je jednostavnije. |
| SettingsPanel 216, 224, 226 | Recitator / Brzina reprodukcije (label and group) | Učač / Brzina |
| SettingsPanel 246 | Sljedeća sura automatski | Nakon sure pusti sljedeću |
| SettingsPanel 255-256 | ... prije nego pređe na sljedeći. "Ručno" čeka dok ne klikneš "Nastavi". | Koliko se čeka nakon svakog ajeta. Uz &bdquo;Ručno&ldquo; sljedeći ajet počinje tek kad dodirneš &bdquo;Nastavi&ldquo;. |
| SettingsPanel 506, 511 | Offline čitanje / Ovaj preglednik ne podržava spremanje sura za čitanje bez interneta. | Čitanje bez interneta / Ovaj preglednik ne može preuzeti sure za čitanje bez interneta. |
| SettingsPanel 515-516 | Preuzimanje sprema tekst ... Audio (učenje) nije uključen: za slušanje je uvijek potrebna internet veza. | Preuzimanje sprema tekst svih 114 sura (arapski tekst, transkripciju i prijevod) za čitanje bez interneta, oko 40 MB. Snimci učača nisu uključeni: za slušanje treba internet. |
| SettingsPanel 522, 530, 558 | Provjeravam šta je već spremljeno… / Preuzmi sve sure za offline / Otkaži | Provjera preuzetih sura… / Preuzmi sve sure (40 MB) / Prekini preuzimanje |
| SettingsPanel 567 | Svih 114 sura je spremljeno za čitanje bez interneta. | Svih 114 sura je preuzeto. Čitanje radi i bez interneta. |
| SettingsPanel 578-579 | Ništa nije spremljeno: offline način još nije aktivan ... Osvježite stranicu i pokušajte ponovo. | Preuzimanje još ne radi na ovoj stranici. Treba osvježiti stranicu i pokušati ponovo. |
| SettingsPanel 470, 472, 474 | Provjerite internet vezu. / Server je vratio grešku (503). / Preglednik ih nije spremio (možda nema dovoljno prostora). | Možda nema internet veze. / Server trenutno ne odgovara (greška 503). Treba pokušati kasnije. / Preglednik ih nije uspio pohraniti; možda na uređaju nema dovoljno prostora. |
| learn page 22 | Fokusirano učenje sure X | Učenje sure X ajet po ajet |

- [ ] **Step 1: Write the failing tests** -- update the component tests to the table; add `copyRules.test.ts` (scan `.ts`/`.tsx` outside `__tests__`, `src/data`, `src/app/_test`, `src/components/test`, skipping comment lines): no word from the "Vi" list (`ste, Vam, Vas, Vaš*, nemate, imate, Imate, pokušajte, provjerite, označite, osvježite, Počnite, pišite, upisujte, možete, navedite, primijetite, uočite, javite, Unesite, čitate, Kontaktirajte`), no "/la ", no "tražio", no "platform" outside identifiers, no "..." inside `placeholder`, no character in U+1F300-U+1FAFF, no "←", "→" or "↗".
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: neutral, consistent wording in the reader, search, saved ayahs, progress and settings (copy deck)`

### Task 13: Owner decisions of 2026-11-19 -- transkripcija, Bosnian tajwid names, Selam/Mašallah (runs after Task 8, before Task 9)

**Files:** every file with user-visible "transliteracij..." (at the time of writing: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/sources/page.tsx`, `src/app/harfovi/page.tsx`, `src/app/names/page.tsx`, `src/components/layout/Footer.tsx`, `src/components/settings/SettingsPanel.tsx`, `src/components/reader/ReaderToolbar.tsx`, `src/components/learn/LearnModeContent.tsx`, `public/manifest.webmanifest`; check `src/lib/letters/data.ts` and `src/lib/names/data.ts` for user-visible strings), `src/lib/quran/tajwidStyles.ts`, `src/components/quran/TajwidLegend.tsx`, `src/components/home/ContinueLearningSection.tsx`, `src/components/tajwid/TajwidQuiz.tsx`, the tests that assert these strings, `src/components/__tests__/copyRules.test.ts` (extend).

- transliteracija -> transkripcija in user-visible text, keeping case and declension (transliteracije -> transkripcije, transliteraciji -> transkripciji, transliteraciju -> transkripciju, transliteracijom -> transkripcijom). Keep: identifiers, the `transliteration` data field, settings keys such as `showTransliteration`, scripts, file names, code comments, the title of the IZ BiH document "Pravila transkripcije i transliteracije", and any text that names the Pravila's own systems as the Pravila name them (on `/harfovi`, change only sentences about the app's own Latin line). Report every occurrence kept, with the reason.
- Tajwid names: `tajwidStyles.ts` exports `tajwidRuleNames` (normal "Bez pravila", mad "Medd", ghunnah "Gunne", ikhfa "Ihfa", qalqalah "Kalkala") and `tajwidRuleDescriptions` (normal "", mad "glas se produžava", ghunnah "izgovor kroz nos", ikhfa "prikriven izgovor kroz nos", qalqalah "odskok glasa"); `tajwidRuleLabels` becomes "Bez pravila" for normal and `${name}: ${description}` for the rest ("Medd: glas se produžava", as in the copy deck). `TajwidLegend` drops its local `ruleDisplayNames`: bold name from `tajwidRuleNames`, second line the description with a capital first letter and a final period, no second line for normal. `TajwidLessonCard` keeps showing `tajwidRuleLabels`. Running text: home feature "Četiri pravila izgovora obojena su u tekstu: medd, gunne, ihfa i kalkala."; sources "(medd, gunne, ihfa i kalkala)". `TajwidRule` values, lesson titles and texts from `src/data` and colors do not change.
- "Selam!" / "Mašallah!" only here: ContinueLearningSection welcome (both places) "Selam! Dobar početak su kratke sure ispod."; LearnModeContent end of surah "Sura je završena. Mašallah!"; TajwidQuiz all correct "Sve je tačno. Lekcija je savladana. Mašallah!", passed "Lekcija je savladana. Mašallah! Kviz možeš ponoviti kad god hoćeš."

- [ ] **Step 1: Write the failing tests** -- update the component and page tests to the new strings; extend `copyRules.test.ts`: no `/[Tt]ransliteracij/` in non-comment lines of the scanned sources and in `public/manifest.webmanifest` (allowlist: the document title "Pravila transkripcije i transliteracije" and any kept /harfovi system name the report justifies), and no `\b(Mad|Ghunnah|Ikhfa|Qalqalah)\b` in non-comment lines outside `src/data`; "Selam!" and "Mašallah!" occur only in the three files above.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `fix: transkripcija, Bosnian tajwid rule names, Selam and Mašallah (owner decisions 2026-11-19)`

### Task 9: Page titles from one template; app name only in SITE_NAME

**Files:** `src/app/layout.tsx:42-46`, every `metadata`/`generateMetadata` title (about, bookmarks, contact, duas, duas/[category], harfovi, juz, learn, names, not-found, progress, search/layout, settings/layout, sources, surah, surahs, tajwid, tajwid/[lessonId]), `src/components/layout/Header.tsx:63-66`, `src/components/layout/Footer.tsx:3,20,55`, `src/app/about/page.tsx` (h2 and description name). Tests: the seven page/layout tests that assert "| Quran Learning", `src/app/__tests__/metadata.test.ts` (new).

- Root: `title: { default: SITE_NAME, template: \`%s | ${SITE_NAME}\` }`, description "Kur'an na bosanskom: arapski tekst, transkripcija po pravilima Rijaseta IZ BiH, Korkutov prijevod i učač Mishary Alafasy."
- Pages give only their part: "O aplikaciji", "Sačuvani ajeti", "Kontakt", "Kur'anske dove", "{kategorija} | Kur'anske dove", "Harfovi i izgovor", "Džuz {n} — {name}", "Učenje: {surah}", "Allahova lijepa imena", "Ova stranica ne postoji", "Napredak", "Pretraga", "Postavke", "Izvori", "{surah}", "Sve sure" (also the `/surahs` `h1`), "Tedžvid lekcije", "{lekcija} | Tedžvid lekcije"; fallbacks "Sura", "Učenje", "Džuz", "Tedžvid lekcije", "Kur'anske dove".
- Header brand text and `aria-label` "{SITE_NAME}, početna"; Footer and about use `SITE_NAME`.

- [ ] **Step 1: Write the failing test** `metadata.test.ts`: root `metadata.title` equals `{ default: "Quran Learning", template: "%s | Quran Learning" }`; a source scan finds the literal "Quran Learning" in no `.ts`/`.tsx` file except `src/lib/site.ts` (tests and `src/app/_test` excluded). Update the seven existing tests to the bare titles.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS**; gates.
- [ ] **Step 5: Commit** `refactor: page titles from one template and the app name from SITE_NAME`

### Task 10: The NASTAVI badge, the surah notes and the back-to-top button

**Files:** `src/components/home/FeaturedSurahsSection.tsx` (badge at ~95-99; `NOTES` at 10-15 and its rendering at ~110-114 are removed per the owner's 2026-11-19 decision -- the card keeps the Arabic name, the Latin name and the ayah count), `src/app/tajwid/[lessonId]/page.tsx:181-210` (or `BackToTop.tsx`, see Step 3). Tests: `FeaturedSurahsSection.test.tsx`, `src/app/tajwid/[lessonId]/__tests__/page.test.tsx`.

Measured before this task (production at 375x812, Playwright): the back-to-top button (x 311-359, y 668-716) covers up to 13% of the lesson pager's "Sljedeća ..." link (x 122-343) and 8% of "Prethodna ..." while scrolling past; at the end of the page the pager sits above it; the surah and juz pagers never meet the button. The NOTES test: no featured card renders a note (e.g. no "rekiji", "Jednost Boga", "utočišta").

- [ ] **Step 1: Reproduce in the browser** at 375 px: the badge over the Arabic name on a surah in progress; on `/tajwid/<slug>` scroll until "Sljedeća" passes the bottom right and note where the button covers it (record the scroll positions).
- [ ] **Step 2: Write the failing tests** -- the badge is not absolutely positioned (no `absolute` class), comes after the Latin name in DOM order, reads "Nastavi" without `uppercase`; the lesson pager keeps the button's column free below `md` (assert the class chosen in Step 3).
- [ ] **Step 3: Implement.** Badge: in flow under the Latin name, `self-start mt-2 rounded-full px-2 py-0.5 text-xs font-medium` with today's colors (D11). Back-to-top: reserve its column on the lesson pager below `md` (`max-md:pr-16` on the footer row so no pill sits under the 3rem button at `right-4`); if Step 1 shows the overlap elsewhere too, the same reservation goes on the surah and juz pagers.
- [ ] **Step 4: Run, expect PASS**; gates; recheck both in the browser.
- [ ] **Step 5: Commit** `fix: NASTAVI badge under the surah name, no surah notes, back-to-top button off the lesson pager (critique)`

### Task 11: Transliteration font (only with the owner's OK; otherwise Phase 2)

Needs: download `GentiumBookPlus-Regular.ttf` (818,952 bytes), `GentiumBookPlus-Italic.ttf` (882,904 bytes) and `OFL.txt` (4,507 bytes) from github.com/google/fonts (`ofl/gentiumbookplus`), and `python -m pip install --user fonttools` (pure Python; `brotli` is already installed). Google Fonts' copy is used because its OFL has no Reserved Font Name, so a subset may keep the name; check `OFL.txt` before subsetting and rename the family if it does reserve one.

**Files:** Create `scripts/subset-transliteration-font.py` (reads every character of the transliteration data -- `src/data/ayahs/*.json`, `src/data/transliteration/*`, duas, names, letters, lesson examples -- adds ASCII and Latin-1, runs `pyftsubset --flavor=woff2 --layout-features='*'`, writes `src/app/fonts/GentiumBookPlus-{Regular,Italic}-subset.woff2` and `src/app/fonts/gentium-coverage.json` = `{ "sha256": {...}, "codepoints": [...] }`), `src/app/fonts/OFL.txt`, `src/app/__tests__/transliterationFont.test.ts`. Modify `src/app/layout.tsx` (`next/font/local`, `variable: "--font-gentium"`, `preload: false`, `display: "swap"`), `src/app/globals.css` (`@theme inline { --font-transliteration: var(--font-gentium), var(--font-geist-sans), sans-serif; }`), and the transliteration lines (AyahCard, LearnModeContent, DuaCard, NameCard, lesson examples, harfovi table cells) get `font-transliteration`.

- [ ] **Step 1: Write the failing test** -- every code point in the transliteration data, U+0331 included, is in `gentium-coverage.json`; the sha256 values in it match the two `.woff2` files; `layout.tsx` registers `--font-gentium`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Download, subset, wire up.** **Step 4: Run, expect PASS**; gates; in the browser, the canvas width check from the memory note shows no fallback glyph for "s̱", "ḥ", "ẓ", "ʿ".
- [ ] **Step 5: Commit** `feat: self-hosted transliteration font that covers every letter (Gentium Book Plus subset, OFL)`

### Task 14: Axe regression test (runs after Task 11, before Task 12)

**Files:** `package.json` and `package-lock.json` (devDependency `@axe-core/playwright`, installed with `npx npm@11 install -D @axe-core/playwright`), create `tests/e2e/a11y.spec.ts`; `playwright.config.ts` only if the spec needs a project or option it does not have (do not change `.github/workflows/ci.yml`).

- The spec runs axe (WCAG 2.0-2.2 A and AA tags, as the audit did) on the key routes -- `/`, `/surahs`, `/surah/1`, `/surah/36`, `/juz/30`, `/learn/36`, `/bookmarks`, `/progress`, `/search`, `/duas`, `/names`, `/harfovi`, `/tajwid`, `/tajwid/mad-duljenje`, `/about`, `/contact`, `/sources` -- at 375 px and 1280 px, in the light, dark and sepia themes (set the persisted theme in `localStorage` key `quran-learning-settings` before the page loads, the way the app's theme init script reads it), with no service worker in the way.
- Expected result: no violations, except an explicit, commented allowlist of known exceptions (rule id + selector + reason + the phase that fixes it), e.g. the dark-theme muted notes and the "Uredi" link contrast deferred to the Phase 2 tokens. No rule is disabled wholesale; an allowlisted entry that no longer occurs fails the test so the list cannot rot.
- It runs with `npx playwright test tests/e2e/a11y.spec.ts --project=chromium` (Firefox is not installed on this machine); the plan records how long it takes.

- [ ] **Step 1: Install the devDependency** and confirm `npm ls @axe-core/playwright`.
- [ ] **Step 2: Write the spec** with an empty allowlist; run it; it fails with the current violations.
- [ ] **Step 3: For each violation** either fix it when it is a Phase 1 regression or a decision-free one-liner (report which), or add it to the allowlist with its reason and phase.
- [ ] **Step 4: Run, expect PASS**; gates (typecheck covers the spec).
- [ ] **Step 5: Commit** `test: axe regression check over the key routes in three themes`

### Task 12: Verification and report

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (exit 0 each; report counts).
- [ ] Serve `out/` and check in the browser pane at 375 px and desktop, in light, dark and sepia: home (returning user with seeded progress), `/surah/36`, `/surah/76` ("31 ajet"), `/learn/36`, `/bookmarks` (dialog, focus after removal), `/progress`, `/search`, `/settings` panel (0,75×), a tajwid lesson and its quiz, `/names`, iOS steps (forced iOS UA). Keyboard: Tab through `/surah/36` on mobile and desktop, Shift+Tab back into the hidden header; nothing focused is covered; skip link works.
- [ ] Forced colors: Playwright Chromium with `forcedColors: "active"` -- focus visible on the search field, surah list, toolbar and settings.
- [ ] Run the Task 14 axe spec against the production build; expect no `nested-interactive` and only the allowlisted exceptions.
- [ ] Short Bosnian summary for the owner: what changed, what waits for Phase 2, the risks (Safari wording, real screen readers), and the reminder about the baseline URL before any production deploy.
