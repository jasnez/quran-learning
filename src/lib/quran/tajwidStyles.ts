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
 * The same rule colors for small text such as the rule chips on lesson cards. The 600 shades are
 * fine for the large Arabic text (3:1) but only 2.9-3.7:1 as small text; the 700 shades reach
 * the 4.5:1 that small text needs (QA section 5).
 */
export const tajwidRuleLabelClasses: Record<TajwidRule, string> = {
  normal: "text-foreground",
  mad: "text-emerald-700 dark:text-emerald-400",
  ghunnah: "text-rose-700 dark:text-rose-400",
  ikhfa: "text-sky-700 dark:text-sky-400",
  qalqalah: "text-amber-700 dark:text-amber-400",
};

/**
 * Bosnian names of the tajwid rules as the app shows them (Medd, Gunne, Ihfa, Kalkala).
 */
export const tajwidRuleNames: Record<TajwidRule, string> = {
  normal: "Bez pravila",
  mad: "Medd",
  ghunnah: "Gunne",
  ikhfa: "Ihfa",
  qalqalah: "Kalkala",
};

/**
 * One short description per rule, lower case and without a final period; "normal" has none.
 */
export const tajwidRuleDescriptions: Record<TajwidRule, string> = {
  normal: "",
  mad: "glas se produžava",
  ghunnah: "izgovor kroz nos",
  ikhfa: "prikriven izgovor kroz nos",
  qalqalah: "odskok glasa",
};

/**
 * Bosnian labels for each tajwid rule (for tooltips/accessibility): name and description.
 */
export const tajwidRuleLabels: Record<TajwidRule, string> = {
  normal: tajwidRuleNames.normal,
  mad: `${tajwidRuleNames.mad}: ${tajwidRuleDescriptions.mad}`,
  ghunnah: `${tajwidRuleNames.ghunnah}: ${tajwidRuleDescriptions.ghunnah}`,
  ikhfa: `${tajwidRuleNames.ikhfa}: ${tajwidRuleDescriptions.ikhfa}`,
  qalqalah: `${tajwidRuleNames.qalqalah}: ${tajwidRuleDescriptions.qalqalah}`,
};
