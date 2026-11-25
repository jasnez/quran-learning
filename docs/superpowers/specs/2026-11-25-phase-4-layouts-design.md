# Phase 4 "ekrani": design

Date: 2026-11-25. Status: approved by the owner on 2026-11-25, with the proposals for O1, O2 and O3
(three PRs; the Harfovi step shows "28 harfova" and is never marked finished; the four left-out
handoff items stay out). Mockups shown before the approval:
https://claude.ai/artifact/BPb3izsjJvLkYoGzCGnePa.

Sources: final report "Finalni izvjestaj i plan" (tab Plan, Phase 4), developer handoff "Tezhib u
kodu" (sections Prostor i pokret, Ornament, Komponente, Ekrani), design system "Tezhib"
(component READMEs), design critique "Dvadeset ekrana pod lupom" (patterns 1, 2, 3, 5, 6), UX copy
deck, `docs/glas.md`, and the Phase 2 and Phase 3 specs, which deferred layouts to this phase.

## Intent

Reading comes before controls. Phases 1 to 3 changed the name, voice, colors, typefaces and tajwid
without moving anything on screen. This phase moves things: every screen gets one main thing, the
Quran text becomes the strongest element in the reader, and everything a screen is built from comes
from one small set of shared components, so "selected", "ayah" and "navigate to the next one" look
and behave the same everywhere. After it the app goes to the owner and two friends (Phase 5).

## Where the app is today (measured on a production build of main 03bfb0c)

Served from `out/` like Vercel, Chromium, light theme, default settings, no stored progress.

| Measure | 375 x 812 | 1280 x 800 |
|---|---|---|
| Top of the first ayah card, `/surah/112` | 844 px (below the screen) | 782 px |
| First line of Arabic of the first ayah | 921 px | 867 px (below the screen) |
| Entries into settings visible on the first screen | 1 | 3 |
| Blocks above the first ayah | header, surah card, 4 pills in 2 rows, sticky surah bar, legend, "Pracenje uz zvuk" | header, surah card, pills, sticky surah bar, toolbar, legend |
| `/learn/36`: play and next-ayah controls | cut by the tab bar | visible |
| `/names`: page height | 29,548 px (2 names per screen) | 10,582 px |
| `/progress`: page height | 10,014 px | 9,567 px |

"Selected" is drawn in seven ways today: accent wash without a border (reader toolbar groups, learn
options, Sure/Dzuzevi switch, ayah list), accent wash with an accent border (toolbar chips, theme and
tajwid radios, quiz option), solid accent (settings buttons, progress filter), accent track (switch),
a wide custom switch with a play icon (player "Pusti sljedecu suru"), a round wash button (player
repeat), and color plus stroke weight only (tab bar).

## Goals

1. Reader: the first ayah (Arabic, transcription and translation) is fully visible on the first
   screen at 375 x 812 and at 1280 x 800. The surah name is in the header. One entry into reading
   settings. Ayahs flow as text with a rosette, not as cards. Previous and next surah are at the end.
2. Home: someone who returns continues with one tap; a first visit gets the intro instead. No
   advertising for the app inside the app.
3. Learning: the Ucenje tab opens an overview that leads to the last place, not always to El-Fatiha.
   In ayah-by-ayah learning the controls for the ayah are always on screen.
4. One selected style, one ayah unit, one end-of-content navigation, one icon set, on every screen.
5. Bar heights, layers and motion are tokens; nothing positions itself with its own magic number.

## Non-goals

- New functions that the handoff sketches but the plan does not list (see O3): the "Vise" menu on an
  ayah (share, copy), the switch "Prati ajet koji se slusa", the hizb sign (the ayah data has no hizb
  field), a link-preview image per surah.
- Everything on the report's "Kasnije" list: harfovi with sound, sharing as an image, Ramadan hatma,
  hijri date, folk names in search.
