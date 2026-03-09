import Link from "next/link";
import {
  Palette,
  Type,
  BookOpen,
  Headphones,
} from "lucide-react";
import { getAllSurahs } from "@/lib/data";
import { ContinueLearningSection } from "@/components/home/ContinueLearningSection";

const FEATURED_SURAH_NUMBERS = [1, 112, 113, 114];
/** Kratke napomene za preporučene sure (zahtjev: kratka napomena na karticama). */
const FEATURED_SURAH_NOTES: Record<number, string> = {
  1: "Otvaranje Kur'ana; uči se u svakoj rekiji.",
  112: "Čistoća vjerovanja u Jednost Boga.",
  113: "Traženje utočišta u Allaha od zla izvana.",
  114: "Traženje utočišta u Allaha od zla iznutra.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const allSurahs = await getAllSurahs();
  const featuredSurahs = allSurahs.filter((s) =>
    FEATURED_SURAH_NUMBERS.includes(s.surahNumber)
  );

  return (
    <article className="space-y-24 md:space-y-32">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl bg-stone-50 px-6 py-16 dark:bg-stone-900/50 md:px-12 md:py-24 bg-cover bg-[center_right] bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
        aria-labelledby="hero-title"
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/50 dark:bg-stone-900/70" aria-hidden />
        <div className="relative">
          <h1
            id="hero-title"
            className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-4xl"
          >
            Platforma za učenje Kur&apos;ana
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-600 dark:text-stone-400">
            Uči Kur&apos;an uz tajwid pomagala, transliteraciju, prijevod i audio.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/learn/1"
              className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-800 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              Počni učiti
            </Link>
            <Link
              href="/surahs"
              className="inline-flex h-12 items-center justify-center rounded-full border border-stone-300 bg-transparent px-6 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Pregled sura
            </Link>
          </div>
        </div>
      </section>

      {/* Continue Learning or welcome + stats */}
      <ContinueLearningSection />

      {/* Featured surahs */}
      <section aria-labelledby="featured-heading">
        <h2
          id="featured-heading"
          className="text-xl font-medium text-stone-900 dark:text-stone-100 md:text-2xl"
        >
          Preporučene sure
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {featuredSurahs.map((surah) => (
            <Link
              key={surah.id}
              href={`/surah/${surah.surahNumber}`}
              className="group flex flex-col rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-emerald-200 hover:bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-emerald-900/50 dark:hover:bg-stone-800/50"
            >
              <span
                className="text-2xl font-medium text-stone-900 dark:text-stone-100"
                dir="rtl"
                lang="ar"
              >
                {surah.nameArabic}
              </span>
              <span className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
                {surah.nameBosnian}
              </span>
              {FEATURED_SURAH_NOTES[surah.surahNumber] && (
                <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-500">
                  {FEATURED_SURAH_NOTES[surah.surahNumber]}
                </p>
              )}
              <span className="mt-2 text-xs text-stone-500 dark:text-stone-500">
                {surah.ayahCount} ajeta
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="text-xl font-medium text-stone-900 dark:text-stone-100 md:text-2xl"
        >
          Šta nudi platforma
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Palette className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                Tajwid boje
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Obojeni segmenti za pravila izgovora (mad, ghunnah, ikhfa, qalqalah).
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Type className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                Transliteracija
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Latinični zapis arapskog teksta za lakše učenje izgovora.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                Bosanski prijevod
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Prijevod značenja (Besim Korkut) uz svaki ajet.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Headphones className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                Audio s označavanjem ajeta
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Slušaj recitaciju uz istovremeno označavanje trenutnog ajeta.
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
