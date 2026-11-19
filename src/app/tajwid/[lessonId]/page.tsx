import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllTajwidLessons,
  getTajwidLessonBySlug,
} from "@/data/tajwid-lessons";
import { tajwidRuleClasses } from "@/lib/quran/tajwidStyles";
import { TajwidQuiz } from "@/components/tajwid/TajwidQuiz";
import { LessonProgressTracker } from "@/components/tajwid/LessonProgressTracker";

export async function generateStaticParams() {
  const lessons = await getAllTajwidLessons();
  return lessons.map((l) => ({ lessonId: l.slug }));
}

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getTajwidLessonBySlug(lessonId);
  if (!lesson) return { title: "Tedžvid lekcije" };
  return { title: `${lesson.title} | Tedžvid lekcije` };
}

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
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Tedžvid lekcija
        </p>
        <h1 className="mt-1 text-2xl font-read font-bold tracking-tight text-ink sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {lesson.subtitle}
        </p>
      </header>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">
          Uvod
        </h2>
        {lesson.sections.introduction.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">
          Šta je ovo pravilo?
        </h2>
        {lesson.sections.definition.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed text-ink">
        <h2 className="text-base font-semibold text-ink">
          Kada nastaje?
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {lesson.sections.whenItOccurs.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </section>

      {lesson.sections.howToProduce && (
        <section className="mb-8 space-y-3 text-sm leading-relaxed text-ink">
          <h2 className="text-base font-semibold text-ink">
            Kako se izgovara
          </h2>
          <ol className="list-decimal space-y-1 pl-5">
            {lesson.sections.howToProduce.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="mb-8 space-y-4">
        <h2 className="text-base font-semibold text-ink">
          Primjeri
        </h2>
        {lesson.sections.examples.map((ex, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <p
              className={`font-arabic text-2xl leading-relaxed text-center ${ruleClass}`}
              dir="rtl"
              lang="ar"
            >
              {ex.arabic}
            </p>
            <p
              className="mt-2 text-center font-transliteration text-sm text-ink-muted"
              dir="ltr"
            >
              {ex.transliteration}
            </p>
            <p className="mt-1 text-center font-read text-xs text-ink-muted">
              {ex.translation}
            </p>
            <p className="mt-2 text-center text-xs font-medium text-ink-muted">
              {ex.rule}
            </p>
          </div>
        ))}
      </section>

      {lesson.sections.practiceAyahs && lesson.sections.practiceAyahs.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-base font-semibold text-ink">
            Vježba na ajetima iz Kur&apos;ana
          </h2>
          <ul className="space-y-2 text-sm text-ink">
            {lesson.sections.practiceAyahs.map((p, idx) => (
              <li key={idx}>
                <Link
                  href={`/surah/${p.surah}?ayah=${p.ayah}`}
                  className="inline-flex items-center gap-1 text-accent-text hover:underline"
                >
                  <span>
                    Sura {p.surah}, ajet {p.ayah}
                  </span>
                </Link>
                {p.description && (
                  <p className="text-xs text-ink-muted">
                    {p.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.sections.tip && (
        <section className="mb-8 rounded-2xl border border-line bg-accent-wash px-4 py-3 text-sm text-accent-text">
          <h2 className="text-sm font-semibold">
            {lesson.sections.tip.title}
          </h2>
          <p className="mt-1">{lesson.sections.tip.text}</p>
        </section>
      )}

      <section className="mb-8">
        <TajwidQuiz
          quiz={lesson.quiz}
          lessonSlug={lesson.slug}
          nextLessonSlug={nextLesson?.slug ?? null}
          nextLessonTitle={nextLesson?.title ?? null}
        />
      </section>

      <section className="mb-6 text-sm text-ink">
        <h2 className="text-base font-semibold text-ink">
          Sažetak
        </h2>
        <p className="mt-1">{lesson.summary}</p>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm max-md:pr-16">
        <div className="flex items-center gap-2">
          {prevLesson && (
            <Link
              href={`/tajwid/${prevLesson.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-ink hover:bg-surface-sunken"
            >
              <span>Prethodna: {prevLesson.title}</span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tajwid"
            className="rounded-full border border-line px-3 py-1.5 text-ink-muted hover:bg-surface-sunken"
          >
            Sve lekcije
          </Link>
          {nextLesson && (
            <Link
              href={`/tajwid/${nextLesson.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-on-accent hover:bg-accent-hover"
            >
              <span>Sljedeća: {nextLesson.title}</span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}

