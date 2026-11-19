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
        className="relative overflow-hidden rounded-xl bg-paper px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-20 bg-cover bg-[center_right] bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
        aria-labelledby="hero-title"
      >
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-surface/50" aria-hidden />
        <div className="relative">
          <h1
            id="hero-title"
            className="text-2xl font-read font-bold tracking-tight text-ink md:text-3xl lg:text-4xl"
          >
            Aplikacija za učenje Kur&apos;ana
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg lg:mt-4 lg:max-w-2xl">
            Arapski tekst, transkripcija po pravilima Rijaseta IZ BiH, Korkutov prijevod i učač Mishary Alafasy, ajet po ajet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-8">
            <ButtonLink href="/learn/1" variant="primary" size="md">
              Počni od Fatihe
            </ButtonLink>
            <ButtonLink href="/surahs" variant="secondary" size="md">
              Sve sure
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
          className="text-lg font-semibold tracking-tight text-ink md:text-xl"
        >
          Šta je u aplikaciji
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-wash text-accent-text">
              <Palette className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-ink">
                Tedžvid u boji
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Četiri pravila izgovora obojena su u tekstu: medd, gunne, ihfa i kalkala.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-wash text-accent-text">
              <Type className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-ink">
                Transkripcija
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Izgovor svakog ajeta latinicom, po pravilima Rijaseta IZ BiH.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-wash text-accent-text">
              <BookOpen className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-ink">
                Prijevod Besima Korkuta
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Prijevod značenja uz svaki ajet.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-wash text-accent-text">
              <Headphones className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium text-ink">
                Slušanje ajet po ajet
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                Dok učač uči, istaknut je ajet koji se čuje.
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
