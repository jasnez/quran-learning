import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllTajwidLessons,
  getTajwidLessonBySlug,
} from "@/data/tajwid-lessons";
import { LessonSectionView, resolveExamples } from "@/components/tajwid/LessonSections";
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

  const resolved = await resolveExamples(lesson);

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

      {lesson.sections.map((section, idx) => (
        <LessonSectionView key={idx} section={section} resolved={resolved} />
      ))}

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

