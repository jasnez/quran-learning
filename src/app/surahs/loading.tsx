import { SurahListSkeleton } from "@/components/surahs/SurahListSkeleton";

export default function SurahsLoading() {
  return (
    <article className="mx-auto max-w-[900px]">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-3xl">
        Sure
      </h1>
      <div className="mt-8 flex flex-col gap-6">
        <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" aria-hidden />
        <SurahListSkeleton count={6} />
      </div>
    </article>
  );
}
