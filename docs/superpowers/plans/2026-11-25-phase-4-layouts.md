# Phase 4 layouts (PR 4.1, 4.2, 4.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reading before controls: the first ayah on the first screen, one settings entry, one selected
style, one ayah unit and one end navigation on every screen, with bar, layer and motion tokens.

**Architecture:** Shared presentational components in `src/components/ui` and `src/components/quran`
replace per-screen markup. The global `Header` switches its content by route segment through a pure
function (`readerContext`), fed by `surahs.json` and a small non-persisted position store. Bottom
offsets come from CSS variables that add up the bars present in the page. Stores keep their shape;
new numbers (read or heard, juz finished) are computed when shown.

**Tech Stack:** Next.js 16 static export, React 19, Tailwind 4 (`@theme inline`, `@utility`), zustand 5,
Vitest + Testing Library, Playwright (e2e on `npm run dev`, axe on port 3210).

**Spec:** `docs/superpowers/specs/2026-11-25-phase-4-layouts-design.md` (approved 2026-11-25).
Mockups: https://claude.ai/artifact/BPb3izsjJvLkYoGzCGnePa.

## Global Constraints

- No new dependencies, no new external source (no `vercel.json` change). Baseline Widely available.
- Storage keys `quran-learning-settings`, `quran-learning-progress`, `quran-learning-bookmarks` and the
  stored shapes do not change. URLs do not change; `/learn` is the only new route.
- Header and tab bar derive the route only from `useSelectedLayoutSegment()` (and `useParams()` under
  it): the static `404.html` is served for unknown URLs.
- The ayah unit stays `memo` with per-unit store selectors (QA P1-9); no store getters inside
  selectors (ESLint, P1-6).
- Colors only through tokens; themes switch on `data-theme` only; tajwid colors only through
  `tajwidStyles.ts`. Numbers, plurals and dates only through `src/lib/format.ts`.
- UI text in Bosnian per `docs/glas.md` and spec D11 ("Pusti", not "Slusaj"); code, comments, commits
  and PR text in English; docs in plain ASCII punctuation. Never type Quran text or transcription.
