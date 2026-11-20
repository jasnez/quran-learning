import type { Metadata } from "next";
import { getAllTajwidLessons } from "@/data/tajwid-lessons";
import { TajwidLessonCard } from "@/components/tajwid/TajwidLessonCard";

export const metadata: Metadata = {
  title: "Tedžvid lekcije",
};

export default async function TajwidLessonsPage() {
  const lessons = await getAllTajwidLessons();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-read font-bold tracking-tight text-ink sm:text-3xl">
          Tedžvid lekcije
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Kratke lekcije o najvažnijim pravilima tedžvida, s primjerima iz
          Kur&apos;ana i kvizom na kraju.
        </p>
      </header>

      <section className="grid gap-4 sm:gap-5">
        {lessons.map((lesson, index) => (
          <TajwidLessonCard key={lesson.id} lesson={lesson} index={index} />
        ))}
      </section>
    </div>
  );
}

