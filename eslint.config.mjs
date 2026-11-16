import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
      ],
    },
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
