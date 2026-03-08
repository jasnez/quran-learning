import { getAllSurahs } from "@/lib/data";
import { SurahsContent } from "@/components/surahs";

export default function SurahsPage() {
  const surahs = getAllSurahs();

  return (
    <article className="mx-auto max-w-[900px]">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-3xl">
        Sure
      </h1>
      <div className="mt-8">
        <SurahsContent surahs={surahs} />
      </div>
    </article>
  );
}
