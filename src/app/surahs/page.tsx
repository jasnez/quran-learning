import { Suspense } from "react";
import { getAllSurahs } from "@/lib/data";
import { getAllJuz } from "@/lib/data/juzUtils";
import { SurahsPageContent } from "@/components/surahs";

export const dynamic = "force-dynamic";

export default async function SurahsPage() {
  const [surahs, juzList] = await Promise.all([getAllSurahs(), Promise.resolve(getAllJuz())]);

  return (
    <article className="mx-auto max-w-[900px]">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-3xl">
        Sure
      </h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />}>
          <SurahsPageContent surahs={surahs} juzList={juzList} />
        </Suspense>
      </div>
    </article>
  );
}
