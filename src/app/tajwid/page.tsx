import { getAllTajwidLessons } from "@/data/tajwid-lessons";
import { TajwidLessonCard } from "@/components/tajwid/TajwidLessonCard";

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
        {lessons.map((lesson, index) => (
          <TajwidLessonCard key={lesson.id} lesson={lesson} index={index} />
        ))}
      </section>
    </div>
  );
}

