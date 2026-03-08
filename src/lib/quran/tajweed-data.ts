import type { TajwidRule, TajwidSegment } from "@/types/quran";

const TAJWEED_JSON_URL =
  "https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json";

type CpfairAnnotation = { rule: string; start: number; end: number };
type CpfairEntry = { surah: number; ayah: number; annotations: CpfairAnnotation[] };

/** Map cpfair rule names to our TajwidRule (normal for unmapped rules) */
function mapRule(rule: string): TajwidRule {
  const r = rule.toLowerCase();
  if (r.startsWith("madd_")) return "mad";
  if (r === "ghunnah" || r === "idghaam_ghunnah") return "ghunnah";
  if (r === "ikhfa" || r === "ikhfa_shafawi") return "ikhfa";
  if (r === "qalqalah") return "qalqalah";
  return "normal";
}

let cachedData: CpfairEntry[] | null = null;

/**
 * Fetches tajweed annotations (cpfair/quran-tajweed JSON). Cached per process.
 * Used to build tajwidSegments for verses from API (surah 2–111).
 */
export async function getTajweedData(): Promise<CpfairEntry[]> {
  if (cachedData) return cachedData;
  const res = await fetch(TAJWEED_JSON_URL, {
    next: { revalidate: 86400 * 7 },
  });
  if (!res.ok) throw new Error(`Tajweed data fetch failed: ${res.status}`);
  const data = (await res.json()) as CpfairEntry[];
  cachedData = data;
  return data;
}

/**
 * Returns tajwid segments for a verse using cpfair annotations.
 * Indices in the JSON are 0-based Unicode codepoint offsets within the verse text.
 * Uses Array.from for codepoint-safe slicing.
 * Fallback: if any annotation exceeds text length or reconstructed text doesn't match, returns single "normal" segment.
 */
export function buildTajwidSegments(
  arabicText: string,
  annotations: CpfairAnnotation[]
): TajwidSegment[] {
  const chars = Array.from(arabicText);
  const len = chars.length;
  if (len === 0) return [{ text: "", rule: "normal" }];
  if (annotations.length === 0) return [{ text: arabicText, rule: "normal" }];

  // Fallback: annotations were built for different text (e.g. Tanzil); if any index exceeds length, use normal
  const outOfRange = annotations.some((a) => a.start < 0 || a.end > len);
  if (outOfRange) return [{ text: arabicText, rule: "normal" }];

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: TajwidSegment[] = [];
  let pos = 0;

  for (const ann of sorted) {
    const start = Math.max(0, Math.min(ann.start, len));
    const end = Math.max(start, Math.min(ann.end, len));
    if (start > pos) {
      const gapText = chars.slice(pos, start).join("");
      if (gapText) segments.push({ text: gapText, rule: "normal" });
    }
    if (end > start) {
      const segmentText = chars.slice(start, end).join("");
      if (segmentText) segments.push({ text: segmentText, rule: mapRule(ann.rule) });
    }
    pos = end;
  }
  if (pos < len) {
    const tail = chars.slice(pos).join("");
    if (tail) segments.push({ text: tail, rule: "normal" });
  }

  const reconstructedLen = segments.reduce((sum, s) => sum + Array.from(s.text).length, 0);
  if (reconstructedLen !== len) return [{ text: arabicText, rule: "normal" }];

  return segments.length > 0 ? segments : [{ text: arabicText, rule: "normal" }];
}

/** Get annotations for one verse from loaded data */
export function getAnnotationsForVerse(
  data: CpfairEntry[],
  surah: number,
  ayah: number
): CpfairAnnotation[] {
  const entry = data.find((e) => e.surah === surah && e.ayah === ayah);
  return entry?.annotations ?? [];
}
