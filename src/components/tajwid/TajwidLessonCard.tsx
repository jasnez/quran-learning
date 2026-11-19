"use client";

import Link from "next/link";
import { useProgressStore } from "@/store/progressStore";
import { tajwidRuleLabelClasses, tajwidRuleLabels } from "@/lib/quran/tajwidStyles";
import type { TajwidLesson } from "@/data/tajwid-lessons";

export function TajwidLessonCard({ lesson, index }: { lesson: TajwidLesson; index: number }) {
  const status = useProgressStore((s) => s.tajwidLessonProgress[lesson.slug]);
  const colorClass = tajwidRuleLabelClasses[lesson.ruleType];

  const statusLabel =
    status?.status === "completed"
      ? "Završeno"
      : status?.status === "in_progress"
        ? "U toku"
        : "Nije započeto";

  const statusIcon =
    status?.status === "completed" ? (
      <span className="text-success-text" aria-hidden>✓</span>
    ) : status?.status === "in_progress" ? (
      <span className="text-ink-muted" aria-hidden>○</span>
    ) : null;

  return (
    <Link
      href={`/tajwid/${lesson.slug}`}
      className="group block rounded-2xl border border-line bg-surface p-4 shadow-sm transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Lekcija {index + 1}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink group-hover:text-accent-text">
            {lesson.title}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {lesson.subtitle}
          </p>
        </div>
        <span
          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium bg-surface ring-1 ring-inset ring-line ${colorClass}`}
        >
          {tajwidRuleLabels[lesson.ruleType]}
        </span>
      </div>
      <div className="mt-4 flex items-center text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          {statusIcon}
          {statusLabel}
          {status?.quizScore != null &&
            status.quizTotal != null && (
              <span className="text-ink-muted">
                ({status.quizScore}/{status.quizTotal})
              </span>
            )}
        </span>
      </div>
    </Link>
  );
}
