"use client";

import { useState } from "react";
import type { TajwidRule } from "@/types/quran";
import { tajwidRuleClasses, tajwidRuleDescriptions, tajwidRuleNames } from "@/lib/quran/tajwidStyles";

const TAJWID_RULES: TajwidRule[] = ["normal", "mad", "ghunnah", "ikhfa", "qalqalah"];

function describe(rule: TajwidRule): string {
  const text = tajwidRuleDescriptions[rule];
  return text ? `${text[0].toUpperCase()}${text.slice(1)}.` : "";
}

export function TajwidLegend() {
  const [open, setOpen] = useState(false);

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
        className={`overflow-hidden transition-[max-height] duration-200 ease-out ${
          open ? "max-h-96 border-t border-line" : "max-h-0"
        }`}
      >
        <p className="px-4 pt-3 text-xs text-ink-muted">
          Boje pokazuju četiri pravila izgovora. Ostala pravila nisu obojena.
        </p>
        <ul className="space-y-2.5 p-4 list-none" role="list">
          {TAJWID_RULES.map((rule) => (
            <li
              key={rule}
              className="flex items-start gap-3 text-sm"
            >
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-base leading-none ${tajwidRuleClasses[rule]}`}
                style={{ fontFamily: "sans-serif" }}
                aria-hidden
              >
                •
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-ink">
                  {tajwidRuleNames[rule]}
                </span>
                {rule !== "normal" && (
                  <p className="mt-0.5 text-ink-muted">{describe(rule)}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
