# Phase 3: tajwid (design)

Date: 2026-11-23. Status: approved by the owner on 2026-11-23, with option A for D3.

Sources: final report "Finalni izvjestaj i plan" (tabs Plan, Boje tedzvida, Lekcije), lesson text for
review, handoff "Tezhib u kodu" (component "Traka pravila"), `docs/glas.md`, `docs/TAJWID.md`.

## Intent

The tajwid colors follow the Dar al-Maarifa tajwid mushaf, by what the voice does: red = lengthen
(medd), green = through the nose (gunne and ihfa, the same green), blue = bounce (kalkala). Red and
green look nearly the same to people with deuteranopia, so two things are a condition of the scheme,
not extras: the rule name on tap, and the option "Tedzvid: boje i linije" that adds a line style per
rule. The five lessons get the reviewed new text. Screen layouts do not change (Phase 4).

## Goals

- One source of tajwid colors: `src/lib/quran/tajwidStyles.ts`, built only from the `--tj-*` tokens.
- Every tajwid color reaches 3:1 on every background it is drawn on (large Arabic text, lines),
  and 4.5:1 where it colors small text, in all three themes.
- A tap or click on a colored letter shows the rule name, one sentence and a link to the lesson.
- Keyboard and screen-reader users reach the same rule names and lessons through the legend.
- Existing stored settings and progress load unchanged.

## Non-goals and anti-goals

- No new rules or shades (kind of medd, shades of red, gray for silent letters, heavy ra): the
  "Kasnije" list, each a separate decision. The ayah data is not regenerated.
- No layout, navigation or reader redesign (Phase 4).
- Anti-goal: thousands of tab stops or screen-reader announcements in the ayah text.
- Anti-goal: a tap on a word that used to jump the recitation and now silently does something else.
- Anti-goal: lesson text that nobody reviewed.

## Constraints

- Baseline Widely available; no new dependencies. The bar uses no Popover API (handoff).
- Storage keys `quran-learning-settings` and `quran-learning-progress`, lesson slugs and ids stay.
- Gates per PR: typecheck, lint, full `npm test`, `next build`, `npm run test:a11y`; screenshots at
  375 px and desktop in three themes; keyboard pass.

## Measured contrast (new colors)

Ratios of each color against every background where tajwid text or lines appear. Lowest per theme:
light 3.87 (green on `--mark`), sepia 4.00 (blue on `--mark`), dark 4.56 (red on `--mark`).

| Theme | Color | paper | surface | surface-sunken | highlight | mark |
|---|---|---|---|---|---|---|
| light | medd #B3261E | 5.95 | 6.43 | 5.40 | 5.27 | 4.93 |
| light | green #2E7D32 | 4.67 | 5.04 | 4.24 | 4.13 | 3.87 |
| light | kalkala #0E72A8 | 4.79 | 5.18 | 4.35 | 4.24 | 3.97 |
| sepia | medd #A3241B | 6.10 | 6.61 | 5.52 | 5.32 | 5.03 |
| sepia | green #2B6E2F | 5.11 | 5.53 | 4.62 | 4.45 | 4.21 |
| sepia | kalkala #0B6A9C | 4.85 | 5.25 | 4.39 | 4.22 | 4.00 |
| dark | medd #FF8A80 | 8.08 | 7.41 | 8.36 | 6.62 | 4.56 |
| dark | green #81C784 | 9.17 | 8.41 | 9.48 | 7.51 | 5.17 |
| dark | kalkala #64B5F6 | 8.33 | 7.64 | 8.62 | 6.83 | 4.70 |

Consequences: the playing ayah in `AyahCard.tsx` gets the full `bg-highlight` back (lowest 4.13:1);
small text in a rule color (lesson card chip) passes 4.5:1 on `surface` and `paper` in every theme, so
the separate "label" class map with darker shades is no longer needed.

## Decisions

### D1. Ihfa token (my call)

