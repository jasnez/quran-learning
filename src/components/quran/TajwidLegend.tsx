"use client";

import { useState } from "react";
import Link from "next/link";
import type { TajwidRule } from "@/types/quran";
import { tajwidRuleClasses, tajwidRuleLessonSlugs, tajwidRuleLineClasses, tajwidRuleNames } from "@/lib/quran/tajwidStyles";
import { useSettingsStore } from "@/store/settingsStore";

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
 * It sits in the settings sheet under the tajwid choice (Phase 4, D5); the one-time notice about
 * the colors is fired by the reading screens (useTajwidNotice).
 */
export function TajwidLegend({ onNavigate }: { /** A lesson link was followed: a sheet around the legend closes. */ onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const showLines = useSettingsStore((s) => s.showTajwidLines);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 items-center gap-2 text-sm font-semibold text-accent-text hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        aria-expanded={open}
        aria-controls="tajwid-legend-panel"
        id="tajwid-legend-toggle"
      >
        <span aria-hidden className="text-xs">
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
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <p className="pt-1 text-[0.8125rem] text-ink-muted">
          Boje pokazuju četiri pravila izgovora. Ostala pravila nisu obojena.
        </p>
        <p className="pt-1 text-[0.8125rem] text-ink-muted">Dodirni obojeni harf za naziv pravila.</p>
        <ul className="list-none space-y-2.5 py-3" role="list">
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
                        className={`tj-line-sample mr-1 ${tajwidRuleClasses[rule]} ${tajwidRuleLineClasses[rule]}`}
                      >
                        &nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                    )}
                    <Link
                      href={`/tajwid/${tajwidRuleLessonSlugs[rule]}`}
                      onClick={onNavigate}
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
