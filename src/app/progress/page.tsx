import { getAllSurahs } from "@/lib/data";
import { ProgressContent } from "@/components/progress/ProgressContent";

export const metadata = {
  title: "Napredak | Quran Learning",
  description: "Pregled napretka učenja Kur'ana",
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const surahs = await getAllSurahs();

  return (
    <article className="mx-auto max-w-[900px]">
      <ProgressContent surahs={surahs} />
    </article>
  );
}
