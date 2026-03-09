"use client";

import Link from "next/link";
import type { TestType } from "@/types/testMode";

type TestResultProps = {
  score: number;
  total: number;
  surahName: string;
  testType: TestType;
  nextTestType?: TestType | null;
  onRetry: () => void;
  onNextType?: () => void;
};

function getTypeLabel(type: TestType): string {
  switch (type) {
    case "listen_identify":
      return "Preslušaj i prepoznaj";
    case "complete_ayah":
      return "Dovrši ajet";
    case "translation_match":
      return "Prevod";
    case "tajwid_identify":
      return "Tajwid pravilo";
    default:
      return "Test";
  }
}

export function TestResult({
  score,
  total,
  surahName,
  testType,
  nextTestType,
  onRetry,
  onNextType,
}: TestResultProps) {
  const ratio = total > 0 ? score / total : 0;
  const typeLabel = getTypeLabel(testType);

  let message: string;
  if (ratio === 1) {
    message = "Odlično! Savladao/la si ovaj test.";
  } else if (ratio >= 0.6) {
    message = "Vrlo dobro! Uz malo ponavljanja bit će još bolje.";
  } else {
    message = "Super je što vježbaš – probaj još jednom i pratit ćeš napredak.";
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
        Rezultat testa
      </h2>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {surahName} · {typeLabel}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
          {score} / {total}
        </p>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Ponovi ovaj test
          </button>
          {nextTestType && onNextType && (
            <button
              type="button"
              onClick={onNextType}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Sljedeći tip testa
              <span aria-hidden>→</span>
            </button>
          )}
          <Link
            href="/progress"
            className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Vidi svoj napredak
          </Link>
        </div>
      </div>
    </section>
  );
}

