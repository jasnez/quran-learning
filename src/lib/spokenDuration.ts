/**
 * Time as words for screen readers, in Bosnian, e.g. "1 minuta i 15 sekundi".
 * Used as aria-valuetext of the seek slider: "0:42" would be read as digits and a colon.
 */

type GrammaticalCase = "nominative" | "genitive";

// [one, few (2-4), many] for each case; "1 minuta" but "od 1 minute".
const MINUTE = { nominative: ["minuta", "minute", "minuta"], genitive: ["minute", "minute", "minuta"] };
const SECOND = { nominative: ["sekunda", "sekunde", "sekundi"], genitive: ["sekunde", "sekunde", "sekundi"] };

function form(n: number, forms: Record<GrammaticalCase, string[]>, grammaticalCase: GrammaticalCase): string {
  const lastTwo = n % 100;
  const last = n % 10;
  const [one, few, many] = forms[grammaticalCase];
  if (last === 1 && lastTwo !== 11) return `${n} ${one}`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function spokenDuration(seconds: number, grammaticalCase: GrammaticalCase = "nominative"): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes === 0) return form(rest, SECOND, grammaticalCase);
  const minutePart = form(minutes, MINUTE, grammaticalCase);
  return rest === 0 ? minutePart : `${minutePart} i ${form(rest, SECOND, grammaticalCase)}`;
}

/** "42 sekunde od 1 minute i 15 sekundi" */
export function spokenPosition(position: number, length: number): string {
  return `${spokenDuration(position)} od ${spokenDuration(length, "genitive")}`;
}
