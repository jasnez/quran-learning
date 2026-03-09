import Link from "next/link";
import { getAllTajwidLessons } from "@/data/tajwid-lessons";
import { tajwidRuleClasses, tajwidRuleLabels } from "@/lib/quran/tajwidStyles";

export default async function TajwidLessonsPage() {
  const lessons = await getAllTajwidLessons();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
          Tajwid lekcije
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Kratke, fokusirane lekcije koje te vode kroz najvažnija pravila
          tedžvida uz primjere, praksu i mini kviz na kraju.
        </p>
      </header>

      <section className="grid gap-4 sm:gap-5">
        {lessons.map((lesson, index) => {
          const colorClass = tajwidRuleClasses[lesson.ruleType];
          const statusLabel = "Nije započeto";

          return (
            <article
              key={lesson.id}
              className="group rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 shadow-sm transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Lekcija {index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-50">
                    <Link href={`/tajwid/${lesson.id}`} className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300">
                      {lesson.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {lesson.description}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium bg-stone-100 dark:bg-stone-800 ${colorClass}`}
                >
                  {tajwidRuleLabels[lesson.ruleType]}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>{statusLabel}</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  <span>Otvori lekciju</span>
                  <span aria-hidden>→</span>
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

