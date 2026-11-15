import type { TajwidRule, TajwidSegment } from "@/types/quran";

/** One cpfair/quran-tajweed annotation: code point offsets into cpfair's base text. */
export type CpfairAnnotation = { rule: string; start: number; end: number };

export type AlignedTajwid = {
  segments: TajwidSegment[];
  /** Annotations whose characters do not exist in the display text (e.g. the basmala prefix). */
  unmappedAnnotations: number;
};

const TATWEEL = "\u0640";
const SUPERSCRIPT_ALEF = "\u0670";

/** Code points that encode the same mark in the two texts (small yeh vs small high yeh for the silah ya). */
const EQUIVALENT: Record<string, string> = { "\u06E7": "\u06E6" };
const canonical = (char: string): string => EQUIVALENT[char] ?? char;

/** Maps cpfair rule names onto the app's tajwid colors; unsupported rules stay uncolored. */
export function mapCpfairRule(rule: string): TajwidRule {
  const r = rule.toLowerCase();
  if (r.startsWith("madd_")) return "mad";
  if (r === "ghunnah" || r === "idghaam_ghunnah" || r === "idghaam_shafawi") return "ghunnah";
  if (r === "ikhfa" || r === "ikhfa_shafawi" || r === "iqlab") return "ikhfa";
  if (r === "qalqalah") return "qalqalah";
  return "normal";
}

/**
 * For every code point of `base`, the index of the same code point in `display`
 * (or -1 when it has no counterpart), using a longest-common-subsequence alignment.
 */
function alignBaseToDisplay(baseChars: string[], displayChars: string[]): Int32Array {
  const base = baseChars.map(canonical);
  const display = displayChars.map(canonical);
  const map = new Int32Array(base.length).fill(-1);

  let prefix = 0;
  while (prefix < base.length && prefix < display.length && base[prefix] === display[prefix]) {
    map[prefix] = prefix;
    prefix++;
  }
  let suffix = 0;
  while (
    suffix < base.length - prefix &&
    suffix < display.length - prefix &&
    base[base.length - 1 - suffix] === display[display.length - 1 - suffix]
  ) {
    map[base.length - 1 - suffix] = display.length - 1 - suffix;
    suffix++;
  }

  const b = base.slice(prefix, base.length - suffix);
  const d = display.slice(prefix, display.length - suffix);
  if (b.length === 0 || d.length === 0) return map;

  // lcs[i][j] = LCS length of b[i..] and d[j..]
  const lcs = Array.from({ length: b.length + 1 }, () => new Uint16Array(d.length + 1));
  for (let i = b.length - 1; i >= 0; i--) {
    for (let j = d.length - 1; j >= 0; j--) {
      lcs[i][j] = b[i] === d[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  let i = 0;
  let j = 0;
  while (i < b.length && j < d.length) {
    if (b[i] === d[j]) {
      map[prefix + i] = prefix + j;
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return map;
}

/**
 * Builds tajwid segments for `displayText` from cpfair annotations that index
 * into `baseText` (cpfair's Tanzil copy). The two texts differ (tatweel, pause
 * marks, hamza encoding, basmala prefix), so indices are carried over through a
 * code point alignment instead of being applied directly.
 */
export function buildAlignedTajwidSegments(
  baseText: string,
  displayText: string,
  annotations: CpfairAnnotation[]
): AlignedTajwid {
  const base = Array.from(baseText);
  const display = Array.from(displayText);
  const rules: TajwidRule[] = new Array(display.length).fill("normal");
  const map = alignBaseToDisplay(base, display);

  let unmappedAnnotations = 0;
  const ordered = [...annotations].sort((a, b) => a.start - b.start);
  for (const annotation of ordered) {
    const rule = mapCpfairRule(annotation.rule);
    if (rule === "normal") continue;

    let first = -1;
    let last = -1;
    for (let k = Math.max(0, annotation.start); k < Math.min(annotation.end, base.length); k++) {
      const target = map[k];
      if (target < 0) continue;
      if (first < 0 || target < first) first = target;
      if (target > last) last = target;
    }
    if (first < 0) {
      unmappedAnnotations++;
      continue;
    }
    // A superscript alef sits on a tatweel in the display text; color the pair so the mark is not split from its carrier.
    if (display[first] === SUPERSCRIPT_ALEF && first > 0 && display[first - 1] === TATWEEL) first--;
    for (let k = first; k <= last; k++) rules[k] = rule;
  }

  const segments: TajwidSegment[] = [];
  for (let k = 0; k < display.length; k++) {
    const previous = segments[segments.length - 1];
    if (previous && previous.rule === rules[k]) previous.text += display[k];
    else segments.push({ text: display[k], rule: rules[k] });
  }
  if (segments.length === 0) segments.push({ text: displayText, rule: "normal" });

  return { segments, unmappedAnnotations };
}
