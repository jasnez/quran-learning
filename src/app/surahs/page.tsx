import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllSurahs } from "@/lib/data";
import { getAllJuz } from "@/lib/data/juzUtils";
import { SurahsPageContent } from "@/components/surahs";

// Sura lista je statični sadržaj — revalidira se jednom u 24h umjesto na svaki request
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sve sure",
};

export default async function SurahsPage() {
  const [surahs, juzList] = await Promise.all([getAllSurahs(), Promise.resolve(getAllJuz())]);

  return (
    <article className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
        Sve sure
      </h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-surface-sunken" />}>
          <SurahsPageContent surahs={surahs} juzList={juzList} />
        </Suspense>
      </div>
    </article>
  );
}
