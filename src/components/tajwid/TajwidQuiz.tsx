"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgressStore } from "@/store/progressStore";
import type { QuizQuestion } from "@/data/tajwid-lessons";

type TajwidQuizProps = {
  quiz: QuizQuestion[];
  lessonSlug: string;
  nextLessonSlug: string | null;
  nextLessonTitle: string | null;
};

export function TajwidQuiz({
  quiz,
  lessonSlug,
  nextLessonSlug,
  nextLessonTitle,
}: TajwidQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const markStarted = useProgressStore((s) => s.markTajwidLessonStarted);
  const markCompleted = useProgressStore((s) => s.markTajwidLessonCompleted);

  const total = quiz.length;
  const question = quiz[currentIndex];
  const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;

  const handleSelect = (optionIndex: number) => {
    if (showFeedback) return;
    markStarted(lessonSlug);
    setSelectedIndex(optionIndex);
    setShowFeedback(true);
    if (optionIndex === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      const finalScore = score + (selectedIndex === question.correctIndex ? 1 : 0);
      markCompleted(lessonSlug, finalScore, total);
      setQuizFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
    setShowFeedback(false);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setScore(0);
    setQuizFinished(false);
  };

  if (quiz.length === 0) return null;

  if (quizFinished) {
    const totalCorrect = score + (selectedIndex === question.correctIndex ? 1 : 0);
    return (
      <section className="mb-8 space-y-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Kviz završen
        </h2>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
            Rezultat: {totalCorrect} / {total}
          </p>
          <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
            {totalCorrect === total
              ? "Odlično! Savladao/la si ovu lekciju."
              : totalCorrect >= total / 2
                ? "Dobro! Možeš ponoviti lekciju za još bolji rezultat."
                : "Ponovi lekciju i pokušaj ponovo."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Ponovi kviz
            </button>
            {nextLessonSlug && nextLessonTitle && (
              <Link
                href={`/tajwid/${nextLessonSlug}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Sljedeća lekcija: {nextLessonTitle}
                <span aria-hidden>→</span>
              </Link>
            )}
            <Link
              href="/tajwid"
              className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Sve lekcije
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Kviz
        </h2>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Pitanje {currentIndex + 1} od {total}
        </span>
      </div>
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
        <p className="font-medium text-stone-800 dark:text-stone-200">
          {question.question}
        </p>
        <ul className="mt-3 space-y-2">
          {question.options.map((opt, i) => {
            const chosen = selectedIndex === i;
            const correct = question.correctIndex === i;
            const showCorrect = showFeedback && correct;
            const showWrong = showFeedback && chosen && !correct;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={showFeedback}
                  className={`flex w-full gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                      : showWrong
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-[var(--theme-border)] bg-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50"
                  } ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-medium ${
                      showCorrect
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : showWrong
                          ? "border-red-400 bg-red-400 text-white"
                          : "border-stone-300 dark:border-stone-600"
                    }`}
                  >
                    {showFeedback && (showCorrect || showWrong)
                      ? showCorrect
                        ? "✓"
                        : "✗"
                      : String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {showFeedback && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">Objašnjenje:</p>
            <p className="mt-1">{question.explanation}</p>
            <button
              type="button"
              onClick={handleNext}
              className="mt-3 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {currentIndex + 1 >= total ? "Završi kviz" : "Sljedeće pitanje"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
