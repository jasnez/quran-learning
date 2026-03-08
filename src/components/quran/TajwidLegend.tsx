"use client";

import { useState } from "react";
import type { TajwidRule } from "@/types/quran";
import { tajwidRuleClasses, tajwidRuleLabels } from "@/lib/quran/tajwidStyles";

const TAJWID_RULES: TajwidRule[] = ["normal", "mad", "ghunnah", "ikhfa", "qalqalah"];

const ruleDisplayNames: Record<TajwidRule, string> = {
  normal: "Normalan",
  mad: "Mad",
  ghunnah: "Ghunnah",
  ikhfa: "Ikhfa",
  qalqalah: "Qalqalah",
};

export function TajwidLegend() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-stone-200/80 bg-stone-50/60 dark:border-stone-700/80 dark:bg-stone-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 py-2.5 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
        aria-expanded={open}
        aria-controls="tajwid-legend-panel"
        id="tajwid-legend-toggle"
      >
        <span aria-hidden className="text-stone-400 dark:text-stone-500">
          {open ? "▼" : "▶"}
        </span>
        Legenda tajwida
      </button>
      <div
        id="tajwid-legend-panel"
        role="region"
        aria-labelledby="tajwid-legend-toggle"
        aria-hidden={!open}
        className={`overflow-hidden transition-[max-height] duration-200 ease-out ${
          open ? "max-h-96 border-t border-stone-200/80 dark:border-stone-700/80" : "max-h-0"
        }`}
      >
        <p className="px-4 pt-3 text-xs text-stone-500 dark:text-stone-400">
          Boje se prikazuju kada u podacima ajeta postoje anotacije (mad, ghunnah, ikhfa, qalqalah). Ako ajet nema anotacije, cijeli tekst ostaje uobičajene boje.
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
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {ruleDisplayNames[rule]}
                </span>
                <p className="mt-0.5 text-stone-600 dark:text-stone-400">
                  {tajwidRuleLabels[rule]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
