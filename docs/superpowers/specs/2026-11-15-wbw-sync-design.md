# Word-by-word ("Rijec po rijec") sync -- design

Date: 2026-11-15. QA items: P1-2 (WBW does not work) and P1-10 (WBW logic depends on rAF).

## Intent

"Rijec po rijec" must highlight the word being recited, in the reader and in learn mode,
with tajwid colors kept, and with no word meanings (no Bosnian source exists; machine
translation of Quranic text is not acceptable). Repeat-ayah and the pause between ayahs
must keep working with the tab in the background or the phone locked (hifz use case).

## Measured facts (see QA notes, wbw-measurement-2026-11-15.md)

- everyayah `Alafasy_128kbps/SSSAAA.mp3` is an exact cut of the QDC chapter MP3 that the
  Quran.com word segments were made for. Cut point == verse `timestampFrom` (+-30 ms).
  So: time in the ayah file (ms) = chapter time - `timestampFrom`.
- Verse boundaries are exact. Word boundaries cannot be verified from audio energy
  (continuous recitation); they get a visual/listening check in the browser.
- `public/data/chapter-audio/*.json` keeps word repeats (1123 verses); `public/data/words/*.json`
  loses them and has `tajwidRule: "normal"` for every word.
- About 7% of verses have bad segments (shifted, truncated, missing words).

## Approaches

- **A. Per-ayah audio (chosen by the user).** WBW is a display mode only; audio stays the
  everyayah file per ayah. Ayah boundaries, repeat and pause stay on `ended` + `setTimeout`,
  which already work in the background, so the rAF boundary logic is deleted (fixes P1-10).
  Cost: the small gap between ayah files stays, as in "Po ajetu" today.
- B. Chapter MP3 (quranicaudio). Gapless, but boundaries/repeat must be rewritten on
  `timeupdate`/timers, Al-Baqarah is 116 MB, seeking is fragile, and two playback paths remain.

## Design (A)

1. **Timing source:** `chapter-audio` JSON (already static, fetched only when WBW is on,
   cached by `fetchChapterAudioData`). Per verse, segments become ayah-relative:
   `startMs - timestampFrom`, `endMs - timestampFrom`. No duration scaling.
2. **Validity per verse** (pure function, unit-tested): highlight is disabled for a verse if
   segments are non-monotonic, or the last segment ends more than 1500 ms before or 300 ms
   after `timestampTo` (shifted/truncated). A first word that starts early is clamped to 0;
   if the second word also starts at or before `timestampFrom`, the verse is disabled
   (word 1 would never light up). Final count: 147 of 6236 verses (2.4%) disabled. Word positions outside the verse's word count are ignored. Exact thresholds are
   tuned against the data in a test that reports how many verses are disabled.
   A disabled verse renders the normal tajwid text and a short note
   ("Oznacavanje rijeci nije dostupno za ovaj ajet"); it never highlights a wrong word.
3. **Words and tajwid:** the ayah's own `tajwidSegments` are split into words on whitespace
   (waqf signs U+06D6-U+06ED dropped from word counting), keeping per-segment tajwid colors
   inside each word (same classes as `TajwidTextRenderer`, so the legend stays correct).
   Where the token count differs from the segment word count (4 verses: "ba'da ma" 2:181,
   8:6, 13:37; "il yasin" 37:130), adjacent tokens are merged to match.
4. **Active word:** the segment whose `[start, end)` contains the current time; in gaps the
   previous segment stays active. Repeats work because segments are followed in time order
   (a repeated word lights up again).
5. **Renderer:** one `WordByWordRenderer` (rewritten) used by reader and learn mode: tajwid
   colored words, highlight on the active word, click/Enter on a word seeks to its start.
   No text under words (no transliteration, no meaning). `WordByWordChapterRenderer`,
   the `fetchWordData` stub and the old `wordLevelSync` path are removed.
6. **Reader toggle** "Po ajetu / Rijec po rijec": switches the cards to the WBW renderer;
   audio unchanged. The misleading "Quran.com nije dostupan" message goes; a fetch failure
   of the chapter-audio JSON shows a clear Bosnian message and falls back to normal text.
7. **Learn mode:** toggle off -> normal `TajwidTextRenderer`; toggle on -> WBW renderer.
8. **Player store / AudioPlayer:** remove chapter-audio playback (`chapterAudioUrl`,
   `chapterTimestamps`, `setChapterAudio`, the WBW branch of the rAF loop). rAF stays only
   to update the current time for highlighting while playing (unchanged cost; P1-9 not made
   worse). The reader stops fetching `words` JSON, which is unused once timings come from
   chapter-audio (also saves ~1.5 MB on Al-Baqarah).

## Non-goals

- Word meanings or per-word transliteration.
- Full P1-9 (60 fps re-render); not needed for this design.
- Gapless playback between ayahs.

## Verification

- TDD: failing test first for each change (pure timing/validity/split functions, renderer,
  learn-mode toggle, reader toggle, AudioPlayer repeat/advance with rAF never firing).
- Gates: vitest, lint, `tsc --noEmit` (56 pre-existing errors in `__tests__`, no new),
  `npm run build`.
- Browser (pane visible): highlight follows the recited word in reader and learn mode,
  including a repeat verse (2:14); tajwid colors visible; no English text; repeat-ayah and
  next-ayah keep working in a background tab.
- QA report status table updated for P1-2 and P1-10.

## Calls made by Claude (not decided by the user)

Validity thresholds, the disabled-verse note text, merging tokens for the 4 mismatched
verses, removing the chapter-MP3 code path and the reader's `words` fetch, no text under words.
