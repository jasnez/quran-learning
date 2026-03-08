import type { TajwidRule } from "@/types/quran";

/**
 * Single source of truth for tajwid rule colors.
 * Do not hardcode tajwid colors elsewhere.
 */
export const tajwidRuleClasses: Record<TajwidRule, string> = {
  normal: "text-foreground",
  mad: "text-emerald-600 dark:text-emerald-400",
  ghunnah: "text-rose-600 dark:text-rose-400",
  ikhfa: "text-sky-600 dark:text-sky-400",
  qalqalah: "text-amber-600 dark:text-amber-400",
};

/**
 * Bosnian labels for each tajwid rule (for tooltips/accessibility).
 */
export const tajwidRuleLabels: Record<TajwidRule, string> = {
  normal: "Normalan tekst",
  mad: "Duljenje (Mad) — produziti glas",
  ghunnah: "Ghunnah — nazalni zvuk",
  ikhfa: "Ikhfa — skriveni nazalni zvuk",
  qalqalah: "Qalqalah — odskok zvuka",
};
