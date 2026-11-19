# CLAUDE.md

Project notes for Claude Code sessions in this repository.

## Gotchas

- `next build` type-checks every file in the tsconfig `include`, test files too: a type error in a test fails the build (seen 2026-11-18). Run `npm run typecheck` (tsc) first; it is faster and CI runs it too.
- Session worktrees live in `.claude/worktrees/` (full copies of the repo). ESLint and Vitest ignore `.claude/`; tsc skips it on its own because its wildcards skip dot-folders.
- npm 10.9.x (bundled with Node 22) can crash when installing vitest 4.1.x with `Cannot read properties of null (reading 'edgesOut')`. Use npm 11 for dependency changes (`npx npm@11 install ...`).
- The `transliteration` field (ayahs, Quranic duas, search index) is generated in the IZ BiH "specijal" system: never edit it by hand. Run `npx tsx scripts/generate-transliteration.ts --write`, then `npm run generate:search-index`; tests fail when the stored text differs from the generator.
- The Quranic dua translations (Korkut, resource 126) are checked offline in `npm test` against `src/data/ayahs`; the live check against Quran.com is `npm run check:dua-translations` (needs network, not in CI).
- A local Windows `next build` nests segment prefetch files (`out/surah/2/__next.surah/$d$surahId/__PAGE__.txt` instead of `__next.surah.$d$surahId.__PAGE__.txt`), so the client gets 404 for them on localhost. Vercel (Linux) writes them flat; the 404s are not an app bug.
- Sepia theme overrides Tailwind's `--color-stone-500` and `--color-amber-600` in `globals.css`; check new muted or amber text in sepia too.
- The transcription font (`src/app/fonts/TranscriptionBook-*.woff2`) is a renamed Gentium Book Plus subset (OFL: no "Gentium" in served file or CSS names). Regenerate with `scripts/subset-transliteration-font.py` (steps in its docstring); `src/app/__tests__/transliterationFont.test.ts` checks the coverage.
- `npm run test:a11y` runs the axe check (own `next dev` on port 3210, 7-12 min, not in CI). Known contrast exceptions are listed by exact node in `tests/e2e/a11y.spec.ts`; a stale entry fails the run.
- Chrome and Edge list Intl "bs" as supported but format numbers and relative time with root data ("6,236", "-3 h"). Use the helpers in `src/lib/format.ts` and check any new Intl use in a real Chromium, not only in Vitest (Node has full ICU).
