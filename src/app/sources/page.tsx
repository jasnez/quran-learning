import type { Metadata } from "next";
import Link from "next/link";
import { LETTER_RULES_SOURCE } from "@/lib/letters/data";

export const metadata: Metadata = {
  title: "Izvori | Quran Learning",
  description: "Izvori podataka: Kur&apos;anski tekst, transliteracija, prijevod i audio recitacije.",
};

export default function SourcesPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 md:text-3xl">
        Izvori podataka
      </h1>

      <div className="mt-8 space-y-8 text-stone-600 dark:text-stone-400">
        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Kur&apos;anski tekst i tajwid oznake
          </h2>
          <p className="mt-2 leading-relaxed">
            Digitalni tekst Kur&apos;ana sa tajwid označavanjem preuzet je iz Tanzil projekta.
          </p>
          <p className="mt-1">
            Izvor:{" "}
            <a
              href="https://tanzil.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400"
            >
              tanzil.net
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Transliteracija
          </h2>
          <p className="mt-2 leading-relaxed">
            Transliteracija ajeta i dova napravljena je pravilima iz arapskog teksta, sistemom
            &bdquo;specijal&ldquo; koji Rijaset Islamske zajednice u Bosni i Hercegovini preporučuje za
            kur&apos;anski tekst. Pregled slova i izgovora je na stranici{" "}
            <Link
              href="/harfovi"
              className="text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400"
            >
              Harfovi i izgovor
            </Link>
            .
          </p>
          <p className="mt-1">
            Izvor:{" "}
            <a
              href={LETTER_RULES_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400"
            >
              {LETTER_RULES_SOURCE.title}
            </a>{" "}
            ({LETTER_RULES_SOURCE.publisher})
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Struktura ajeta i audio recitacije
          </h2>
          <p className="mt-2 leading-relaxed">
            Podaci su preuzeti iz otvorenih datasetova platforme Quran.com.
          </p>
          <p className="mt-1">
            Izvor:{" "}
            <a
              href="https://quran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400"
            >
              quran.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Bosanski prijevod značenja Kur&apos;ana
          </h2>
          <p className="mt-2 leading-relaxed">
            Besim Korkut
          </p>
        </section>

        <p className="border-t border-[var(--theme-border)] pt-6 text-sm italic text-stone-500 dark:text-stone-500">
          Ova platforma nije zvanično povezana ni sa jednom od navedenih institucija.
        </p>
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--theme-accent)] hover:underline dark:text-emerald-400"
        >
          ← Povratak na početnu
        </Link>
      </p>
    </article>
  );
}
