import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "O aplikaciji",
  description:
    `${SITE_NAME} je besplatna aplikacija za učenje Kur'ana: arapski tekst, transkripcija, Korkutov prijevod i učač Mishary Alafasy.`,
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-read font-bold text-ink md:text-3xl">
        O aplikaciji
      </h1>

      <div className="mt-8 space-y-8 text-ink-muted">
        <section>
          <h2 className="text-lg font-medium text-ink">
            Šta je {SITE_NAME}?
          </h2>
          <p className="mt-2 leading-relaxed">
            {SITE_NAME} je besplatna aplikacija za učenje Kur&apos;ana na bosanskom
            jeziku. Uz svaki ajet su arapski tekst, transkripcija po pravilima
            Rijaseta Islamske zajednice u Bosni i Hercegovini, prijevod značenja
            Besima Korkuta i učenje Mishary Alafasyja. Tu su i lekcije tedžvida,
            Allahova lijepa imena i dove iz Kur&apos;ana.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-ink">
            Mogućnosti
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1.5 leading-relaxed">
            <li>Čitanje sure ajet po ajet, s transkripcijom i prijevodom</li>
            <li>Slušanje svakog ajeta, uz ponavljanje</li>
            <li>Lekcije tedžvida s kvizom</li>
            <li>Sačuvani ajeti s bilješkama</li>
            <li>Pretraga po riječi, nazivu sure ili broju ajeta</li>
            <li>Čitanje bez interneta, kad se sure preuzmu</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-ink">
            Izvori
          </h2>
          <p className="mt-2 leading-relaxed">
            Tekst, transkripcija i snimci dolaze iz otvorenih izvora, navedenih
            na stranici{" "}
            <Link
              href="/sources"
              className="text-accent-text underline hover:no-underline"
            >
              Izvori
            </Link>
            .
          </p>
        </section>

        <p className="border-t border-line pt-6 text-sm italic text-ink-muted">
          Aplikacija je napravljena da olakša učenje Kur&apos;ana. Nije zvanično
          povezana ni s jednom vjerskom ni obrazovnom ustanovom.
        </p>
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
        >
          Na početnu
        </Link>
      </p>
    </article>
  );
}
