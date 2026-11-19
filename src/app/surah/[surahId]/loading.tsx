import { ReaderSkeleton } from "@/components/reader/ReaderSkeleton";

export default function SurahReaderLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded bg-surface-sunken" />
        <div className="mt-2 h-4 w-64 rounded bg-surface-sunken" />
      </div>
      <section className="mt-12">
        <ReaderSkeleton count={5} />
      </section>
    </div>
  );
}
