import { ReaderSkeleton } from "@/components/reader/ReaderSkeleton";

export default function SurahReaderLoading() {
  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded bg-stone-200 dark:bg-stone-700" />
        <div className="mt-2 h-4 w-64 rounded bg-stone-100 dark:bg-stone-700" />
      </div>
      <section className="mt-12">
        <ReaderSkeleton count={5} />
      </section>
    </main>
  );
}