`--tj-ihfa` stays as its own token with the same value as `--tj-gunne` in each theme (#2E7D32,
#2B6E2F, #81C784). Reason: the rule-to-token map stays one to one, a later decision to split them
again touches only `globals.css`, and the token test parser keeps reading plain hex values. A test
asserts ihfa equals gunne in every theme, so the two cannot drift apart by accident.

### D2. Colors in code (my call)

`tajwidRuleClasses` maps each rule to `text-tj-*` only, no `dark:` variants; `normal` stays
`text-foreground`. `tajwidRuleLabelClasses` is removed (callers use `tajwidRuleClasses`). A second map
`tajwidRuleLineClasses` (PR 3.2) holds the underline style per rule. Retired in PR 3.1: the
`@custom-variant dark` line and the `.dark` class (ThemeProvider and the theme init script; the
`data-theme` attribute stays), the sepia `--color-amber-600/700` overrides, the `color` and `colorHex`
fields of the lessons (nothing reads them; the rule type already gives the color), and both
`PALETTE_UNGUARDED_FILES` entries: once the two color fields are gone, the lesson data has no palette
class left, so PR 3.3 needs no exemption either.

Tests: a contrast matrix (each `--tj-*` against paper, surface, surface-sunken, highlight and mark at
3:1, against surface and paper at 4.5:1) in all three themes; a source scan that fails if a tajwid hex
value or a `tj-` class appears anywhere but `globals.css` and `tajwidStyles.ts`.

### D3. Tap on a colored letter (owner chose A)

Colored spans get a `data-tj-rule` attribute; one click listener on the ayah paragraph reads
`event.target.closest("[data-tj-rule]")` and opens the bar. No per-span handlers, no tabindex, no
role, so the DOM and the tab order do not grow.

Plain text (`TajwidTextRenderer`: reader, learn mode, bookmarks) has no tap action today, so a tap on a
colored letter only opens the bar. Word by word (`WordByWordRenderer`) already has one: a tap on a word
jumps the recitation to it. There:

- **A (recommended): both.** A tap on a colored letter jumps to the word as before and also opens the
  bar. The word tap keeps its meaning everywhere; the bar is an addition that does not get in the way
  (non-modal, at the bottom). Cost: a tap meant only to read the rule name also moves the recitation.
- **B: the colored letter wins.** A tap on a colored letter opens the bar and does not jump; the rest
  of the word still jumps. Cost: 49% of the words have a colored letter (38,035 of 77,429 in `src/data/ayahs`), and on a phone the colored
  part is often one narrow letter, so many word taps would stop jumping, depending on where the finger
  lands.

Keyboard on a word (Enter, Space, arrows) is unchanged: it never opens the bar.

### D4. The bar (my call, from the handoff spec)

One `TajwidRuleBar` mounted once in `AppShell`, state in a small non-persisted zustand store
(`open(rule)`, `close()`). Fixed above the bottom bars: on mobile above the navigation (and above the
player when audio is loaded, using the same `activeAudioSrc` check as `AppShell`), on desktop above
the player; z-index between the player and the toast. Look from the handoff: `--ink` background,
`--paper` text, a dot in the rule color, the name in bold, one sentence, a "Lekcija" link to the
rule's lesson, and a close button ("Zatvori"). The container is always in the DOM with
`role="status"`; only its content changes, so a screen reader announces it. It does not take focus.
It closes on the close button, on Escape, on route change, and is replaced by the next tap.

Rule to lesson: a small constant map rule -> lesson slug next to the rule names (a test checks it
against the lessons' `ruleType`), so the bar does not pull the lesson text into every page.

Sentences (the owner approves the wording; voice per `docs/glas.md`):

| Rule | Bar text |
|---|---|
| medd | **Medd**: ovdje se glas uci duze od obicnog dugog vokala. |
| gunne | **Gunne**: nun ili mim se ovdje uci kroz nos. |
| ihfa | **Ihfa**: nun bez vokala, tenvin ili mim se ovdje prikriva i uci kroz nos. |
| kalkala | **Kalkala**: harf bez vokala ovdje odskoci, da se jasno cuje. |

(In the app with the Bosnian letters: uči, duže, običnog, uči, odskoči, čuje.)

### D5. Keyboard and screen-reader path: the legend (my call)

The legend (`TajwidLegend.tsx`, collapsed "Sta znace boje" button as today) gets three rows by what
the voice does, with the proposal's wording: "Crveno: produži (medd)", "Zeleno: kroz nos (gunne,
ihfa)", "Plavo: odskok (kalkala)". Each rule name in a row is a link to its lesson, so Tab goes:
legend button, then medd, gunne, ihfa, kalkala. The row "Bez pravila" goes. One line above the rows:
"Dodirni obojeni harf za naziv pravila." The closed panel becomes `inert` (Baseline widely available
since 2025) besides `aria-hidden`, so the links are not focusable while hidden. The colored letters
stay plain text for screen readers.

### D6. Setting "boje i linije" and its stored shape (my call)

Stored: keep `showTajwidColors: boolean` and add `showTajwidLines: boolean` (default false). Old stored
settings load as they are (lines off); no version bump or migrate function. An enum
(`"off" | "colors" | "lines"`) would read better but needs a migration and touches every reader of
`showTajwidColors`, for no gain to the user.

UI: in Settings the switch "Tedzvid boje" becomes a choice of three, as for the theme: "Tedzvid":
"Iskljuceno" / "Boje" / "Boje i linije". The reader toolbar chip "Tedzvid boje" stays an on/off for the
colors; the lines choice is remembered while colors are off.

Lines: `text-decoration` in the rule color (`currentColor`): medd solid, gunne dotted, ihfa dashed,
kalkala wavy; thickness and `text-underline-offset` tuned so the line clears kasra and the dots of ba
and ya, checked in Chromium, Firefox and WebKit (Playwright) in three themes. The legend swatch shows
the line style when lines are on. `text-decoration` is paint only, so Arabic shaping across spans does
not change.

### D7. One-time notice (my call)

New stored flag `tajwidNoticeSeen` in the settings store. Fresh install: default true (nothing to
announce). Stored settings without the flag (everyone who used the old colors): `merge` sets false.
When the legend mounts with colors on and the flag is false, the existing toast shows "Boje su sada kao
u tedzvidskom mushafu." (with the Bosnian letters) and the flag becomes true. `merge` also learns to
handle an empty store (zustand calls it with `undefined`). zustand writes settings only after a
change, so someone who used the old colors with the default settings has no settings stored: when
the settings are missing but `quran-learning-progress` or `quran-learning-bookmarks` exists, the flag
is false too. (Added after the branch review. Cost: a new user who reads or bookmarks before changing
any setting sees the notice once.)

### D8. Lessons (PR 3.3, blocked on the review)

The new text and quizzes come from the lesson doc after the owner's friend has read it. Examples are
written as references (surah, ayah, and the Arabic and transcription fragments) and a test checks each
fragment is a substring of that ayah's `arabicText` and `transliteration`; the link points to that
ayah. Slugs, ids and progress keys stay. In PR 3.1 only the sentences that name a color are corrected
(lesson 2: green -> red; lesson 3: red/pink -> green; lesson 4: blue -> the same green as gunne;
lesson 5: orange -> blue).

## PRs

1. **3.1 Colors and legend**: D1, D2, D5 (three rows, links), D7, color words in lessons and quizzes,
   `docs/TAJWID.md`, full highlight for the playing ayah.
2. **3.2 Rule name on tap, and lines**: D3, D4, D6, cut from `main` after 3.1 is merged.
3. **3.3 Lessons**: D8, only after the review is confirmed in this session.

## Left to the builder

Exact line thickness and offset (decided by the browser check), the swatch drawing, bar spacing,
test file names.

## Built differently in PR 3.2 (pending the owner's sign-off)

1. Kalkala line is double, not wavy (D6). Under a single letter Chromium draws a wavy line as one
   letter-like hook and WebKit does not draw it at all; double shows in both and differs from solid,
   dotted and dashed. Lines: 2px, offset 0.45em.
2. The bar is on `--surface` with a border, not on `--ink` (D4). The rule-color dot is about 2:1 on
   ink in every theme and at least 3:1 on surface.
3. The line check ran in Chromium and WebKit only (D6 asks for Firefox too): Playwright Firefox is
   not installed, and installing it downloads a browser.
