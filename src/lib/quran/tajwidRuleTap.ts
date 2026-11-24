import type { ColoredTajwidRule } from "./tajwidStyles";

const COLORED_RULES: readonly string[] = ["mad", "ghunnah", "ikhfa", "qalqalah"] satisfies ColoredTajwidRule[];

/**
 * The rule of the colored letter a tap landed on: the nearest data-tj-rule (set by
 * tajwidPieceProps) at or above the tap target. Null for plain text and anything else.
 */
export function ruleFromTarget(target: EventTarget | null): ColoredTajwidRule | null {
  if (!(target instanceof Element)) return null;
  const rule = target.closest("[data-tj-rule]")?.getAttribute("data-tj-rule");
  return rule != null && COLORED_RULES.includes(rule) ? (rule as ColoredTajwidRule) : null;
}

/** The rule to name for a click, or null: no colored letter there, or the click ended a text selection. */
export function ruleFromClick(target: EventTarget | null): ColoredTajwidRule | null {
  const selection = typeof window === "undefined" ? null : window.getSelection();
  if (selection && !selection.isCollapsed) return null;
  return ruleFromTarget(target);
}
