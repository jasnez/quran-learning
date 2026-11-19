/**
 * Time as words for screen readers, in Bosnian, e.g. "1 minuta i 15 sekundi".
 * Used as aria-valuetext of the seek slider: "0:42" would be read as digits and a colon.
 */

import { formatCount, type PluralForms } from "./format";

type GrammaticalCase = "nominative" | "genitive";

// "1 minuta" but "od 1 minute": one set of forms per grammatical case.
const MINUTE: Record<GrammaticalCase, PluralForms> = {
  nominative: { one: "minuta", few: "minute", other: "minuta" },
  genitive: { one: "minute", few: "minute", other: "minuta" },
};
const SECOND: Record<GrammaticalCase, PluralForms> = {
  nominative: { one: "sekunda", few: "sekunde", other: "sekundi" },
  genitive: { one: "sekunde", few: "sekunde", other: "sekundi" },
};

export function spokenDuration(seconds: number, grammaticalCase: GrammaticalCase = "nominative"): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes === 0) return formatCount(rest, SECOND[grammaticalCase]);
  const minutePart = formatCount(minutes, MINUTE[grammaticalCase]);
  return rest === 0 ? minutePart : `${minutePart} i ${formatCount(rest, SECOND[grammaticalCase])}`;
}

/** "42 sekunde od 1 minute i 15 sekundi" */
export function spokenPosition(position: number, length: number): string {
  return `${spokenDuration(position)} od ${spokenDuration(length, "genitive")}`;
}
