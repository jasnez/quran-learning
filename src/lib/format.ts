/**
 * Numbers, plurals and relative time in Bosnian via Intl. Croatian is the fallback locale:
 * it has the same plural categories and number format (checked in format.test.ts).
 */

export const LOCALES: readonly string[] = ["bs", "hr"];

export type PluralForms = Readonly<{ one: string; few: string; other: string }>;

export const AYAH_FORMS: PluralForms = { one: "ajet", few: "ajeta", other: "ajeta" };
export const SURAH_FORMS: PluralForms = { one: "sura", few: "sure", other: "sura" };

const pluralRules = new Intl.PluralRules([...LOCALES]);
const numberFormat = new Intl.NumberFormat([...LOCALES]);
const relativeTimeFormat = new Intl.RelativeTimeFormat([...LOCALES], { numeric: "auto" });

/** The form for n; any category other than one and few reads as `other`. */
export function pluralForm(n: number, forms: PluralForms): string {
  const category = pluralRules.select(n);
  if (category === "one") return forms.one;
  if (category === "few") return forms.few;
  return forms.other;
}

/** "6.236", "0,75". */
export function formatNumber(n: number): string {
  return numberFormat.format(n);
}

/** "1 ajet", "2 ajeta", "1.234 ajeta". */
export function formatCount(n: number, forms: PluralForms): string {
  return `${formatNumber(n)} ${pluralForm(n, forms)}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "sada", "prije 5 minuta", "jučer", "prošle sedmice"; "" when the timestamp is missing or invalid. */
export function formatTimeAgo(isoTimestamp: string, now: number = Date.now()): string {
  const time = Date.parse(isoTimestamp);
  if (Number.isNaN(time)) return "";
  const elapsed = now - time;
  if (elapsed < MINUTE_MS) return relativeTimeFormat.format(0, "second");
  if (elapsed < HOUR_MS) return relativeTimeFormat.format(-Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return relativeTimeFormat.format(-Math.floor(elapsed / HOUR_MS), "hour");
  const days = Math.floor(elapsed / DAY_MS);
  if (days < 7) return relativeTimeFormat.format(-days, "day");
  if (days < 30) return relativeTimeFormat.format(-Math.floor(days / 7), "week");
  if (days < 365) return relativeTimeFormat.format(-Math.floor(days / 30), "month");
  return relativeTimeFormat.format(-Math.floor(days / 365), "year");
}
