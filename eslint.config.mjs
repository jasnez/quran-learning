import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noPaletteColors from "./eslint-rules/no-palette-colors.mjs";

// Every component and page uses the Tezhib tokens, the tajwid rule colors included (--tj-*,
// through tajwidStyles.ts). Only tests may name palette colors.
const PALETTE_GUARDED_FILES = ["src/**/*.{ts,tsx}"];
const PALETTE_UNGUARDED_FILES = ["**/__tests__/**"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // AppShell renders the page's only main landmark; a second one nested inside it is invalid HTML.
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/components/layout/AppShell.tsx", "**/__tests__/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='main']",
          message: "AppShell already renders <main>. Use a <div> for the page wrapper.",
        },
        {
          selector: "JSXAttribute[name.name='role'][value.value='main']",
          message: "AppShell already provides the main landmark. Do not add role=\"main\".",
        },
        // Store actions such as getSurahProgress/isBookmarked read live state via get(), which
        // already holds localStorage data while React hydrates the static HTML (QA P1-6, React #418).
        // In render, derive values from the selector's state argument instead.
        {
          selector:
            "CallExpression[callee.name=/^use[A-Z]\\w*Store$/] CallExpression[callee.type='MemberExpression'][callee.property.name=/^(get|is|has)[A-Z]/]",
          message:
            "Do not call store getters inside a store selector: they read live state and break hydration. Select state fields, e.g. (s) => s.surahProgressMap[n] or hasBookmark(s.bookmarks, ...).",
        },
        {
          selector:
            "CallExpression[callee.name=/^use[A-Z]\\w*Store$/] > ArrowFunctionExpression > MemberExpression.body[property.name=/^get[A-Z]/]",
          message:
            "Do not select a store getter to call it in render: it reads live state and breaks hydration. Select state fields instead.",
        },
      ],
    },
  },
  {
    files: PALETTE_GUARDED_FILES,
    ignores: PALETTE_UNGUARDED_FILES,
    plugins: { local: { rules: { "no-palette-colors": noPaletteColors } } },
    rules: { "local/no-palette-colors": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code session worktrees (full copies of the repo).
    ".claude/**",
  ]),
]);

export default eslintConfig;
