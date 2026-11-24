import { Fragment } from "react";

/** Arabic, Arabic Supplement, Arabic Extended-A and the two presentation-form blocks. */
const ARABIC_BLOCKS: [number, number][] = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];
const LETTER = `[${ARABIC_BLOCKS.map(([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`).join("")}]`;
/** A run of Arabic script; spaces between Arabic letters ("q t b") stay inside the run. */
const RUN = new RegExp(`${LETTER}+(?:\\s+${LETTER}+)*`, "gu");

export type TextRun = { text: string; ar: boolean };

/** Splits text into Latin text and runs of Arabic script, in order. */
export function splitArabicRuns(text: string): TextRun[] {
  const out: TextRun[] = [];
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), ar: false });
    out.push({ text: m[0], ar: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), ar: false });
  return out;
}

/**
 * Bosnian text that may contain Arabic letters or words: each Arabic run is marked lang="ar", so
 * screen readers use an Arabic voice, and isolated with <bdi>, so the bracket and comma around it
 * keep their places in the left-to-right sentence.
 */
export function WithArabic({ text }: { text: string }) {
  return (
    <>
      {splitArabicRuns(text).map((run, i) =>
        run.ar ? (
          <bdi key={i} lang="ar" className="font-arabic whitespace-nowrap">
            {run.text}
          </bdi>
        ) : (
          <Fragment key={i}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}
