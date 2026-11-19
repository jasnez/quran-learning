/**
 * Numbers, plurals and relative time in Bosnian.
 *
 * Chrome and Edge (157, Windows) list "bs" in `supportedLocalesOf` and resolve it, but format
 * numbers and relative time with root data: 6236.75 -> "6,236.75", -3 hours -> "-3 h",
 * -1 day -> "yesterday". Their Bosnian plural rules are right. So:
 * - numbers: the locale is chosen once, by its output: "bs" when it formats 1234.5 as
 *   "1.234,5", otherwise Croatian, which has the same number format and plural categories
 *   (D1, checked in format.test.ts);
 * - relative time: no Intl.RelativeTimeFormat; the phrases are built here from plural forms,
 *   and format.test.ts checks them against Node's full ICU Bosnian data.
 */

export const LOCALES: readonly string[] = ["bs", "hr"];

export type PluralForms = Readonly<{ one: string; few: string; other: string }>;

export const AYAH_FORMS: PluralForms = { one: "ajet", few: "ajeta", other: "ajeta" };
export const SURAH_FORMS: PluralForms = { one: "sura", few: "sure", other: "sura" };

const pluralRules = new Intl.PluralRules([...LOCALES]);

// By output, not by supportedLocalesOf or resolvedOptions: Chrome reports "bs" in both.
const bosnianNumberFormat = new Intl.NumberFormat("bs");
const numberFormat =
  bosnianNumberFormat.format(1234.5) === "1.234,5" ? bosnianNumberFormat : new Intl.NumberFormat("hr");

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

type TimeUnit = "minute" | "hour" | "day" | "week" | "month" | "year";

/** The noun after "prije {n}". */
const TIME_UNIT_FORMS: Readonly<Record<TimeUnit, PluralForms>> = {
  minute: { one: "minutu", few: "minute", other: "minuta" },
  hour: { one: "sat", few: "sata", other: "sati" },
  day: { one: "dan", few: "dana", other: "dana" },
  week: { one: "sedmicu", few: "sedmice", other: "sedmica" },
  month: { one: "mjesec", few: "mjeseca", other: "mjeseci" },
  year: { one: "godinu", few: "godine", other: "godina" },
};

/** Words instead of a number, as ICU says them with `numeric: "auto"`. */
const NAMED_PAST: Readonly<Partial<Record<TimeUnit, Readonly<Record<number, string>>>>> = {
  day: { 1: "jučer", 2: "prekjučer" },
  week: { 1: "prošle sedmice" },
  month: { 1: "prošli mjesec" },
  year: { 1: "prošle godine" },
};

/** n (1 or more) units ago: "prije 5 minuta", "jučer". Exported for the ICU check in format.test.ts. */
export function relativePhrase(n: number, unit: TimeUnit): string {
  return NAMED_PAST[unit]?.[n] ?? `prije ${formatCount(n, TIME_UNIT_FORMS[unit])}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "sada", "prije 5 minuta", "jučer", "prošle sedmice"; "" when the timestamp is missing or invalid. */
export function formatTimeAgo(isoTimestamp: string, now: number = Date.now()): string {
  const time = Date.parse(isoTimestamp);
  if (Number.isNaN(time)) return "";
  const elapsed = now - time;
  if (elapsed < MINUTE_MS) return "sada";
  if (elapsed < HOUR_MS) return relativePhrase(Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return relativePhrase(Math.floor(elapsed / HOUR_MS), "hour");
  const days = Math.floor(elapsed / DAY_MS);
  if (days < 7) return relativePhrase(days, "day");
  if (days < 30) return relativePhrase(Math.floor(days / 7), "week");
  if (days < 365) return relativePhrase(Math.floor(days / 30), "month");
  return relativePhrase(Math.floor(days / 365), "year");
}