- Quran text, transcription, translation, lesson text, tajwid colors and typefaces: unchanged.
- URLs, storage keys and the shape of stored data: unchanged. `viewport-fit=cover`: not now (needs a
  check on a real iPhone, which nobody has done yet).
- The unrouted test mode (`src/app/_test`, `src/components/test`).

## Anti-goals (a failure even if it "works")

- The first ayah slipping below the first screen again: an e2e test holds it.
- A second way into settings appearing on the reader, or a stored setting or progress being lost.
- A hydration error on unknown URLs (the static `404.html`): everything in the header and tab bar
  that depends on the route keeps reading `useSelectedLayoutSegment()`.
- Every ayah re-rendering while audio plays (QA P1-9): the ayah unit stays memoized with per-unit
  store selectors.
- The home page jumping after load for someone who returns.
- New axe exceptions, or color as the only sign of a state.
- More Vercel deployments than needed: the Hobby team is close to its 10 GB limit.

## Constraints

- Next.js 16 static export, React 19, Tailwind CSS 4, zustand. No new dependencies. No new external
  source, so `vercel.json` (CSP) does not change.
- Baseline Widely available. `:has()` only where the page still works without it.
- Per PR: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:a11y`;
  screens checked at 375 and 1280 px in three themes on `out/` served with a `404.html` fallback;
  keyboard pass. A PR branch is pushed once, when all of that is green locally.
- Numbers, plurals and dates only through `src/lib/format.ts`. Copy follows `docs/glas.md`.

## Approaches considered

### How the work is cut

A. Rebuild in place from shared components, three PRs by screen group (chosen). The components come
   first, inside the reader PR, because the reader uses nearly all of them; later PRs only assemble.
   Cost: PR 4.1 is the largest. See O1 for the PR count.
B. One PR for everything. Two deployments instead of six, but a diff nobody can review, and a fault
   in the reader would hold back the home page.
C. New screens next to the old ones behind a switch. Rejected: a static export has no server-side
   switch, the handoff says existing components change rather than get a twin, and both versions
   would have to pass every gate.

### How the header learns which surah is open

A. The global header changes its content by route segment, and takes the surah from the route
   parameter and `surahs.json` (chosen). The name is in the static HTML, so nothing flashes, and on
   `404.html` the segment is not `surah`, so the brand header renders as today.
B. Keep a second sticky bar under the header (today). Rejected by the handoff: it costs 48 px above
   the first ayah and is the reason for two settings entries.
C. A parallel route slot for the header. Rejected: untested with the static `404.html` fallback, the
   exact place where hydration broke before (QA P0).

### How the home page knows a visit is a return, before paint

A. The inline script that already sets the theme also sets `data-has-progress` on `<html>` when the
   stored progress has a last position; CSS shows the matching variant (chosen). Both variants are in
   the static HTML; the "Nastavi" card has a fixed height and gets its text after hydration.
B. Decide after hydration (today). Rejected: someone who returns sees the intro first, then the page
   jumps.

## Decisions

D1 to D12 are my calls from the handoff and the code; O1 to O3 at the end need the owner.

### D1. Tokens: bars, layers, motion

In `globals.css`, with a Vitest test for the values, as for the color tokens:

| Token | Value | Replaces |
|---|---|---|
| `--bar-header` | 3rem | `h-12`, `pt-12`, `--app-header-offset` |
| `--bar-nav` | 3.5rem | `min-h-14`, `pb-14`, `bottom-14` |
| `--bar-player` | 4rem (70 px today) | `max-h-[70px]`, `pb-[70px]`, `bottom-[78px]` and others |
| `--bar-learn` | height of the learn bar (D8) | new |
| `--bars-bottom` | sum of the bottom bars now on screen | 16 hand-written `bottom-*` offsets and four `scroll-padding` values |
| `--z-bars` / `--z-player` / `--z-infobar` / `--z-toast` | 40 / 41 / 45 / 50 | `z-10` to `z-[60]` spread over 13 files |
| `--duration-press` / `--duration-sheet` | 150 ms / 200 ms | `duration-150`, `-200`, `-300` |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | `ease-out` |

`--bars-bottom` is set in CSS from what is in the page (tab bar under 48rem, `[data-audio-player]`,
the learn bar), as `scroll-padding-bottom` is today. The toast, the rule bar, the install prompt, the
offline notice and the back-to-top button all sit at `--bars-bottom` plus a gap. Bottom bars add
`env(safe-area-inset-bottom)`, which is 0 until `viewport-fit=cover` is turned on. A source test
fails on a raw `z-` class outside the token utilities, like the palette guard. `hover:scale-*` goes.

### D2. Shared components (`src/components/ui`, `src/components/quran`)

Existing components are changed where one exists; none gets a twin.

| Component | From | What it is |
|---|---|---|
| `Button` | `Button.tsx` | Variants primary, secondary, quiet, danger; 44 and 36 px; `rounded-control`, no pill (pills are for choices). One primary per screen area. |
| `ChoiceGroup` | new | `fieldset`, `legend`, native radios; sunken track, pill options. For 2 to 4 options. |
| `FilterChip` | new | `button` with `aria-pressed`; for filters and on/off display options. |
| `Switch` | from `SettingsPanel` | 44 x 26, `role="switch"`, the whole row clickable through its label. |
| `Rosette` | new | Ayah number in the eight-pointed rosette; ornament only, `aria-hidden`. |
| `SurahFrame` | `SurahHeader.tsx` | Title frame of a surah (gold border and outline), no navigation, no progress bar. |
| `AyahUnit` | `AyahCard.tsx` | One ayah: Arabic with rosette, transcription, translation, actions. Variants: flow, card, learn. |
| `EndNav` | new | Two quiet cards (previous left, next right) and one "all" link. Surahs, juz and lessons. |
| `PathSteps` | new | "Tvoj put": four steps with a number in text (D9). |
| `NameRow` | `NameCard.tsx` | One of the 99 names as a list row that plays on tap. |
| icons | 10 files with local SVG icon functions, plus Lucide | One `icons.tsx`: Lucide at 1.75 stroke everywhere, plus the few filled shapes Lucide lacks (play, pause, stop). The handoff's own icons for Ucenje and Dove read poorly at 24 px (seen on the mockups), so the tab bar keeps today's Lucide icons; own icons wait until they are redrawn. |

**The selected style.** One look everywhere: `accent-wash` fill, `accent-text` text and a 1.5 px
`accent-text` border. The handoff gives the choice pill no border; measured, the wash against its
sunken track is 1.01:1 (light), 1.02:1 (sepia), 1.32:1 (dark), so the pill would be invisible as a
shape and the text color the only sign. The border is 9.5:1, 7.8:1 and 10.6:1 on the track. The
contrast test gets these pairs. The tab bar's active tab is `accent-text` plus a 3 px bar on top
(shape, not only color). A source test allows `aria-pressed` and `type="radio"` styling only in the
shared components and a short named list (bookmark toggle, quiz option).

### D3. Header

On `/surah/[n]`, `/juz/[n]` and `/learn/[n]` the header shows where you are instead of the brand:

```
375:   [<]  El-Ihlas  (ar)            1/4   [gear]
1280:  Elif  |  [<] El-Ihlas (ar)  1/4      Sure  Ucenje  Dove  Napredak  | [search] [saved] [gear]
```

- Back goes to `/surahs` (from a juz to `/surahs?view=juz`, from learning to the surah's reader).
- The counter is the ayah at the top of the screen (reader) or the ayah being learned. One observer
  writes it to a small non-persisted store that only the header and the desktop ayah list read.
- The gear is the only way into settings on these screens. On a phone the search icon gives way to it
  (search moves into "Vise", D7).
- The header still slides away on scroll down and never while it holds focus. The sticky surah bar
  (`SurahReaderStickyHeader`) and the desktop toolbar (`ReaderToolbar`) are removed.
- Everywhere else the header is as today, except that "Ucenje" and "Dove" become plain links (D7).

### D4. Reader (`/surah/[n]`)

```
375 x 812                                   1280 x 800
+-----------------------------------+       header 48
| header 48                         |       +--------+  +------------------------------+
| surah frame          <= 160       |       | Ajeti  |  |   surah frame                |
|  (ar) / El-Ihlas  Ihlas           |       |  1     |  |   [Pusti suru] [Uci ajet..]  |
|  4 ajeta, mekanska sura, str. 604 |       |  2     |  |   ayah 1 ...             (1) |
| [Pusti suru] [Uci ajet po ajet]   |       |  3     |  |   ayah 2 ...             (2) |
| ayah 1: arabic ............ (1)   |       |  4     |  |   ...                        |
|   transkripcija                   |       +--------+  +------------------------------+
|   prijevod                        |        14rem        reading column, 42rem
|   [play] [save]          str. 604 |
| --------------------------------- |
| ayah 2 ...                        |
| tab bar 56                        |
+-----------------------------------+
```

- **Frame**: `h1` with both names (Arabic in `span lang="ar"`, then the Latin name and the common
  name), one meta line. Under it two buttons: primary "Pusti suru", secondary "Uci ajet po ajet". If
  there is progress, one line of text under the buttons ("Procitano: 3 od 7 ajeta"); no bar.
- **Ayah unit, flow variant**: no card. A 1 px `line` divider, 20 px above and below. Arabic right
  aligned with the rosette at the end of the text; transcription; translation left aligned, at most
  42rem. Actions under the text, always visible: play or pause, save, and the mushaf page where a
  page starts. The `article` is named "N. ajet" by a visually hidden element; the rosette is
  `aria-hidden` and is not selected with the text.
- **Playing ayah**: `highlight` background with 12 px corners, rosette filled gold at 25%, the pause
  icon, and the text "Slusa se". The gold line on `highlight` is 2.8:1 in the light theme; it is
  ornament, and the number inside is ink at 13.8:1.
- **Desktop**: one reading column next to the ayah list (14rem), as the handoff says. Today's two
  columns (Arabic left of the translation) go: the unit reads the same on every width.
- **Above the first ayah there is nothing else.** The settings sheet (D5) takes the toolbar and the
  "Pracenje uz zvuk" strip. The legend "Sta znace boje" moves into the sheet next to the tajwid
  choice; a tap on a colored letter still names the rule (Phase 3), and the one-time notice about
  the new colors fires from the reader instead of from the legend.
- **End**: after the last ayah, `EndNav` (previous surah, next surah, "Sve sure"). The juz divider
  inside a surah stays, as a quiet centered link.
- **Juz reader** (`/juz/[n]`): the same unit; each surah segment starts with a small frame; the
  juz links move to an `EndNav` at the end.

### D5. Reading settings: one sheet

The existing settings dialog stays (the critique lists it under what works). Its first group becomes
"Citanje": letter size, script (Moderno / Klasicno), transcription, translation, tajwid (Iskljuceno /
Boje / Boje i linije) with the legend under it, following the sound (Po ajetu / Rijec po rijec),
theme. Then "Zvuk" and the rest as today. Choices use `ChoiceGroup`, on/off uses `Switch`; group
titles lose their capitals. Stored fields and their values do not change; word-by-word stays in the
player store.

### D6. Home (`/`)

```
returning                              first visit
header 48                              header 48
Selam!  srijeda, 25. novembar          Uci Kur'an od elifa do hatme
+-- Nastavi ---------------------+     Arapski tekst, transkripcija ... ajet po ajet.
| El-Mulk, 12. ajet              |     [Pocni od Fatihe]  [Sve sure]
| Citanje, prije 3 sata          |     Tvoj put (what the app holds, no counts yet)
| [Nastavi citanje]  Uci ajet..  |     Dova dana
+--------------------------------+     Kratke sure
Tvoj put  (1) (2) (3) (4)
Dova dana (ayah unit, card)
Kratke sure (4 rows)
```

- Returning: "Nastavi" starts above 200 px. One primary button, which continues in the mode last
  used; the other mode is a quiet link. No intro, no stat tiles, no "Sta je u aplikaciji".
- First visit: today's approved headline, sentence and two buttons, without the background image
  (`public/hero-bg.png` is deleted). "Tvoj put" doubles as the overview of what is in the app.
- The date is formatted by a new helper in `format.ts` from its own Bosnian day and month names
  (Chrome has no "bs" data), on the client only, like the daily dua.
- "Kratke sure" are four list rows: started surahs first, then 1, 112, 113, 114, as today.

### D7. Navigation

- Tab bar: Pocetna, Sure, Ucenje, Dove, Vise; 56 px; icon 24, label 12 px semibold; the active tab
  as in D2. Ucenje links to a new page `/learn`.
- `/learn` (new, static, in the sitemap): `h1` "Ucenje"; "Nastavi" with the last position opened in
  ayah-by-ayah learning, or "Pocni od Fatihe" when there is none; then rows: Harfovi i izgovor,
  Tedzvid lekcije (with "2 od 5"), Ajet po ajet (four short surahs and "Sve sure"), Allahova
  lijepa imena. The tab always opens this page: a tab that lands somewhere else each time is hard to
  learn, and "Nastavi" is the first thing on it.
- Active tab: `learn`, `tajwid`, `harfovi`, `names` mark Ucenje; `bookmarks`, `progress`, `search`,
  `settings` mark Vise.
- "Vise" holds Pretraga, Sacuvani ajeti, Napredak, Postavke. The three learning links leave it.
- Desktop header: Sure, Ucenje, Dove, Napredak as plain links, then search, saved, settings. The two
  dropdowns go: their targets are on `/learn` and `/duas`.

### D8. Ayah-by-ayah learning (`/learn/[n]`)

```
[<]  Ja-sin  (ar)      12/83  [gear]      header variant (D3); back opens the reader
        arabic, centered, 36 / 44
        transkripcija
        prijevod
