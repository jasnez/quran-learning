"use client";

import { TestOption } from "./TestOption";
import { TestProgress } from "./TestProgress";
import type { TestQuestionModel } from "@/types/testMode";
import { getResolvedAudioUrl } from "@/lib/audio/getResolvedAudioUrl";
import { stripWaqfSigns } from "@/lib/quran/stripWaqfSigns";

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

      <div className="rounded-xl border border-line bg-surface p-4">
        <header className="mb-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Test pitanje {index + 1}
          </p>
          {question.type === "listen_identify" && (
            <p className="text-sm font-medium text-ink">
              Preslušaj ajet i odaberi tačan tekst.
            </p>
          )}
          {question.type === "complete_ayah" && (
            <p className="text-sm font-medium text-ink">
              Dovrši ajet odabirom ispravnog nastavka.
            </p>
          )}
          {question.type === "translation_match" && (
            <p className="text-sm font-medium text-ink">
              Nađi ispravan prevod za dati ajet.
            </p>
          )}
          {question.type === "tajwid_identify" && (
            <p className="text-sm font-medium text-ink">
              Prepoznaj koje se tedžvid pravilo primjenjuje.
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
              className="font-arabic text-2xl leading-relaxed text-right text-ink"
              dir="rtl"
            >
              {question.prefixText} ...
            </p>
          )}

          {question.type === "translation_match" && (
            <p
              className="font-arabic text-2xl leading-relaxed text-right text-ink"
              dir="rtl"
            >
              {stripWaqfSigns(question.arabicText)}
            </p>
          )}

          {question.type === "tajwid_identify" && (
            <p
              className="font-arabic text-2xl leading-relaxed text-right text-ink"
              dir="rtl"
            >
              <span className="rounded-md bg-accent-wash px-1.5 py-0.5 text-accent-text">
                {stripWaqfSigns(question.highlightedText)}
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
            <div className="mt-3 rounded-lg border border-line bg-highlight p-3 text-sm text-ink">
              <p className="font-medium">
                {selectedIndex === question.correctIndex
                  ? "Tačno!"
                  : "Nije tačno."}
              </p>
              <p className="mt-1">{question.explanation}</p>
              <button
                type="button"
                onClick={onNext}
                className="mt-3 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
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

