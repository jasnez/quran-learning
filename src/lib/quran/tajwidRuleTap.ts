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
