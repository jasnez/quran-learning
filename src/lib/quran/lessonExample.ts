import type { TajwidRule, TajwidSegment } from "@/types/quran";

/**
 * An example in a tajwid lesson, as a reference into the ayah data: the lesson never stores
 * Quranic text or transcription, it takes them from src/data/ayahs (checked by
 * src/data/tajwid-lessons/__tests__/lessons.test.ts). Word indexes are into text.split(" "), both
 * ends included.
 */
export interface LessonExampleRef {
  surah: number;
  ayah: number;
  /** Arabic words, by index in arabicText.split(" "). */
  words: [number, number];
  /** Transcription words, by index in transliteration.split(" "). */
  translitWords: [number, number];
  /** Optional cut inside those words, for assimilated transcription ("Innel-insāne" -> "Inne"). */
  translitChars?: [number, number];
  /**
   * Color only these rules; other colored letters show as plain text. For an example whose fragment
   * cuts off the cause of a color (a tenvin before the next, unshown word) or shows a rule the
   * lesson is not about. Omitted: every rule keeps its color.
   */
  rules?: TajwidRule[];
  /** What to see in the example; may quote this ayah's transcription in „…“. */
  note: string;
}

export interface ResolvedLessonExample {
  arabic: string;
  transliteration: string;
  /** The ayah's tajwid segments cut to the Arabic words, rules kept. */
  segments: TajwidSegment[];
  href: string;
}

type AyahText = { arabicText: string; transliteration: string; tajwidSegments: TajwidSegment[] };

function wordRange(text: string, [from, to]: [number, number], what: string): { start: number; end: number } {
  const words = text.split(" ");
  if (from < 0 || to < from || to >= words.length) {
    throw new Error(`${what} words [${from}, ${to}] are outside the ${words.length} words of the ayah`);
  }
  // Some ayah texts start with a space: their first "word" is empty and must not open or close a range.
  if (!words[from] || !words[to]) throw new Error(`${what} words [${from}, ${to}] start or end on an empty word`);
  const start = words.slice(0, from).reduce((n, w) => n + w.length + 1, 0);
  const end = start + words.slice(from, to + 1).join(" ").length;
  return { start, end };
}

/** Cuts the segments to [start, end) of their joined text. */
function sliceSegments(segments: TajwidSegment[], start: number, end: number): TajwidSegment[] {
  const out: TajwidSegment[] = [];
  let pos = 0;
  for (const seg of segments) {
    const segEnd = pos + seg.text.length;
    const from = Math.max(start, pos);
    const to = Math.min(end, segEnd);
    if (from < to) out.push({ ...seg, text: seg.text.slice(from - pos, to - pos) });
    pos = segEnd;
  }
  return out;
}

/** The Arabic, transcription, colored segments and reader link of a lesson example. Throws on a bad reference. */
export function resolveLessonExample(ref: LessonExampleRef, ayah: AyahText): ResolvedLessonExample {
  const ar = wordRange(ayah.arabicText, ref.words, "Arabic");
  const arabic = ayah.arabicText.slice(ar.start, ar.end);

  const tr = wordRange(ayah.transliteration, ref.translitWords, "Transcription");
  let transliteration = ayah.transliteration.slice(tr.start, tr.end);
  if (ref.translitChars) {
    const [a, b] = ref.translitChars;
    if (a < 0 || b <= a || b > transliteration.length) {
      throw new Error(`Example ${ref.surah}:${ref.ayah}: character cut [${a}, ${b}] does not fit "${transliteration}"`);
    }
    transliteration = transliteration.slice(a, b);
  }

  if (!arabic || !transliteration) {
    throw new Error(`Example ${ref.surah}:${ref.ayah} resolves to empty text`);
  }
  return {
    arabic,
    transliteration,
    segments: sliceSegments(ayah.tajwidSegments, ar.start, ar.end).map((s) =>
      ref.rules && s.rule !== "normal" && !ref.rules.includes(s.rule) ? { ...s, rule: "normal" } : s,
    ),
    href: `/surah/${ref.surah}?ayah=${ref.ayah}`,
  };
}