- Gates per PR: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:a11y`
  (7-12 min, alone). Screens at 375 and 1280 px in light, sepia, dark on `out/` served with
  `section-7-tools/serve-out.mjs`; keyboard pass; `baseline.mjs` rerun for before/after pairs
  (both in the shared notes folder, `phase-4-baseline/`).
- Git: PR 4.1 is this branch, `claude/phase-4-layouts-1b425c` (it holds the spec and this plan). 4.2
  and 4.3 are cut from `main` after the previous PR is merged. A branch is pushed once, when every
  gate is green locally; merge only when the owner says so in this session. Stage files by name.

## Review Focus

1. Unknown URL served by `404.html` (`/surah/115`, `/learn/abc`, `/juz/31`): brand header, no reader
   variant, no hydration error. Test in Task 8.
2. Progress stored before reading was tracked (a surah entry without `ayahsRead`) or empty storage:
   the union and juz math return 0, nothing throws. Tests in Task 5 and Task 13.
3. Progress with visited surahs but no last position (`lastSurahNumber` 0): the first-visit home, no
   empty "Nastavi" card; and a position set during the visit switches the variant. Task 15.
4. Pause after ayah while the learn screen hides the player: the countdown and "Nastavi" show in the
   learn bar, and in the player again after leaving the screen. Task 18.
5. A name's audio file fails or the phone is offline during "Pusti redom": playback stops, the row
   loses its highlight, the button returns to "Pusti redom", a status line says so. Task 21.

---

## File structure

| File | Responsibility | PR |
|---|---|---|
| `src/app/globals.css` | bar, layer, motion tokens; `--bars-bottom`; home variant rule | 4.1, 4.2 |
| `src/components/ui/selected.ts` | `SELECTED_CLASSES`, `IDLE_CLASSES` | 4.1 |
| `src/components/ui/ChoiceGroup.tsx`, `FilterChip.tsx`, `Switch.tsx`, `EndNav.tsx`, `icons.tsx` | shared controls | 4.1 |
| `src/components/ui/Button.tsx` | variants primary, secondary, quiet, danger; sizes md, sm | 4.1 |
| `src/components/quran/Rosette.tsx`, `AyahText.tsx` | ornament; Arabic + transcription + translation block | 4.1 |
| `src/components/reader/AyahUnit.tsx` (from `AyahCard.tsx`), `SurahFrame.tsx` (from `SurahHeader.tsx`) | ayah unit, surah frame | 4.1 |
| `src/components/layout/readerContext.ts`, `src/store/readerPositionStore.ts`, `src/components/reader/useActiveAyahObserver.ts` | header content by route; ayah on screen | 4.1 |
| `src/lib/progress/ayahsDone.ts`, `path.ts` | read-or-heard union; surah, juz and path math | 4.1, 4.2 |
| `src/components/home/HomeGreeting.tsx`, `ContinueCard.tsx`, `ShortSurahsSection.tsx`, `src/components/progress/PathSteps.tsx` | home blocks | 4.2 |
| `src/app/learn/page.tsx`, `src/components/learn/LearnOverview.tsx`, `LearnBar.tsx`, `src/lib/audio/pendingAdvance.ts` | learn overview; learn bar | 4.2 |
| `src/components/names/NameRow.tsx`, `useNamesPlayback.ts`, `src/components/progress/HatmaGrid.tsx` | names list; hatma cells | 4.3 |

Removed: `SurahReaderStickyHeader.tsx`, `ReaderToolbar.tsx` (4.1); `NavDisclosure` in `Header.tsx`,
`FeaturedSurahsSection.tsx`, `ContinueLearningSection.tsx`, `public/hero-bg.png` (4.2); `NameCard.tsx`
(4.3). Each removal takes its test file with it or rewrites it for the replacement.

---

# PR 4.1 Reader

### Task 1: Bar, layer and motion tokens

**Files:** Modify `src/app/globals.css`; the 13 files with `z-` classes and the files with hand-written
`bottom-*`, `pb-[..]`, `pt-12` bar offsets (`AppShell`, `AudioPlayer`, `MobileNav`, `Header`,
`BackToTop`, `Toast`, `TajwidRuleBar`, `InstallPrompt`, `OfflineIndicator`, `SearchInput`,
`search/page`); `stickyOffsets.test.tsx`. Test: `src/app/__tests__/layoutTokens.test.ts`.

**Interfaces (produces):** CSS variables `--bar-header: 3rem`, `--bar-nav: 3.5rem`, `--bar-player: 4rem`,
`--bar-nav-now` (`--bar-nav` under 48rem, else `0px`), `--bar-player-now` (`--bar-player` when
`:root:has([data-audio-player])`, else `0px`),
`--bars-bottom: calc(var(--bar-nav-now) + var(--bar-player-now) + env(safe-area-inset-bottom, 0px))`,
`--z-sticky: 10`, `--z-float: 30`, `--z-bars: 40`, `--z-player: 41`, `--z-infobar: 45`, `--z-toast: 50`,
`--z-skip: 60`, `--duration-press: 150ms`, `--duration-sheet: 200ms`; in `@theme inline`
`--ease-standard: cubic-bezier(0.2, 0, 0, 1)`; utilities (`@utility`) `z-sticky`, `z-float`, `z-bars`,
`z-player`, `z-infobar`, `z-toast`, `z-skip`, `duration-press`, `duration-sheet`.
`--app-header-offset` stays and becomes `var(--bar-header)` (0 while the header is hidden).

- [ ] **Step 1: Write the failing test** `layoutTokens.test.ts`: parses `globals.css` (comments
  stripped, as `themeTokens.test.ts` does) and asserts each value above; asserts
  `scroll-padding-bottom` is `calc(var(--bars-bottom) + 6rem)` and appears once; scans `src` (not
  `__tests__`) and fails on `/(^|[\s"'`:])z-(\d+|\[[^\]]+\])/` in any `.tsx`, listing file and class.
- [ ] **Step 2: Run** `npx vitest run src/app/__tests__/layoutTokens.test.ts`. Expected: FAIL.
- [ ] **Step 3: Add the tokens and utilities; replace classes.** Header and tab bar `z-bars`; player
  `z-player`; rule bar `z-infobar`; toast, offline notice and menus that open from a bar `z-toast`;
  skip link `z-skip`; back to top `z-float`; in-page sticky bars `z-sticky`. Fixed bottom elements use
  `bottom-[calc(var(--bars-bottom)+<gap>)]`; the shell's bottom padding is `pb-[var(--bars-bottom)]`;
  the player is `h-[var(--bar-player)]` at `bottom-[var(--bar-nav-now)]`.
- [ ] **Step 4: Run** the new test, `stickyOffsets.test.tsx`, `BackToTop.test.tsx`, `Toast.test.tsx`,
  `TajwidRuleBar.test.tsx`, `audioPlayerHidden.test.tsx`; update assertions that pin old classes.
  Expected: PASS.
- [ ] **Step 5: Commit** `feat: bar, layer and motion tokens`.

### Task 2: Button variants

**Files:** Modify `src/components/ui/Button.tsx`. Test: `src/components/ui/__tests__/Button.test.tsx`.

**Interfaces (produces):** `ButtonVariant = "primary" | "secondary" | "quiet" | "danger"`,
`ButtonSize = "md" | "sm"` (44 px `h-11`, 36 px `h-9`); the `shape` prop, `ghost` and `lg` are removed
(no caller uses them). Always `rounded-control`, `font-semibold text-[0.9375rem]`,
`duration-press ease-standard`. `quiet`: `text-accent-text px-2 hover:underline`; `danger`:
`bg-danger text-on-accent`. Disabled: `aria-disabled` styling `aria-disabled:opacity-45`.

- [ ] **Step 1: Test:** each variant renders its classes; no `rounded-full`; `ButtonLink` passes
  `prefetch={false}` through. **Step 2:** run, FAIL. **Step 3:** implement. **Step 4:** run with
  `npx vitest run src/components/ui src/app/__tests__/page.test.tsx`, PASS. **Step 5:** commit
  `feat: button variants per Tezhib`.

### Task 3: ChoiceGroup, FilterChip, Switch and the selected style

**Files:** Create `src/components/ui/selected.ts`, `ChoiceGroup.tsx`, `FilterChip.tsx`, `Switch.tsx`
(moved out of `SettingsPanel.tsx`); export from `ui/index.ts`. Tests: `ui/__tests__/ChoiceGroup.test.tsx`,
`FilterChip.test.tsx`, `Switch.test.tsx`, `src/app/__tests__/selectedStyle.test.ts`; extend
`themeTokens.test.ts`.

**Interfaces (produces):**
```ts
export const SELECTED_CLASSES = "border-accent-text bg-accent-wash text-accent-text";
export const IDLE_CLASSES = "border-transparent text-ink-muted hover:text-ink";
export function ChoiceGroup<T extends string>(props: {
  legend: string; hideLegend?: boolean; name: string;
  options: readonly { value: T; label: string }[];
  value: T; onChange: (value: T) => void; describedBy?: string; className?: string;
}): React.JSX.Element; // fieldset + legend + native radios; track bg-surface-sunken border-line rounded-full; option min-h-9 border-[1.5px] rounded-full
export function FilterChip(props: { pressed: boolean; onToggle: () => void; children: React.ReactNode; className?: string }): React.JSX.Element; // button aria-pressed, h-8, border-[1.5px] border-line-strong when idle
export function Switch(props: { label: string; checked: boolean; onChange: (checked: boolean) => void; id?: string }): React.JSX.Element; // row: label + button role="switch", 44 x 26
```

- [ ] **Step 1: Tests.** ChoiceGroup: `getByRole("group", { name: legend })`, radios named by label,
  the checked one matches `value`, ArrowRight on the checked radio calls `onChange` with the next
  value (`userEvent`), the checked label has every class of `SELECTED_CLASSES`. FilterChip:
  `aria-pressed` follows `pressed`. Switch: `role="switch"`, `aria-checked`, a click on the label text
  toggles. `themeTokens.test.ts`: `accent-text` on `surface-sunken` and on `surface` >= 3 in every
  theme. `selectedStyle.test.ts`: scans `src`; `aria-pressed`, `type="radio"`, `role="switch"` and
  `bg-accent-wash` may appear only in the three components, `selected.ts`, and a `LEGACY` list of files
  not migrated yet (every file where they appear today); a `LEGACY` entry with no hit fails the test.
- [ ] **Step 2:** run, FAIL. **Step 3:** implement. **Step 4:** run, PASS. **Step 5:** commit
  `feat: ChoiceGroup, FilterChip, Switch and one selected style`.

### Task 4: Rosette, icons, AyahText

**Files:** Create `src/components/quran/Rosette.tsx`, `AyahText.tsx`, `src/components/ui/icons.tsx`;
modify `TajwidTextRenderer.tsx`, `AyahWordByWord.tsx`, `WordByWordRenderer.tsx` (new optional prop
`trailing?: React.ReactNode`, rendered as the last child inside the Arabic paragraph). Tests:
`quran/__tests__/Rosette.test.tsx`, `AyahText.test.tsx`; extend `TajwidTextRenderer.test.tsx`,
`WordByWordRenderer.test.tsx`.

**Interfaces (produces):**
```ts
export function Rosette(props: { number: number; filled?: boolean }): React.JSX.Element;
// <span data-rosette aria-hidden="true" class="... select-none"> two 23x23 rects (second rotated 45deg), stroke 1.6 in text-gold; number in ink, 12 px semibold (11 px from 100); filled: fill gold at 25%
export function AyahText(props: {
  arabic: React.ReactNode; transliteration?: string | null; translation?: string | null;
  align?: "reading" | "center"; className?: string;
}): React.JSX.Element; // transcription: font-transliteration 18/19 px ink-muted mt-3; translation: font-read 17/18 px mt-2 max-w-[42rem]; "reading" = Arabic right, Latin left
export function PlayIcon(p: { className?: string }): React.JSX.Element; // also PauseIcon, StopIcon (filled); everything else comes from lucide-react at strokeWidth 1.75
```

- [ ] **Step 1: Tests.** Rosette: not in the accessibility tree (`queryByText("7")` found,
  `getByText("7").closest("[aria-hidden='true']")` not null), `data-rosette` present, 3-digit number
  gets the smaller size class. Renderers: `trailing` is inside the `p[lang="ar"]` and after the last
  text; a click on it does not open the rule bar and does not seek. AyahText: no transcription
  element when `transliteration` is empty.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS. **Step 5:** commit
  `feat: rosette, shared icons and the ayah text block`.

### Task 5: Read-or-heard union

**Files:** Create `src/lib/progress/ayahsDone.ts`. Test: `src/lib/progress/__tests__/ayahsDone.test.ts`.

**Interfaces (produces):**
```ts
type Sets = { ayahsListened?: Iterable<number>; ayahsRead?: Iterable<number> } | undefined;
export function ayahsDone(p: Sets): Set<number>;       // union; missing fields count as empty
export function ayahsDoneCount(p: Sets): number;
```

- [ ] **Step 1: Test:** listened {1,2} and read {2,3} gives 3; `undefined` gives 0; an entry without
  `ayahsRead` gives the listened count. **Steps 2-4:** FAIL, implement, PASS. **Step 5:** commit
  `feat: count read and heard ayahs together`.

### Task 6: SurahFrame

**Files:** `git mv src/components/reader/SurahHeader.tsx SurahFrame.tsx`; rename the two test files
to `SurahFrame.test.tsx`, `SurahFramePlaybackMobile.test.tsx`; update `reader/index.ts`.

**Interfaces (produces):**
`SurahFrame(props: { surah: SurahSummary; ayahs?: Ayah[]; variant?: "page" | "segment" })`.
Consumes: `ayahsDoneCount`, `Button`, `ButtonLink`, `formatCount`, `formatNumber`.

- [ ] **Step 1: Tests.** Page variant: one `h1` whose text has the Arabic name (in a `span[lang="ar"]`)
  and the Latin name; meta text `"4 ajeta, mekanska sura, str. 604"` for surah 112 (`"medinska sura"`
  for 2; a page range as `"str. 2-49"` with an en dash, as today); button `"Pusti suru"` queues the
  surah and plays ayah 1 (existing playback tests, renamed); link `"Uči ajet po ajet"` to `/learn/112`
  with `prefetch={false}`; with progress listened {1} and read {2}: text `"Pročitano: 2 od 4 ajeta"`
  and no element with `style` width (no bar); without progress no such text. The frame has
  `border-gold outline outline-1 outline-gold outline-offset-[3px] rounded-control` and no links to
  other surahs. Segment variant: an `h2`, no buttons.
- [ ] **Steps 2-4:** FAIL, implement, PASS. **Step 5:** commit `feat: surah frame`.

### Task 7: AyahUnit

**Files:** `git mv src/components/reader/AyahCard.tsx AyahUnit.tsx` and rename the export and every
import, as its own commit `refactor: rename AyahCard to AyahUnit`. Then modify `AyahUnit.tsx` and the
tests in `reader/__tests__` (`accessibleNames`, `typography`, `AyahPageInfo`, `AyahPlaybackMobile`,
`AyahReadDwell`, `SurahReaderRenders`).

**Interfaces (produces):** today's props plus `variant?: "flow" | "card"` (default `"flow"`). Keeps
`memo`, the per-unit selectors, the read-dwell observer, `id="ayah-S-N"`, `data-ayah-id`,
`data-active`. Consumes: `Rosette`, `AyahText`, `PlayIcon`, `PauseIcon`.

- [ ] **Step 1: Tests.** `article` named `"5. ajet"` (in a juz `"5. ajet sure El-Mulk"`) by a
  visually hidden element; the rosette shows 5 and is `aria-hidden`; flow variant has `border-t
  border-line py-5` and none of `rounded-xl`, `bg-surface`, `lg:grid-cols-2`; card variant has
  `rounded-card border bg-surface`; Arabic `text-right`, translation not `text-center`; buttons
  `"Pusti 5. ajet"` / `"Pauziraj 5. ajet"` and `"Sačuvaj 5. ajet"` / `"Ukloni 5. ajet iz sačuvanih"`,
  each at least 40 x 40 (`h-10 w-10`), the save button with `aria-pressed`; playing: `bg-highlight`,
  rosette `filled`, visible text `"Sluša se"`; `"str. 604"` only with `showPageBadge`. The render-count
  test in `SurahReaderRenders` still passes unchanged (one unit re-renders per tick, not all).
- [ ] **Steps 2-4:** FAIL, implement, PASS (`npx vitest run src/components/reader`). **Step 5:**
  commit `feat: ayah unit flows as text with a rosette`.

### Task 8: Header reader variant

**Files:** Create `src/components/layout/readerContext.ts`, `src/store/readerPositionStore.ts`,
`src/components/reader/useActiveAyahObserver.ts`; modify `Header.tsx`, `SurahAyahNav.tsx`,
`SurahReaderContent.tsx`, `globals.css` (`scroll-padding-top: calc(var(--bar-header) + 0.5rem)`);
delete `SurahReaderStickyHeader.tsx`, `ReaderToolbar.tsx` and the phone "Praćenje uz zvuk" strip.
Tests: `layout/__tests__/readerContext.test.ts`, extend `HeaderHydration.test.tsx`,
`headerFocus.test.tsx`, `stickyOffsets.test.tsx`.

**Interfaces (produces):**
```ts
export type ReaderContext = {
  kind: "surah" | "juz" | "learn"; title: string; titleArabic?: string;
  backHref: string; backLabel: string; total?: number;
};
export function readerContext(segment: string | null, params: Record<string, string | string[] | undefined>): ReaderContext | null;
// surah: title nameLatin, titleArabic nameArabic, total ayahCount, back "/surahs" "Sve sure"
// juz:   title "Džuz 30", back "/surahs?view=juz" "Svi džuzevi", no total
// learn: as surah, back `/surah/${n}` "Nazad na suru"   (Header uses it from Task 18 on)
// null for any other segment and for a number outside 1..114 (juz 1..30) or not an integer
export const useReaderPositionStore: UseBoundStore<StoreApi<{ ayahNumber: number; setAyahNumber: (n: number) => void }>>;
export function useActiveAyahObserver(ayahs: readonly Ayah[]): void; // the one IntersectionObserver; writes the store
```

- [ ] **Step 1: Tests.** `readerContext("surah", { surahId: "112" })` equals the surah object above
  with total 4; `("surah", { surahId: "115" })`, `("surah", { surahId: "abc" })`, `("juz", { juzId:
  "31" })`, `(null, {})`, `("surahs", {})` are `null`. Header on a surah route: no brand link under
  640 px markup branch, a back link named `"Sve sure"`, the title, a counter with visible `"1/4"`
  and screen-reader text `"1. ajet od 4"`, exactly one control named `"Postavke čitanja"`, no search
  link in the phone branch; the title has `truncate` and the counter `shrink-0` (286/286 must fit).
  Header for the 404 case (segment `"/_not-found"`): brand header, as the existing hydration test
  asserts. `SurahReaderContent` renders no element with role `toolbar`.
- [ ] **Steps 2-4:** FAIL, implement (the counter reads the store; `SurahReaderContent` calls
  `useActiveAyahObserver`; `SurahAyahNav` reads the store and uses `SELECTED_CLASSES`), PASS.
- [ ] **Step 5:** commit `feat: the header names the surah; one way into reading settings`.

### Task 9: Reading settings sheet

**Files:** Modify `SettingsPanel.tsx`, `TajwidLegend.tsx`, `SurahReaderContent.tsx`,
`JuzReaderContent.tsx`, `LearnModeContent.tsx`; create `src/components/quran/useTajwidNotice.ts`.
Tests: `SettingsPanel.test.tsx`, `TajwidLegend.test.tsx`, `quran/__tests__/useTajwidNotice.test.tsx`.

**Interfaces (produces):** `useTajwidNotice(): void` (the Phase 3 D7 effect, moved out of the legend:
shows the toast once when `showTajwidColors` is on and `tajwidNoticeSeen` is `false`).

- [ ] **Step 1: Tests.** The first group heading is `"Čitanje"` (no `uppercase` class on any group
  heading) with, in order: letter size, `ChoiceGroup` "Arapsko pismo" (Moderno, Klasično), switches
  "Transkripcija" and "Prijevod", `ChoiceGroup` "Tedžvid" (Isključeno, Boje, Boje i linije), the
  legend (only while colors are on), `ChoiceGroup` "Praćenje uz zvuk" (Po ajetu, Riječ po riječ)
  bound to `playerStore.wordByWordMode`, theme. Speed, pause after ayah and repeat are
  `ChoiceGroup`s (radios, not `aria-pressed` buttons). The legend is no longer rendered by the three
  reader components; `useTajwidNotice` fires the toast once with stored `tajwidNoticeSeen: false`.
  Stored settings in today's shape still load (`settingsStoreMigration.test.ts` unchanged, green).
- [ ] **Steps 2-4:** FAIL, implement, PASS; remove `SettingsPanel.tsx` and `TajwidLegend.tsx` uses
  from `LEGACY` in `selectedStyle.test.ts`. **Step 5:** commit `feat: reading settings in one sheet`.

### Task 10: Reader page, juz reader, end navigation

**Files:** Create `src/components/ui/EndNav.tsx`; modify `src/app/surah/[surahId]/page.tsx`,
`SurahReaderContent.tsx`, `JuzReaderContent.tsx`, `src/app/juz/[juzId]/page.tsx`,
`ReaderSkeleton.tsx`, `surah/[surahId]/loading.tsx`. Tests: `ui/__tests__/EndNav.test.tsx`,
`JuzQueue.test.tsx`, `emptyAndLoading.test.tsx`.

**Interfaces (produces):**
```ts
type EndLink = { href: string; kicker: string; title: string };
export function EndNav(props: { label: string; prev?: EndLink; next?: EndLink; all: { href: string; label: string } }): React.JSX.Element;
// <nav aria-label={label}>: two-column grid of quiet cards (border-line rounded-control p-3, kicker 13 px ink-muted over the title; next is right-aligned), then the "all" link (quiet)
```

- [ ] **Step 1: Tests.** EndNav: `getByRole("navigation", { name: "Susjedne sure" })`; with only
  `next` the first column is empty and the grid keeps two columns; no `bg-accent` anywhere. Surah
  page: the order in the DOM is frame, ayah list, EndNav (`"Prethodna sura"` El-Leheb, `"Sljedeća
  sura"` El-Feleq, `"Sve sure"`); no link to another surah before the first `[data-ayah-id]`; the page
  wrapper has no vertical padding of its own; reading column `max-w-[42rem]`, ayah list `w-56`. Juz
  reader: each segment starts with `SurahFrame variant="segment"`; EndNav `"Susjedni džuzevi"`
  (`"Prethodni džuz"`, `"Sljedeći džuz"`, `"Svi džuzevi"` to `/surahs?view=juz`) after the list.
- [ ] **Steps 2-4:** FAIL, implement, PASS. **Step 5:** commit
  `feat: reader starts with the text; neighbours at the end`.

### Task 11: Player bar

**Files:** Modify `AudioPlayer.tsx` and its four test files.

- [ ] **Step 1: Tests.** The bar has `h-[var(--bar-player)]`; the main button has `bg-accent
  text-on-accent`; on every width repeat and "Pusti sljedeću suru" are inside "Više opcija zvuka":
  a `ChoiceGroup` "Ponavljanje" (Isključeno, Sura, Ajet) writing `setRepeatMode`, and a `Switch`;
  none of them is rendered in the bar itself. Existing behavior tests stay green.
- [ ] **Steps 2-4:** FAIL, implement, PASS; remove `AudioPlayer.tsx` from `LEGACY`. **Step 5:**
  commit `feat: player bar at 64 px with options in one menu`.

### Task 12: e2e, gates, screenshots, PR 4.1

**Files:** Create `tests/e2e/readerLayout.spec.ts`.

- [ ] **Step 1: e2e.** For `/surah/1`, `/surah/36`, `/surah/112` at 375 x 812 and 1280 x 800:
  the bounding box of the first `[data-ayah-id]` has `top >= 48` and `bottom <=` the top of the tab
  bar (phone) or the viewport height (desktop); again with seeded `quran-learning-progress` for
  that surah. Exactly one visible control whose name contains "Postavke". `/surah/115` shows the 404
  page with no console error.
- [ ] **Step 2:** `npx playwright test tests/e2e/readerLayout.spec.ts tests/e2e/reading.spec.ts
  tests/e2e/audio.spec.ts tests/e2e/landmarks.spec.ts`. Expected: PASS.
- [ ] **Step 3: Gates** (Global Constraints), each run to the end; `test:a11y` alone.
- [ ] **Step 4: Browser check** on `out/`: `baseline.mjs` after-run; `/surah/1`, `/surah/2`,
  `/surah/112`, `/juz/30` and the settings sheet at 375 and 1280 in three themes; `/surah/2` scroll
  and playback stay smooth (one unit re-renders per ayah change, React Profiler or render counter);
  keyboard: Tab reaches back, settings, both frame buttons, each ayah's two buttons, EndNav; focus is
  never under a bar; WebKit pass with Playwright for the rosette inside Arabic text at 24, 28, 44 px.
- [ ] **Step 5:** show the owner the result; push and open the PR only on the owner's word. PR text
  lists the measured first-ayah positions before and after.

---

# PR 4.2 Home, learning, navigation

### Task 13: Path and juz math

**Files:** Create `src/lib/progress/path.ts`; extend `src/lib/format.ts`. Tests:
`src/lib/progress/__tests__/path.test.ts`, `src/lib/__tests__/format.test.ts`.

**Interfaces (produces):**
```ts
export type ProgressMap = Record<number, { ayahsListened?: Iterable<number>; ayahsRead?: Iterable<number> }>;
export function finishedSurahCount(map: ProgressMap): number;          // every ayah of the surah in the union
export type JuzState = "done" | "started" | "none";
export function juzState(juz: number, map: ProgressMap): JuzState;    // from getJuzByNumber ranges and surahs.json counts
export function finishedJuzCount(map: ProgressMap): number;
export type PathStep = { id: "harfovi" | "tajwid" | "sure" | "hatma"; label: string; href: string; text: string; done: boolean };
export function pathSteps(input: { map: ProgressMap; lessonsCompleted: number; lessonsTotal: number }): PathStep[];
// format.ts
export const FINISHED_FORMS: PluralForms = { one: "završena", few: "završene", other: "završenih" };
export function formatLongDate(date: Date): string;                    // "srijeda, 25. novembar", own day and month names
```
Step texts: harfovi `"28 harfova"`, `done` always false, href `/harfovi`; tajwid `"2 od 5 lekcija"`,
href `/tajwid`; sure `formatCount(n, FINISHED_FORMS)` (`"4 završene"`, `"0 završenih"`), href
`/progress`; hatma `"1 od 30 džuzeva"`, href `/surahs?view=juz`.

- [ ] **Step 1: Tests.** Surah 112 with listened {1,2} and read {3,4} counts as finished; with {1,2,3}
  it does not. `juzState(30, map)`: `"none"` for an empty map, `"started"` with one ayah of surah 78,
  `"done"` only when surahs 78 to 114 are all in the union; juz 1 needs El-Fatiha 1-7 and El-Beqare
  1-141 and nothing after. An entry without `ayahsRead` does not throw. `pathSteps` with 2 of 5
  lessons, 4 finished surahs, 1 finished juz returns the four texts above; `done` is true for tajwid
  at 5 of 5. `formatLongDate(new Date(2026, 10, 25))` is `"srijeda, 25. novembar"`;
  `new Date(2027, 0, 1)` is `"petak, 1. januar"`.
- [ ] **Steps 2-4:** FAIL, implement, PASS. **Step 5:** commit `feat: path, juz and date helpers`.

### Task 14: PathSteps

**Files:** Create `src/components/progress/PathSteps.tsx`. Test: `progress/__tests__/PathSteps.test.tsx`.

**Interfaces:** `PathSteps(props: { steps: PathStep[] })`; consumes Task 13.

- [ ] **Step 1: Test.** An `ol` of four links in order Harfovi, Tedžvid, Sure, Hatma, each with its
  text visible; a done step shows a check icon inside a `bg-gold` circle and still its text; a step
  that is not done shows its number in a `border-gold` circle; no `uppercase`. The contrast pair
  `paper` on `gold` >= 3 joins `themeTokens.test.ts`.
- [ ] **Steps 2-5:** FAIL, implement, PASS, commit `feat: Tvoj put`.

### Task 15: Home

**Files:** Modify `src/app/page.tsx`, `src/app/themeInitScript.ts`, `globals.css`; create
`HomeGreeting.tsx`, `ContinueCard.tsx`, `ShortSurahsSection.tsx`; delete
`ContinueLearningSection.tsx`, `FeaturedSurahsSection.tsx`, `public/hero-bg.png`. Tests:
`themeInitScript.test.ts`, `page.test.tsx`, `home/__tests__/ContinueCard.test.tsx`,
`ShortSurahsSection.test.tsx`, `HomeGreeting.test.tsx`; `tests/e2e/home.spec.ts`.

**Interfaces (produces):** the init script sets `data-has-progress=""` on `<html>` when
`quran-learning-progress` holds `state.lastSurahNumber >= 1`; `ContinueCard` sets or removes the same
attribute in an effect when the store's value changes. CSS: `html[data-has-progress]
[data-home="first"]` and `html:not([data-has-progress]) [data-home="returning"]` are `display: none`.

- [ ] **Step 1: Tests.** Init script: sets the attribute for a stored position, not for progress with
  `lastSurahNumber: 0`, not for empty or broken JSON, and still sets theme and font. Page (static
  render): both `[data-home]` blocks exist; the first-visit block keeps today's `h1`, sentence,
  `"Počni od Fatihe"` and `"Sve sure"`; no `"Šta je u aplikaciji"`, no `backgroundImage`.
  `ContinueCard` with position El-Mulk 12 in mode `reader`: heading `"Nastavi"`, `"El-Mulk, 12. ajet"`,
  primary link `"Nastavi čitanje"` to `/surah/67?ayah=12`, quiet link `"Uči ajet po ajet"` to
  `/learn/67?ayah=12`; in mode `learning` the primary is `"Nastavi učenje"` to the learn URL and the
  quiet link `"Otvori u čitaču"`; the card has a fixed `min-h`. `HomeGreeting`: `h1` `"Selam!"`; the
  date appears only after mount. `ShortSurahsSection`: four rows; started surahs first, then 1, 112,
  113, 114; a started row shows `"Pročitano: 3 od 7 ajeta"`. No stat tiles, no `6.236`.
- [ ] **Step 2:** FAIL. **Step 3:** implement; `PathSteps` on home reads the progress store through
  selectors and `pathSteps`. **Step 4:** PASS.
- [ ] **Step 5: e2e** `home.spec.ts`: with seeded progress, the sum of `layout-shift` entries (without
  recent input) over 3 s after load is below 0.05 at 375 x 812, and `"Nastavi"` starts above 200 px;
  without progress the intro is visible and `"Nastavi"` is not.
- [ ] **Step 6:** commit `feat: home leads with Nastavi for a return visit`.

### Task 16: Learn overview

**Files:** Create `src/app/learn/page.tsx`, `src/components/learn/LearnOverview.tsx`; modify
`src/app/sitemap.ts`, `tests/e2e/a11y.spec.ts` (add `"/learn"` to `ROUTES`). Tests:
`src/app/learn/__tests__/page.test.tsx`, `sitemap.test.ts`.

- [ ] **Step 1: Tests.** `h1` `"Učenje"`; metadata title `"Učenje"`; with a stored position a card
  `"Nastavi"` whose primary link `"Nastavi učenje"` goes to `/learn/67?ayah=12`, without one a link
  `"Počni od Fatihe"` to `/learn/1`; rows linking `/harfovi` (`"28 harfova"`), `/tajwid` (lesson
  count text from `pathSteps`), `/names` (`"99 imena"`); a section `"Ajet po ajet"` with links to
  `/learn/1`, `/learn/112`, `/learn/113`, `/learn/114` (Latin and Arabic names from `surahs.json`,
  ayah counts through `formatCount`) and `"Sve sure"`. The sitemap lists `/learn`.
- [ ] **Steps 2-5:** FAIL, implement, PASS, commit `feat: learn overview page`.

### Task 17: Navigation

**Files:** Modify `MobileNav.tsx`, `Header.tsx`; delete `navDisclosure.test.tsx`; update
`MobileNavActive.test.tsx`, `mobile.test.tsx`, `layout.test.tsx`.

- [ ] **Step 1: Tests.** Tabs Početna, Sure, Učenje, Dove, Više; Učenje links to `/learn`; segments
  `learn`, `tajwid`, `harfovi`, `names` give Učenje `aria-current="page"`; `bookmarks`, `progress`,
  `search`, `settings` give Više; the current tab has `text-accent-text` and a child or pseudo-element
  bar (`data-current-bar`) of 3 px; labels `text-xs font-semibold`; the bar is `h-[var(--bar-nav)]`.
  "Više" lists, in order, Pretraga, Sačuvani ajeti, Napredak, Postavke, and none of the learning
  links. Desktop header: plain links Sure, Učenje (`/learn`), Dove (`/duas`), Napredak; no button
  with `aria-expanded` except settings.
- [ ] **Steps 2-5:** FAIL, implement, PASS, commit `feat: tab bar and header lead to the learn overview`.

### Task 18: Ayah-by-ayah learning

**Files:** Create `src/components/learn/LearnBar.tsx`, `src/lib/audio/pendingAdvance.ts`; modify
`LearnModeContent.tsx`, `src/app/learn/[surahId]/page.tsx`, `AudioPlayer.tsx`, `playerStore.ts`,
`Header.tsx` (use the `learn` kind), `globals.css`. Tests: the seven files in `learn/__tests__`,
`learn/__tests__/LearnBar.test.tsx`, `AudioPlayer.test.tsx`, `playerStore.test.ts`.

**Interfaces (produces):**
```ts
// playerStore (not persisted)
awaiting: { countdown: number | null } | null; setAwaiting: (v: { countdown: number | null } | null) => void;
// pendingAdvance.ts: the player registers how to continue; the learn bar calls it
export function setPendingHandler(fn: (() => void) | null): void;
export function continueNow(): void;
// CSS
--bar-learn: 6.5rem;  :root:has([data-learn-bar]) { --bar-player-now: var(--bar-learn); }
```
`AudioPlayer` mirrors its waiting state into `awaiting`, registers `firePending`, and on the `learn`
segment renders its bar with the `hidden` attribute (effects keep running). `LearnBar` is fixed at
`bottom-[var(--bar-nav-now)]` with `data-learn-bar`.

- [ ] **Step 1: Tests.** `LearnModeContent` renders no surah links above the ayah and no own header
  with the surah name; the ayah is not inside a `rounded-2xl border` card; Arabic `text-center` with
  the rosette. `LearnBar`: buttons `"Prethodni ajet"`, `"Pusti ajet"` / `"Pauziraj"`, `"Sljedeći
  ajet"`, the save button, a repeat button named `"Ponavljanje: isključeno"` (then `sura`, `ajet`),
  `FilterChip`s `"Riječ po riječ"`, `"Transkripcija"`, `"Prijevod"`; with `awaiting: { countdown: 3 }`
  the play button is replaced by one named `"Nastavi na sljedeći ajet"` showing `"3s"`, and a click
  calls the registered handler; with `awaiting: { countdown: null }` it shows `"Nastavi"`. Previous
  and next do not start playback when it was stopped (QA P2-2 test stays). At the last ayah: status
  `"Sura je završena. Mašallah!"` and an `EndNav` to `/learn/66` and `/learn/68`; nothing navigates
  on its own. `AudioPlayer` on segment `learn`: its region is `hidden`; on any other segment not.
  The header counter shows the learned ayah (`"12/30"`).
- [ ] **Steps 2-4:** FAIL, implement, PASS.
- [ ] **Step 5: e2e** in `tests/e2e/learnLayout.spec.ts`: on `/learn/36` at 375 x 812 the ayah
  article and every button of the learn bar are inside the viewport above the tab bar; path test:
  home, `/surah/67`, play ayah 2, "Uči ajet po ajet", next ayah, back to home: `"El-Mulk, 3. ajet"`
  and `"Nastavi učenje"`.
- [ ] **Step 6:** commit `feat: learning keeps the ayah controls on screen`.

### Task 19: Gates, screenshots, PR 4.2

- [ ] As Task 12, Steps 3 to 5, for `/`, `/learn`, `/learn/36`, `/learn/1` (last ayah), the "Više"
  list and the desktop header; both home variants in three themes.

---

# PR 4.3 Other screens

### Task 20: Progress page

**Files:** Modify `ProgressContent.tsx`, `ProgressFilter.test.tsx`, `progress/__tests__/page.test.tsx`;
create `src/components/progress/HatmaGrid.tsx` and its test.

- [ ] **Step 1: Tests.** Order: `h1`, `PathSteps`, one line `"Započete sure: 2"`, `"Ajeti: 14"`,
  `"Slušanje: 12 min"` (middle dots between, `aria-hidden`), the surah section, `"Hatma"`. Filters are
  `FilterChip`s in a group named `"Filter sura"`; with started surahs the default filter is
  `"Započete"`, otherwise `"Sve"`; rows are `border-t` list rows with `"3 od 7 ajeta"` from the
  union and `"Završeno"` in `text-success-text` with a check. `HatmaGrid`: 30 links to `/juz/N` in a
  list named `"Hatma"`, each named `"3. džuz, završen"`, `"3. džuz, u toku"` or `"3. džuz, nije
  započet"`, the state also drawn by shape (gold fill and check, gold border, plain border). No
  `"6.236"`, no tile grid, no `uppercase`.
- [ ] **Steps 2-5:** FAIL, implement, PASS, commit `feat: progress as path, totals and hatma`.

### Task 21: Allahova lijepa imena

**Files:** Create `NameRow.tsx`, `useNamesPlayback.ts`; modify `NamesPageContent.tsx`,
`names/page.tsx`; delete `NameCard.tsx` (its test becomes `NameRow.test.tsx`); add
`useNamesPlayback.test.tsx`.

**Interfaces (produces):**
```ts
export function useNamesPlayback(total: number): {
  playingIndex: number | null; sequence: boolean; error: boolean;
  playOne: (index: number) => void; playAll: () => void; stop: () => void;
}; // one HTMLAudioElement, preload "none"; in a sequence "ended" starts index + 1 and stops after `total`; "error" stops and sets error
```

- [ ] **Step 1: Tests.** The list has 99 `button` rows of `min-h-14`, each named
  `"Er-Raḥmān, Premilostivi, pusti"` style (transcription, meaning, verb; values from
  `lib/names/data`), Arabic in `[lang="ar"]`; a tap calls `playOne`; the playing row has
  `bg-highlight` and `aria-pressed="true"`. `"Pusti redom"` starts at 1; while a sequence runs the
  button reads `"Zaustavi"`; on `ended` the next index plays and `scrollIntoView` is called with
  `block: "nearest"`; after 99 it stops. On an `error` event: `playingIndex` null, `sequence` false,
  a `role="status"` line `"Snimak se nije učitao. Provjeri internet i pokušaj ponovo."`.
- [ ] **Steps 2-4:** FAIL, implement, PASS. **Step 5:** browser check: at 375 x 812 at least 8 names
  on the first screen. **Step 6:** commit `feat: names as a list that plays in order`.

### Task 22: Tajwid list, lesson end, quiz

**Files:** Modify `TajwidLessonCard.tsx`, `src/app/tajwid/page.tsx`, `src/app/tajwid/[lessonId]/page.tsx`,
`TajwidQuiz.tsx` and their tests.

- [ ] **Step 1: Tests.** The lesson list is an `ol` of rows: number, title, subtitle, and the state
  as text with today's words (`"Završeno"` with the quiz score, `"U toku"`, `"Nije započeto"`); no rule
  chip, no `uppercase`, no `shadow`. The lesson page ends with `EndNav` `"Susjedne lekcije"` (`"Prethodna lekcija"`,
  `"Sljedeća lekcija"`, `"Sve lekcije"`) and no `rounded-full` link; the kicker `"Tedžvid lekcija"`
  has no `uppercase`. Quiz: the chosen option carries `SELECTED_CLASSES`; texts and the announced
  result are unchanged (existing quiz tests green).
- [ ] **Steps 2-5:** FAIL, implement, PASS, commit `feat: lessons as a numbered list with end navigation`.

### Task 23: Saved ayahs, search, duas, surah list

**Files:** Modify `BookmarksContent.tsx`, `src/app/search/page.tsx`, `DuaCard.tsx`,
`DuasPageContent.tsx`, `SurahsPageContent.tsx`, `DailyDuaSection.tsx` and their tests.

- [ ] **Step 1: Tests.** Each of the three screens renders its text through `AyahText` inside a
  `rounded-card border border-line bg-surface` article: Arabic first and right aligned, then
  transcription where the data has it, then the translation left aligned. `DuaCard` has no
  `"Dova iz Kur'ana"` label and no `uppercase`; its play button is named as today. Bookmarks keep
  the note, the dialog and the sort select. Search keeps `mark` highlighting and the listbox roles.
  The Sure / Džuzevi switch is a `ChoiceGroup` named `"Pregled"`; choosing "Džuzevi" still updates
  `?view=juz` (existing test).
- [ ] **Steps 2-5:** FAIL, implement, PASS, commit `feat: one ayah block on saved, search and duas`.

### Task 24: Shell padding, back to top, guards closed

**Files:** Modify `AppShell.tsx`, every page that adds its own outer padding (`grep -rn "px-4 py-8\|px-4
pb-24\|max-w-6xl px-4" src/app src/components`), `BackToTop.tsx`, remaining files with
`duration-150|200|300`, `hover:scale-`, local `function *Icon(`; `selectedStyle.test.ts`,
`layoutTokens.test.ts`; create `tests/e2e/backToTop.spec.ts`.

- [ ] **Step 1: Tests.** `layoutTokens.test.ts` also fails on `duration-\d+`, `hover:scale-` and
  `active:scale-` in `src`. `selectedStyle.test.ts`: `LEGACY` is empty. A scan test: no `.tsx` outside
  `ui/icons.tsx` defines `function \w+Icon(`. `AppShell`: `main` has `px-4 sm:px-6 lg:px-8` and
  `py-6 md:py-8`; no page component has an outer `px-4`. e2e: at the end of `/surah/112` and of
  `/tajwid/mad-duljenje` at 375 x 812 the back-to-top button's box intersects no `a` or `button`.
- [ ] **Steps 2-4:** FAIL, implement (the button sits at `bottom-[calc(var(--bars-bottom)+1rem)]`;
  `EndNav` gets `mb-16` under 48rem), PASS; rerun `readerLayout.spec.ts` (the first-ayah budget
  must still hold with the new shell padding). **Step 5:** commit
  `feat: one page padding; guards cover all of src`.

### Task 25: Manifest screenshots, docs, PR 4.3, production

- [ ] **Step 1:** `npm run build`, serve `out/` with `serve-out.mjs`, run `screenshots.mjs`
  (`public/screenshots/narrow-surah.webp` 780 x 1688, `wide-home.webp` 1280 x 800); `manifest.test.ts`
  green; update `sizes` only if they changed.
- [ ] **Step 2:** `docs/superpowers/specs/2026-11-25-phase-4-layouts-design.md`: a closing section
  "Built differently" for anything that shipped other than specified. Propose to the owner (do not
  add silently) the `CLAUDE.md` lines: bar offsets only through `--bars-bottom`; layers only through
  the `z-*` token utilities; selected state only through `ui/selected.ts`; the reader's first-ayah
  e2e test.
- [ ] **Step 3:** gates, before/after screenshots of every route in `baseline.mjs` in three themes,
  axe on all routes; show the owner; push and PR on the owner's word.
- [ ] **Step 4:** after each merge: production pages of that PR, the 404 page, and the service worker
  with Playwright Chromium (`verify-csp.mjs` from `section-7-tools`); update the final report's Plan
  tab and the memory note only when the owner asks.
