"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TajwidRule } from "@/types/quran";
import { tajwidRuleClasses, tajwidRuleLessonSlugs, tajwidRuleLineClasses, tajwidRuleNames } from "@/lib/quran/tajwidStyles";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";

type ColoredRule = Exclude<TajwidRule, "normal">;

/** One row per color, by what the voice does; ihfa shares the gunne green. */
const ROWS: { color: string; voice: string; rules: ColoredRule[] }[] = [
  { color: "Crveno", voice: "produži", rules: ["mad"] },
  { color: "Zeleno", voice: "kroz nos", rules: ["ghunnah", "ikhfa"] },
  { color: "Plavo", voice: "odskok", rules: ["qalqalah"] },
];

/**
 * The key to the tajwid colors, and the keyboard and screen-reader path to the rule lessons: the
 * colored letters in the ayah text are not focusable, the rule names here are links.
 */
export function TajwidLegend() {
  const [open, setOpen] = useState(false);
  const tajwidNoticeSeen = useSettingsStore((s) => s.tajwidNoticeSeen);
  const showLines = useSettingsStore((s) => s.showTajwidLines);
  const markTajwidNoticeSeen = useSettingsStore((s) => s.markTajwidNoticeSeen);
  const showToast = useToastStore((s) => s.showToast);

  // The legend is shown only with the colors on: the right moment to say the colors changed.
  useEffect(() => {
    // Only an explicit false: the flag is missing in tests that stub part of the store.
    if (tajwidNoticeSeen !== false) return;
    showToast("Boje su sada kao u tedžvidskom mushafu.");
    markTajwidNoticeSeen();
  }, [tajwidNoticeSeen, markTajwidNoticeSeen, showToast]);

  return (
    <section className="rounded-xl border border-line bg-paper/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 py-2.5 text-sm text-ink-muted hover:text-ink"
        aria-expanded={open}
        aria-controls="tajwid-legend-panel"
        id="tajwid-legend-toggle"
      >
        <span aria-hidden className="text-ink-muted">
          {open ? "▼" : "▶"}
        </span>
        Šta znače boje
      </button>
      <div
        id="tajwid-legend-panel"
        role="region"
        aria-labelledby="tajwid-legend-toggle"
        aria-hidden={!open}
        inert={!open}
        className={`overflow-hidden transition-[max-height] duration-200 ease-out ${
          open ? "max-h-96 border-t border-line" : "max-h-0"
        }`}
      >
        <p className="px-4 pt-3 text-xs text-ink-muted">
          Boje pokazuju četiri pravila izgovora. Ostala pravila nisu obojena.
        </p>
        <p className="px-4 pt-1 text-xs text-ink-muted">Dodirni obojeni harf za naziv pravila.</p>
        <ul className="space-y-2.5 p-4 list-none" role="list">
          {ROWS.map((row) => (
            <li key={row.color} className="flex items-start gap-3 text-sm text-ink">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-base leading-none ${tajwidRuleClasses[row.rules[0]]}`}
                style={{ fontFamily: "sans-serif" }}
                aria-hidden
              >
                •
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{row.color}</span>: {row.voice} (
                {row.rules.map((rule, i) => (
                  <span key={rule}>
                    {i > 0 && ", "}
                    {showLines && (
                      <span
                        data-tj-line-sample={rule}
                        aria-hidden="true"
                        className={`mr-1 ${tajwidRuleClasses[rule]} ${tajwidRuleLineClasses[rule]}`}
                      >
                        &nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                    )}
                    <Link
                      href={`/tajwid/${tajwidRuleLessonSlugs[rule]}`}
                      className="text-accent-text underline underline-offset-2"
                    >
                      {tajwidRuleNames[rule].toLowerCase()}
                    </Link>
                  </span>
                ))}
                )
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
