"use client";

import { TestOption } from "./TestOption";
import { TestProgress } from "./TestProgress";
import type { TestQuestionModel } from "@/types/testMode";
import { getResolvedAudioUrl } from "@/lib/audio/getResolvedAudioUrl";

type TestQuestionProps = {
  question: TestQuestionModel;
  index: number;
  total: number;
  selectedIndex: number | null;
  showFeedback: boolean;
  onSelect: (index: number) => void;
  onNext: () => void;
};

export function TestQuestion({
  question,
  index,
  total,
  selectedIndex,
  showFeedback,
  onSelect,
  onNext,
}: TestQuestionProps) {
  const handleSelect = (i: number) => {
    if (showFeedback) return;
    onSelect(i);
  };

  return (
    <section className="mb-6 space-y-4" aria-label="Pitanje testa">
      <TestProgress current={index + 1} total={total} />

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
        <header className="mb-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Test pitanje {index + 1}
          </p>
          {question.type === "listen_identify" && (
            <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
              Preslušaj ajet i odaberi tačan tekst.
            </p>
          )}
          {question.type === "complete_ayah" && (
            <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
              Dovrši ajet odabirom ispravnog nastavka.
            </p>
          )}
          {question.type === "translation_match" && (
            <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
              Nađi ispravan prevod za dati ajet.
            </p>
          )}
          {question.type === "tajwid_identify" && (
            <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
              Prepoznaj koje se tajwid pravilo primjenjuje.
            </p>
          )}
        </header>

        <div className="space-y-4">
          {question.type === "listen_identify" && (
            <div className="flex flex-col gap-2">
              <audio
                src={getResolvedAudioUrl(question.audioUrl) ?? question.audioUrl}
                controls
                preload="auto"
                data-testid="listen-audio"
              />
            </div>
          )}

          {question.type === "complete_ayah" && (
            <p
              className="font-arabic text-2xl leading-relaxed text-right text-stone-900 dark:text-stone-50"
              dir="rtl"
            >
              {question.prefixText} ...
            </p>
          )}

          {question.type === "translation_match" && (
            <p
              className="font-arabic text-2xl leading-relaxed text-right text-stone-900 dark:text-stone-50"
              dir="rtl"
            >
              {question.arabicText}
            </p>
          )}

          {question.type === "tajwid_identify" && (
            <p
              className="font-arabic text-2xl leading-relaxed text-right text-stone-900 dark:text-stone-50"
              dir="rtl"
            >
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                {question.highlightedText}
              </span>
            </p>
          )}

          <ul className="space-y-2">
            {question.options.map((opt, i) => (
              <li key={i}>
                <TestOption
                  index={i}
                  label={opt}
                  onSelect={handleSelect}
                  disabled={showFeedback}
                  isSelected={selectedIndex === i}
                  isCorrect={question.correctIndex === i}
                  showFeedback={showFeedback}
                />
              </li>
            ))}
          </ul>

          {showFeedback && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-medium">
                {selectedIndex === question.correctIndex
                  ? "Tačno!"
                  : "Nije tačno."}
              </p>
              <p className="mt-1">{question.explanation}</p>
              <button
                type="button"
                onClick={onNext}
                className="mt-3 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Sljedeće
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

