"use client";

import Link from "next/link";
import { useProgressStore } from "@/store/progressStore";
import { tajwidRuleClasses, tajwidRuleLabels } from "@/lib/quran/tajwidStyles";
import type { TajwidLesson } from "@/data/tajwid-lessons";

export function TajwidLessonCard({ lesson, index }: { lesson: TajwidLesson; index: number }) {
  const status = useProgressStore((s) => s.getTajwidLessonStatus(lesson.slug));
  const colorClass = tajwidRuleClasses[lesson.ruleType];

  const statusLabel =
    status?.status === "completed"
      ? "Završeno"
      : status?.status === "in_progress"
        ? "U toku"
        : "Nije započeto";

  const statusIcon =
    status?.status === "completed" ? (
      <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>✓</span>
    ) : status?.status === "in_progress" ? (
      <span className="text-amber-600 dark:text-amber-400" aria-hidden>○</span>
    ) : null;

  return (
    <article
      className="group rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 shadow-sm transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Lekcija {index + 1}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-50">
            <Link
              href={`/tajwid/${lesson.slug}`}
              className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {lesson.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {lesson.subtitle}
          </p>
        </div>
        <span
          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium bg-stone-100 dark:bg-stone-800 ${colorClass}`}
        >
          {tajwidRuleLabels[lesson.ruleType]}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span className="inline-flex items-center gap-1.5">
          {statusIcon}
          {statusLabel}
          {status?.status === "completed" &&
            status.quizScore != null &&
            status.quizTotal != null && (
              <span className="text-stone-400 dark:text-stone-500">
                ({status.quizScore}/{status.quizTotal})
              </span>
            )}
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
          <span>Otvori lekciju</span>
          <span aria-hidden>→</span>
        </span>
      </div>
    </article>
  );
}
