import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllTajwidLessons,
  getTajwidLessonById,
} from "@/data/tajwid-lessons";
import { tajwidRuleClasses, tajwidRuleLabels } from "@/lib/quran/tajwidStyles";

type LessonPageProps = {
  params: { lessonId: string };
};

export default async function LessonPage({ params }: LessonPageProps) {
  const lesson = await getTajwidLessonById(params.lessonId);
  if (!lesson) notFound();

  const all = await getAllTajwidLessons();
  const index = all.findIndex((l) => l.id === lesson.id);
  const prevLesson = index > 0 ? all[index - 1] : null;
  const nextLesson = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const ruleClass = tajwidRuleClasses[lesson.ruleType];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Tajwid lekcija
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
          {lesson.title}
        </h1>
        <p
          className={`mt-1 text-xl font-medium leading-snug ${ruleClass}`}
          dir="rtl"
        >
          {lesson.titleArabic}
        </p>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
          {lesson.description}
        </p>
      </header>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Objašnjenje
        </h2>
        <p>{lesson.explanation}</p>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Primjeri
        </h2>
        {lesson.examples.map((ex, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4"
          >
            <p
              className={`font-arabic text-2xl leading-relaxed text-center ${ruleClass}`}
              dir="rtl"
            >
              {ex.arabicText}
            </p>
            <p
              className="mt-2 text-center text-sm text-stone-500 dark:text-stone-400"
              dir="ltr"
            >
              {ex.transliteration}
            </p>
            <audio
              className="mt-3 w-full"
              controls
              preload="none"
              src={ex.audioUrl}
            />
          </div>
        ))}
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Vježba na pravim ajetima
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Otvori suru u čitaču, pronađi navedeni ajet i pokušaj uočiti dio gdje
          se primjenjuje pravilo{" "}
          <span className={ruleClass}>{tajwidRuleLabels[lesson.ruleType]}</span>.
        </p>
        <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
          {lesson.practiceAyahs.map((p, idx) => (
            <li key={idx}>
              <Link
                href={`/surah/${p.surahNumber}?ayah=${p.ayahNumber}`}
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-300"
              >
                <span>
                  Sura {p.surahNumber}, ajet {p.ayahNumber}
                </span>
                <span aria-hidden>↗</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Kviz
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Odgovori u sebi ili zajedno s učiteljem – cilj je ponavljanje, a ne
          ocjena.
        </p>
        <ol className="space-y-4 text-sm text-stone-700 dark:text-stone-300">
          {lesson.quiz.map((q, idx) => (
            <li key={idx} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
              <p className="font-medium">{q.question}</p>
              <ul className="mt-2 space-y-1">
                {q.options.map((opt, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-stone-300 text-center text-[0.7rem] leading-5 dark:border-stone-600">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--theme-border)] pt-4 text-sm">
        <div className="flex items-center gap-2">
          {prevLesson && (
            <Link
              href={`/tajwid/${prevLesson.id}`}
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
              href={`/tajwid/${nextLesson.id}`}
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

