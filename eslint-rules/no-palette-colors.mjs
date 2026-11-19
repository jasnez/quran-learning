/**
 * Components color through the Tezhib tokens (bg-paper, text-ink, border-line-strong, ...), which
 * already carry the theme. This rule rejects, in any string or template literal:
 * - a fixed Tailwind palette color class (text-stone-500, hover:bg-emerald-800, bg-white/95),
 * - any dark: variant (the tokens switch with the theme on their own),
 * - the old theme variables, var(--theme-*).
 */

const UTILITY =
  "(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|decoration|placeholder|shadow|accent|caret)";
const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
// Variant prefixes, including arbitrary ones with colons inside brackets: hover:, [&_mark]:,
// has-[:checked]:.
const VARIANTS = "(?:(?:\\[[^\\]]*\\]|[^\\s:\\[])+:)*";
const PALETTE_CLASS = new RegExp(`^${VARIANTS}${UTILITY}-(?:white|black|${PALETTE}-\\d{2,3})(?:/\\d+)?$`);
const DARK_VARIANT = /(?:^|:)dark:/;
const OLD_THEME_VAR = "var(--theme-";

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: { description: "Use Tezhib token classes instead of fixed palette colors and dark: variants" },
    messages: {
      palette: 'Use a Tezhib token class (bg-paper, text-ink, border-line-strong, ...) instead of "{{match}}".',
    },
    schema: [],
  },
  create(context) {
    function check(node, text) {
      if (typeof text !== "string" || text.length === 0) return;
      for (const token of text.split(/\s+/)) {
        if (PALETTE_CLASS.test(token) || DARK_VARIANT.test(token)) {
          context.report({ node, messageId: "palette", data: { match: token } });
        }
      }
      if (text.includes(OLD_THEME_VAR)) {
        context.report({ node, messageId: "palette", data: { match: OLD_THEME_VAR } });
      }
    }
    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked);
      },
    };
  },
};

export default rule;
