import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "O aplikaciji | Quran Learning",
  description:
    `${SITE_NAME} je besplatna aplikacija za učenje Kur'ana: arapski tekst, transliteracija, Korkutov prijevod i učač Mishary Alafasy.`,
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 md:text-3xl">
        O aplikaciji
      </h1>

      <div className="mt-8 space-y-8 text-stone-600 dark:text-stone-400">
        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Šta je Quran Learning?
          </h2>
          <p className="mt-2 leading-relaxed">
            {SITE_NAME} je besplatna aplikacija za učenje Kur&apos;ana na bosanskom
            jeziku. Uz svaki ajet su arapski tekst, transliteracija po pravilima
            Rijaseta Islamske zajednice u Bosni i Hercegovini, prijevod značenja
            Besima Korkuta i učenje Mishary Alafasyja. Tu su i lekcije tedžvida,
            Allahova lijepa imena i dove iz Kur&apos;ana.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Mogućnosti
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1.5 leading-relaxed">
            <li>Čitanje sure ajet po ajet, s transliteracijom i prijevodom</li>
            <li>Slušanje svakog ajeta, uz ponavljanje</li>
            <li>Lekcije tedžvida s kvizom</li>
            <li>Sačuvani ajeti s bilješkama</li>
            <li>Pretraga po riječi, nazivu sure ili broju ajeta</li>
            <li>Čitanje bez interneta, kad se sure preuzmu</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Izvori
          </h2>
          <p className="mt-2 leading-relaxed">
            Tekst, transliteracija i snimci dolaze iz otvorenih izvora, navedenih
            na stranici{" "}
            <Link
              href="/sources"
              className="text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400"
            >
              Izvori
            </Link>
            .
          </p>
        </section>

        <p className="border-t border-[var(--theme-border)] pt-6 text-sm italic text-stone-500 dark:text-stone-500">
          Aplikacija je napravljena da olakša učenje Kur&apos;ana. Nije zvanično
          povezana ni s jednom vjerskom ni obrazovnom ustanovom.
        </p>
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--theme-accent)] hover:underline dark:text-emerald-400"
        >
          Na početnu
        </Link>
      </p>
    </article>
  );
}
