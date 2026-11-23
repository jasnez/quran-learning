"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isTajwidQuizPassed, tajwidQuizPassScore, useProgressStore } from "@/store/progressStore";
import { formatCount, type PluralForms } from "@/lib/format";
import type { QuizQuestion } from "@/data/tajwid-lessons";

type TajwidQuizProps = {
  quiz: QuizQuestion[];
  lessonSlug: string;
  nextLessonSlug: string | null;
  nextLessonTitle: string | null;
};

const CORRECT_ANSWER_FORMS: PluralForms = {
  one: "tačan odgovor",
  few: "tačna odgovora",
  other: "tačnih odgovora",
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
  const [announcement, setAnnouncement] = useState("");
  const finishedHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const retriedRef = useRef(false);

  // "Ponovi kviz" unmounts with the result, so focus moves to the first question.
  useEffect(() => {
    if (quizFinished) {
      finishedHeadingRef.current?.focus();
    } else if (retriedRef.current) {
      retriedRef.current = false;
      questionRef.current?.focus();
    }
  }, [quizFinished]);

  // "Sljedeće pitanje" unmounts with the feedback, so focus moves to the new question.
  useEffect(() => {
    if (currentIndex > 0) questionRef.current?.focus();
  }, [currentIndex]);

  const markStarted = useProgressStore((s) => s.markTajwidLessonStarted);
  const recordResult = useProgressStore((s) => s.recordTajwidQuizResult);

  const total = quiz.length;
  const question = quiz[currentIndex];

  const handleSelect = (optionIndex: number) => {
    if (showFeedback) return;
    markStarted(lessonSlug);
    setSelectedIndex(optionIndex);
    setShowFeedback(true);
    if (optionIndex === question.correctIndex) {
      setScore((s) => s + 1);
      setAnnouncement("Tačno.");
    } else {
      const letter = String.fromCharCode(65 + question.correctIndex);
      setAnnouncement(
        `Nije tačno. Tačan odgovor je ${letter}: ${question.options[question.correctIndex]}.`,
      );
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      const finalScore = score;
      recordResult(lessonSlug, finalScore, total);
      setQuizFinished(true);
      setAnnouncement("");
      return;
    }
    setCurrentIndex((i) => i + 1);
    setAnnouncement("");
    setSelectedIndex(null);
    setShowFeedback(false);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setScore(0);
    setAnnouncement("");
    retriedRef.current = true;
    setQuizFinished(false);
  };

  if (quiz.length === 0) return null;

  // One node in both views, so the live region is never mounted together with its text.
  const statusRegion = (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  if (quizFinished) {
    const totalCorrect = score;
    return (
      <>
        {statusRegion}
      <section className="mb-8 space-y-4">
        <h2
          ref={finishedHeadingRef}
          tabIndex={-1}
          className="text-base font-semibold text-ink focus-visible:outline-hidden"
        >
          Kviz završen
        </h2>
        <div className="rounded-2xl border border-line bg-accent-wash p-5 text-center">
          <p className="text-lg font-semibold text-accent-text">
            Rezultat: {totalCorrect} / {total}
          </p>
          <p className="mt-1 text-sm text-accent-text">
            {totalCorrect === total
              ? "Sve je tačno. Lekcija je savladana. Mašallah!"
              : isTajwidQuizPassed(totalCorrect, total)
                ? "Lekcija je savladana. Mašallah! Kviz možeš ponoviti kad god hoćeš."
                : `Za završetak lekcije treba najmanje ${formatCount(tajwidQuizPassScore(total), CORRECT_ANSWER_FORMS)} od ${total}. Pročitaj lekciju još jednom pa ponovi kviz.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
            >
              Ponovi kviz
            </button>
            {nextLessonSlug && nextLessonTitle && (
              <Link
                href={`/tajwid/${nextLessonSlug}`}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
              >
                Sljedeća lekcija: {nextLessonTitle}
              </Link>
            )}
            <Link
              href="/tajwid"
              className="rounded-full border border-line px-4 py-2 text-sm text-ink-muted hover:bg-surface-sunken"
            >
              Sve lekcije
            </Link>
          </div>
        </div>
      </section>
      </>
    );
  }

  return (
    <>
      {statusRegion}
    <section className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">
          Kviz
        </h2>
        <span className="text-xs text-ink-muted">
          Pitanje {currentIndex + 1} od {total}
        </span>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p
          ref={questionRef}
          tabIndex={-1}
          className="font-medium text-ink focus-visible:outline-hidden"
        >
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
                  aria-disabled={showFeedback}
                  className={`flex w-full gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    showCorrect
                      ? "border-accent-text bg-accent-wash"
                      : showWrong
                        ? "border-danger-text bg-surface-sunken"
                        : "border-line bg-transparent hover:bg-surface-sunken"
                  } ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-medium ${
                      showCorrect
                        ? "border-accent-text bg-accent text-on-accent"
                        : showWrong
                          ? "border-danger-text bg-danger text-on-accent"
                          : "border-line-strong"
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
          <div className="mt-4 rounded-lg border border-line bg-highlight p-3 text-sm text-warning-text">
            <p className="font-medium">Objašnjenje:</p>
            <p className="mt-1">{question.explanation}</p>
            <button
              type="button"
              onClick={handleNext}
              className="mt-3 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              {currentIndex + 1 >= total ? "Završi kviz" : "Sljedeće pitanje"}
            </button>
          </div>
        )}
      </div>
    </section>
    </>
  );
}