+--------------------------------------+
| [prev]  [ play ]  [next]      [save] |   learn bar, fixed above the tab bar
| Ponavljanje: sura  Transkripcija ... |
+--------------------------------------+
tab bar
```

- No surah navigation above the ayah. At the last ayah: "Sura je zavrsena. Masallah!" and `EndNav`
  to the neighbouring surahs. Learning still stops at the end of a surah (owner's decision).
- One bottom bar, not two: on this screen the learn bar is the player. It keeps everything both have
  today: previous and next ayah (which do not start the sound on their own, QA P2-2), play and
  pause, the "Nastavi" countdown between ayahs, repeat, word by word, transcription, translation,
  save. The global player bar is not shown here; the audio logic it owns keeps running.
- The legend leaves this screen too (it is in the sheet).

### D9. "Tvoj put" and progress (`/progress`)

Four steps, each a link, with the number always in text; a finished step is filled gold with a
check. Reading and listening count together: an ayah counts when it was read (2 s on screen, as
today) or heard. Nothing changes in storage; the union is computed when shown.

| Step | Link | Text | Finished when |
|---|---|---|---|
| Harfovi | `/harfovi` | see O2 | see O2 |
| Tedzvid | `/tajwid` | "2 od 5 lekcija" | 5 of 5 lessons completed |
| Sure | `/progress` | "4 zavrsene" | all 114 |
| Hatma | `/surahs?view=juz` | "1 od 30 dzuzeva" | every ayah of all 30 juz |

`/progress`: `h1`, "Tvoj put", one line of totals, the surah list (filters as `FilterChip`, rows not
cards, "Zapocete" first when there are any), then "Hatma": 30 cells, one per juz, each a link, with
its state in text for screen readers. "30 od 6.236 ajeta" and the four tiles go, here and on home.

### D10. The other screens

- **Allahova lijepa imena**: `NameRow` list, at least 8 names on the first phone screen. A tap plays
  the name. "Pusti redom" on top plays 1 to 99 through one audio element; the playing row gets
  `highlight` and stays in view; the button becomes "Zaustavi". Same audio files as today.
- **Tedzvid**: the lesson list becomes numbered rows with the state in text (no rule chip that
  wraps). A lesson ends with `EndNav` (previous lesson, next lesson, "Sve lekcije"). Quiz options use
  the selected style; behavior and texts as today.
- **Sacuvani ajeti, Pretraga, Dove**: the card variant of the ayah unit (same order and type roles as
  in the reader; only the actions differ). The label "Dova iz Kur'ana" in capitals goes.
- **Sure**: the Sure / Dzuzevi switch becomes a `ChoiceGroup`; rows keep today's layout.
- **Player bar**: 64 px, main button `accent`; repeat (three options) and "Pusti sljedecu suru"
  (switch) move into "Vise opcija zvuka" on every width.
- **Back to top**: sits on `--bars-bottom`; at the end of a page it never covers a link (checked by
  bounding boxes in an e2e test on a surah and a lesson).
- Page padding: one rule in the shell (16 / 24 / 32 px sides; 32 / 48 px between sections); pages
  stop adding their own second padding, which is part of why the reader starts so low today.

### D11. Copy (new or changed strings; the owner approves the wording)

Shown without Bosnian letters here; in the app with them (c, s and z with their diacritics).

| Where | Text |
|---|---|
| Surah frame, meta | "4 ajeta, mekanska sura, str. 604" (or "medinska sura") |
| Surah frame, buttons | "Pusti suru" (today "Pusti cijelu suru"), "Uci ajet po ajet" |
| Surah frame, progress | "Procitano: 3 od 7 ajeta" |
| Header counter, for screen readers | "1. ajet od 4" |
| End of surah | "Prethodna sura", "Sljedeca sura" (small, above the name), "Sve sure" |
| End of lesson, of juz | "Prethodna lekcija", "Sljedeca lekcija", "Sve lekcije"; "Prethodni dzuz", "Sljedeci dzuz", "Svi dzuzevi" |
| Home, returning | "Selam!", "Nastavi", "Nastavi citanje" or "Nastavi ucenje", "Tvoj put", "Kratke sure" |
| Tvoj put | "Harfovi", "Tedzvid", "Sure", "Hatma"; "2 od 5 lekcija", "4 zavrsene", "1 od 30 dzuzeva" |
| Progress, totals | "Zapocete sure: 2", "Ajeti: 14", "Slusanje: 12 min" (one line, middle dots between them as today) |
| Progress, hatma | "Hatma", "3. dzuz, zavrsen" / "u toku" / "nije zapocet" |
| `/learn` | "Ucenje", "Nastavi", "Pocni od Fatihe", "Ajet po ajet" |
| Names | "Pusti redom", "Zaustavi" |
| Settings group | "Citanje" |

The handoff's draft says "Slusaj suru" and "Slusaj 5. ajet"; the copy deck and `docs/glas.md`, which
shipped, say "Pusti". I keep "Pusti", so no existing button changes its name.

### D12. Tests that come with it

- e2e: the first ayah is inside the screen above the bottom bars at 375 x 812 and 1280 x 800 on
  `/surah/1`, `/surah/36`, `/surah/112` (default settings; also with stored progress); exactly one
  settings entry on the reader; on `/learn/36` at 375 x 812 the ayah and every control of the learn
  bar are inside the screen, above the tab bar; home, then surah, then learning, then back on home
  "Nastavi" shows that ayah; the back-to-top check from D10.
- Vitest: token values; contrast of the selected border and of the gold check; the `z-` and
  selected-style source guards; `ChoiceGroup` (radios, arrow keys), `Rosette` (hidden from the
  accessibility tree), `AyahUnit` (name, actions with the ayah number), `PathSteps` and hatma math
  (union of read and heard; juz boundaries); the date helper; the sitemap test with `/learn`.
- axe: `/learn` joins the routes; no new exception.
- Stored settings, progress and bookmarks in today's shape still load (existing tests stay green).

## PRs

Cut from `main` one after another; the next branch is pushed only after the previous PR is merged.

1. **4.1 Reader**: D1, D2 (all components the reader needs), D3, D4, D5, the player bar from D10.
   Done when: the e2e first-ayah and one-entry tests pass; screenshots of `/surah/1`, `/surah/2`,
   `/surah/112`, `/juz/30` and the settings sheet at both widths in three themes.
2. **4.2 Home, learning, navigation**: D6, D7, D8, `PathSteps` from D9.
   Done when: the home, surah, learning, continue path passes as an e2e test; no layout shift on home
   for a returning visit (measured with stored progress).
3. **4.3 Other screens**: the rest of D9 and D10, the source guards switched on for all of `src`,
   new manifest screenshots (`public/screenshots`, with `section-7-tools`), `docs` and `CLAUDE.md`.
   Done when: before and after screenshots of every screen; the axe check on all routes.

After each merge: production is checked (the pages of that PR, the 404 page, the service worker with
Playwright Chromium).

## Left to the builder

- Exact paddings inside the budget (frame at most 160 px on a phone; first ayah on the first screen).
- Whether the rosette is 2rem or scales with the Arabic size (decided by the browser check at 24 to
  44 px), and how it is drawn (one SVG symbol or a CSS mask); checked on `/surah/2` for speed.
- How the learn bar and the player share their logic (D8), as long as one bar is shown.
- File and test names; whether `AyahCard` is renamed (if so, as its own `refactor:` commit).
- The Tailwind 4 form of the tokens (`@theme` names versus plain variables).

## Owner's answers (2026-11-25: the proposal in each)

- **O1. How many PRs.** Three (my proposal: six deployments), two (reader and learning together, then
  everything else: four deployments, larger reviews), or the plan's four (eight deployments).
- **O2. The Harfovi step in "Tvoj put".** The app stores nothing about harfovi; the page is a table.
  (a) The step shows "28 harfova" and links to the page, and is never marked finished (my proposal:
  honest, and it changes by itself when harfovi with sound arrive). (b) Three steps, without
  Harfovi, until that feature exists. (c) Mark it finished once the page was opened (I advise
  against: opening a page is not learning the letters).
- **O3. Four handoff items I left out** because they are new functions, not layout: the "Vise" menu
  on an ayah (share, copy, learn this ayah), the switch "Prati ajet koji se slusa", the hizb sign,
  a link-preview image per surah. Say if any of them should come in now.

## Calls to check while reading

1. Desktop reader loses the side-by-side translation (D4), as the handoff says.
2. The legend moves into the settings sheet (D4, D5); nothing but the frame and two buttons stands
   above the first ayah. The alternative is one quiet line under the buttons (about 40 px).
3. The selected pill gets a border the handoff does not draw (D2), for contrast.
4. The Ucenje tab always opens `/learn` (D7); the header's two dropdowns go.
5. In learning the player bar is replaced by the learn bar (D8).
6. Reading and listening count together in "Tvoj put", progress and the surah frame (D9).
7. "Pusti", not "Slusaj" (D11); the first visit keeps "Pocni od Fatihe", not "Pocni od harfova".
8. On a phone the reader header has no search icon; search is in "Vise" (D3, D7).

## Risks

- Real Safari and a real iPhone are still unchecked (as in Phase 3); WebKit through Playwright is.
- If Vercel refuses a deployment for storage, old deployments have to be deleted by the owner
  before the PR can be previewed or merged.
- The reader PR touches the most used screen: the first-ayah and re-render checks run on `/surah/2`
  (286 ayahs) before it is shown.
