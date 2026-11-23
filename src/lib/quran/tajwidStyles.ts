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

/**
 * "Tedzvid: boje i linije": a line under each colored letter, a different style per rule, so the
 * rules can be told apart without the colors (red and green look alike with deuteranopia). The
 * line takes the letter's color (currentColor). Kalkala is double, not wavy: under one letter a
 * wavy line is drawn as a letter-like hook (Chromium) or not at all (WebKit). The classes apply
 * only under an ancestor with data-tajwid-lines, which ThemeProvider sets on <html> when colors
 * and lines are both on, so the renderers need no extra prop. Thickness 2px and offset 0.45em
 * clear kasra and the dots under ba and ya (checked in Chromium and WebKit, Al-Baqarah 2-5).
 * Tailwind finds these classes only as literal strings: keep them written out in full.
 */
export const tajwidRuleLineClasses: Record<TajwidRule, string> = {
  normal: "",
  mad: "[[data-tajwid-lines]_&]:underline [[data-tajwid-lines]_&]:decoration-solid [[data-tajwid-lines]_&]:decoration-2 [[data-tajwid-lines]_&]:underline-offset-[0.45em] [[data-tajwid-lines]_&]:[text-decoration-skip-ink:none]",
  ghunnah: "[[data-tajwid-lines]_&]:underline [[data-tajwid-lines]_&]:decoration-dotted [[data-tajwid-lines]_&]:decoration-2 [[data-tajwid-lines]_&]:underline-offset-[0.45em] [[data-tajwid-lines]_&]:[text-decoration-skip-ink:none]",
  ikhfa: "[[data-tajwid-lines]_&]:underline [[data-tajwid-lines]_&]:decoration-dashed [[data-tajwid-lines]_&]:decoration-2 [[data-tajwid-lines]_&]:underline-offset-[0.45em] [[data-tajwid-lines]_&]:[text-decoration-skip-ink:none]",
  qalqalah: "[[data-tajwid-lines]_&]:underline [[data-tajwid-lines]_&]:decoration-double [[data-tajwid-lines]_&]:decoration-2 [[data-tajwid-lines]_&]:underline-offset-[0.45em] [[data-tajwid-lines]_&]:[text-decoration-skip-ink:none]",
};

/**
 * Props for one piece of ayah text: the rule's color and line classes, and data-tj-rule, which a
 * tap on the letter reads to name the rule. With the colors off a piece is plain text.
 */
export function tajwidPieceProps(
  rule: TajwidRule,
  showColors: boolean,
): { className: string; "data-tj-rule"?: TajwidRule } {
  if (!showColors || rule === "normal") return { className: tajwidRuleClasses.normal };
  return { className: `${tajwidRuleClasses[rule]} ${tajwidRuleLineClasses[rule]}`, "data-tj-rule": rule };
}

/** A rule that has a color (every rule but "normal"). */
export type ColoredTajwidRule = Exclude<TajwidRule, "normal">;

/** The lesson that teaches each colored rule (slugs in src/data/tajwid-lessons). */
export const tajwidRuleLessonSlugs: Record<ColoredTajwidRule, string> = {
  mad: "mad-duljenje",
  ghunnah: "ghunnah-nazalni-zvuk",
  ikhfa: "ikhfa-skriveni-zvuk",
  qalqalah: "qalqalah-odskok",
};

/**
 * The rule bar's sentence after the bold rule name ("Medd: ..."), approved by the owner
 * (design D4). Voice per docs/glas.md.
 */
export const tajwidRuleSentences: Record<ColoredTajwidRule, string> = {
  mad: "ovdje se glas uči duže od običnog dugog vokala.",
  ghunnah: "nun ili mim se ovdje uči kroz nos.",
  ikhfa: "nun bez vokala, tenvin ili mim se ovdje prikriva i uči kroz nos.",
  qalqalah: "harf bez vokala ovdje odskoči, da se jasno čuje.",
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
