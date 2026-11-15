# CLAUDE.md

Project notes for Claude Code sessions in this repository.

## Gotchas

- `next build` (Next 16.4+) type-checks the whole project, including `__tests__`, so a type error in a test fails the build.
- npm 10.9.x (bundled with Node 22) can crash when installing vitest 4.1.x with `Cannot read properties of null (reading 'edgesOut')`. Use npm 11 for dependency changes (`npx npm@11 install ...`).
