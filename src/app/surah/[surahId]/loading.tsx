import { ReaderSkeleton } from "@/components/reader/ReaderSkeleton";

export default function SurahReaderLoading() {
  return (
    <div className="mx-auto max-w-[42rem]">
      <div className="flex animate-pulse flex-col items-center">
        <div className="h-12 w-48 rounded bg-surface-sunken" />
        <div className="mt-3 h-4 w-64 rounded bg-surface-sunken" />
      </div>
      <section className="mt-10">
        <ReaderSkeleton count={5} />
      </section>
    </div>
  );
}
