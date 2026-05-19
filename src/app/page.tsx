import {
  Palette,
  Type,
  BookOpen,
  Headphones,
} from "lucide-react";
import { getAllSurahs } from "@/lib/data";
import { ContinueLearningSection } from "@/components/home/ContinueLearningSection";
import { DailyDuaSection } from "@/components/home/DailyDuaSection";
import { FeaturedSurahsSection } from "@/components/home/FeaturedSurahsSection";
import { ButtonLink } from "@/components/ui";

export default async function Home() {
  const allSurahs = await getAllSurahs();

  return (
    <article className="space-y-12 md:space-y-16">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-xl bg-stone-50 px-6 py-10 dark:bg-stone-900/50 md:px-12 md:py-14 bg-cover bg-[center_right] bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
        aria-labelledby="hero-title"
      >
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/50 dark:bg-stone-900/70" aria-hidden />
        <div className="relative">
          <h1
            id="hero-title"
            className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-3xl"
          >
            Platforma za učenje Kur&apos;ana
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600 dark:text-stone-400 md:text-lg">
            Uči Kur&apos;an uz tajwid pomagala, transliteraciju, prijevod i audio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/learn/1" variant="primary" size="md">
              Počni učiti
            </ButtonLink>
            <ButtonLink href="/surahs" variant="secondary" size="md">
              Pregled sura
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Continue Learning or welcome + stats */}
      <ContinueLearningSection />

      {/* Daily Dua */}
      <DailyDuaSection />

      {/* Featured surahs (progress-aware) */}
      <FeaturedSurahsSection allSurahs={allSurahs} />

      {/* Features */}
      <section aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-xl"
        >
          Šta nudi platforma
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
