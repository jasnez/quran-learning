import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllTajwidLessons,
  getTajwidLessonBySlug,
} from "@/data/tajwid-lessons";
import { tajwidRuleClasses } from "@/lib/quran/tajwidStyles";
import { TajwidQuiz } from "@/components/tajwid/TajwidQuiz";
import { LessonProgressTracker } from "@/components/tajwid/LessonProgressTracker";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const lesson = await getTajwidLessonBySlug(lessonId);
  if (!lesson) notFound();

  const all = await getAllTajwidLessons();
  const index = all.findIndex((l) => l.id === lesson.id);
  const prevLesson = index > 0 ? all[index - 1] : null;
  const nextLesson = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const ruleClass = tajwidRuleClasses[lesson.ruleType];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <LessonProgressTracker lessonSlug={lesson.slug} />
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Tajwid lekcija
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {lesson.subtitle}
        </p>
      </header>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Uvod
        </h2>
        {lesson.sections.introduction.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Šta je ovo pravilo?
        </h2>
        {lesson.sections.definition.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Kada nastaje?
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {lesson.sections.whenItOccurs.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </section>

      {lesson.sections.howToProduce && (
        <section className="mb-8 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
            Kako proizvesti ovaj zvuk
          </h2>
          <ol className="list-decimal space-y-1 pl-5">
            {lesson.sections.howToProduce.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="mb-8 space-y-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Primjeri
        </h2>
        {lesson.sections.examples.map((ex, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4"
          >
            <p
              className={`font-arabic text-2xl leading-relaxed text-center ${ruleClass}`}
              dir="rtl"
            >
              {ex.arabic}
            </p>
            <p
              className="mt-2 text-center text-sm text-stone-500 dark:text-stone-400"
              dir="ltr"
            >
              {ex.transliteration}
            </p>
            <p className="mt-1 text-center text-xs text-stone-500 dark:text-stone-400">
              {ex.translation}
            </p>
            <p className="mt-2 text-center text-xs font-medium text-stone-600 dark:text-stone-300">
              {ex.rule}
            </p>
          </div>
        ))}
      </section>

      {lesson.sections.practiceAyahs && lesson.sections.practiceAyahs.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
            Vježba na pravim ajetima
          </h2>
          <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
            {lesson.sections.practiceAyahs.map((p, idx) => (
              <li key={idx}>
                <Link
                  href={`/surah/${p.surah}?ayah=${p.ayah}`}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  <span>
                    Sura {p.surah}, ajet {p.ayah}
                  </span>
                  <span aria-hidden>↗</span>
                </Link>
                {p.description && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {p.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.sections.tip && (
        <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          <h2 className="text-sm font-semibold">
            {lesson.sections.tip.title}
          </h2>
          <p className="mt-1">{lesson.sections.tip.text}</p>
        </section>
      )}

      <section className="mb-8 space-y-3">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Kviz
        </h2>
        <TajwidQuiz
          quiz={lesson.quiz}
          lessonSlug={lesson.slug}
          nextLessonSlug={nextLesson?.slug ?? null}
          nextLessonTitle={nextLesson?.title ?? null}
        />
      </section>

      <section className="mb-6 text-sm text-stone-700 dark:text-stone-300">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Sažetak
        </h2>
        <p className="mt-1">{lesson.summary}</p>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--theme-border)] pt-4 text-sm">
        <div className="flex items-center gap-2">
          {prevLesson && (
            <Link
              href={`/tajwid/${prevLesson.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <span aria-hidden>←</span>
              <span>Prethodna: {prevLesson.title}</span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tajwid"
            className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Sve lekcije
          </Link>
          {nextLesson && (
            <Link
              href={`/tajwid/${nextLesson.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              <span>Sljedeća: {nextLesson.title}</span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}

