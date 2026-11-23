import type { TajwidRule } from "@/types/quran";

/**
 * Single source of truth for tajwid rule colors: the --tj-* tokens in globals.css, one value per
 * theme, as in the Dar al-Maarifa tajwid mushaf (red = lengthen, green = through the nose,
 * blue = bounce). Ihfa has its own token with the same green as gunne. Every color passes 3:1 on
 * every background tajwid text is drawn on and 4.5:1 on paper and surface, so the same class
 * serves the large Arabic text and small labels. Do not name the tokens or their values elsewhere
 * (tajwidColorSource.test.ts).
 */
export const tajwidRuleClasses: Record<TajwidRule, string> = {
  normal: "text-foreground",
  mad: "text-tj-medd",
  ghunnah: "text-tj-gunne",
  ikhfa: "text-tj-ihfa",
  qalqalah: "text-tj-kalkala",
};

/** The lesson that teaches each colored rule (slugs in src/data/tajwid-lessons). */
export const tajwidRuleLessonSlugs: Record<Exclude<TajwidRule, "normal">, string> = {
  mad: "mad-duljenje",
  ghunnah: "ghunnah-nazalni-zvuk",
  ikhfa: "ikhfa-skriveni-zvuk",
  qalqalah: "qalqalah-odskok",
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
