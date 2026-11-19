import { describe, it } from "vitest";
import { RuleTester } from "eslint";
import rule from "../no-palette-colors.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
});

const invalid = (code: string, match: string) => ({ code, errors: [{ messageId: "palette", data: { match } }] });

tester.run("no-palette-colors", rule, {
  valid: [
    'const a = "text-ink-muted";',
    'const a = "bg-surface/95 hover:bg-accent-hover";',
    'const a = "text-tj-medd";',
    'const a = "[&_mark]:bg-mark has-[:checked]:bg-accent-wash";',
    'const a = "whitelist blackboard";',
    'const a = "border-stone";',
    'const a = "dark-mode";',
    'const a = "text-2xl font-bold";',
    "const a = <div className=\"rounded-card bg-paper\" />;",
  ],
  invalid: [
    invalid('const a = "text-stone-500";', "text-stone-500"),
    invalid('const a = "px-2 hover:bg-emerald-800";', "hover:bg-emerald-800"),
    invalid("const a = `px-2 ${b} bg-white/95`;", "bg-white/95"),
    invalid('const a = "dark:text-stone-100";', "dark:text-stone-100"),
    invalid('const a = "bg-[var(--theme-card)]";', "var(--theme-"),
    invalid('const a = "focus:ring-emerald-600";', "focus:ring-emerald-600"),
    invalid("const a = <div className=\"text-white\" />;", "text-white"),
    invalid('const a = "md:dark:hover:bg-amber-50/50";', "md:dark:hover:bg-amber-50/50"),
    invalid('const a = "[&_mark]:bg-amber-100";', "[&_mark]:bg-amber-100"),
    invalid('const a = "has-[:checked]:border-emerald-500";', "has-[:checked]:border-emerald-500"),
  ],
});
