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
      return "Prijevod";
    case "tajwid_identify":
      return "Tedžvid pravilo";
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
    message = "Odlično! Test je savladan.";
  } else if (ratio >= 0.6) {
    message = "Vrlo dobro! Uz malo ponavljanja bit će još bolje.";
  } else {
    message = "Super je što vježbaš – probaj još jednom i pratit ćeš napredak.";
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-ink">
        Rezultat testa
      </h2>
      <div className="rounded-2xl border border-line bg-accent-wash p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-text">
          {surahName} · {typeLabel}
        </p>
        <p className="mt-2 text-2xl font-semibold text-ink">
          {score} / {total}
        </p>
        <p className="mt-2 text-sm text-ink">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            Ponovi ovaj test
          </button>
          {nextTestType && onNextType && (
            <button
              type="button"
              onClick={onNextType}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              Sljedeći tip testa
              <span aria-hidden>→</span>
            </button>
          )}
          <Link
            href="/progress"
            className="rounded-full border border-line px-4 py-2 text-sm text-ink-muted hover:bg-surface-sunken"
          >
            Vidi svoj napredak
          </Link>
        </div>
      </div>
    </section>
  );
}

