import { SurahListSkeleton } from "@/components/surahs/SurahListSkeleton";

export default function SurahsLoading() {
  return (
    <article className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
        Sure
      </h1>
      <div className="mt-8 flex flex-col gap-6">
        <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-surface-sunken" aria-hidden />
        <SurahListSkeleton count={6} />
      </div>
    </article>
  );
}
