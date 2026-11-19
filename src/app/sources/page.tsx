import type { Metadata } from "next";
import Link from "next/link";
import { LETTER_RULES_SOURCE } from "@/lib/letters/data";

export const metadata: Metadata = {
  title: "Izvori",
  description:
    "Izvori: arapski tekst, tedžvid oznake, transkripcija, prijevod i snimci učenja.",
};

const LINK_CLASS =
  "text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {children}
    </a>
  );
}

export default function SourcesPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 md:text-3xl">
        Izvori podataka
      </h1>

      <div className="mt-8 space-y-8 text-stone-600 dark:text-stone-400">
        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Kur&apos;anski tekst
          </h2>
          <p className="mt-2 leading-relaxed">
            Arapski tekst Kur&apos;ana (Uthmani pismo) preuzet je sa servisa Quran.com.
          </p>
          <p className="mt-1">
            Izvor: <ExternalLink href="https://quran.com">quran.com</ExternalLink>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Tedžvid oznake
          </h2>
          <p className="mt-2 leading-relaxed">
            Oznake tedžvidskih pravila potiču iz skupa podataka{" "}
            <ExternalLink href="https://github.com/cpfair/quran-tajweed">cpfair/quran-tajweed</ExternalLink>{" "}
            (autor: cpfair), objavljenog pod licencom{" "}
            <ExternalLink href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</ExternalLink>.
            Oznake su napravljene za Uthmani tekst projekta{" "}
            <ExternalLink href="https://tanzil.net">tanzil.net</ExternalLink>.
          </p>
          <p className="mt-1 leading-relaxed">
            Izmjene: oznake su prenesene na tekst koji se ovdje prikazuje, a bojom su istaknuta samo
            četiri pravila (medd, gunne, ihfa i kalkala).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Transkripcija
          </h2>
          <p className="mt-2 leading-relaxed">
            Transkripcija ajeta i dova napravljena je iz arapskog teksta, sistemom
            &bdquo;specijal&ldquo; koji Rijaset Islamske zajednice u Bosni i Hercegovini preporučuje za
            kur&apos;anski tekst. Pregled slova i izgovora je na stranici{" "}
            <Link href="/harfovi" className={LINK_CLASS}>
              Harfovi i izgovor
            </Link>
            .
          </p>
          <p className="mt-1">
            Izvor: <ExternalLink href={LETTER_RULES_SOURCE.url}>{LETTER_RULES_SOURCE.title}</ExternalLink>{" "}
            ({LETTER_RULES_SOURCE.publisher})
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Struktura ajeta i vremena riječi
          </h2>
          <p className="mt-2 leading-relaxed">
            Podjela na ajete i vremena riječi za praćenje učenja preuzeti su sa servisa
            Quran.com.
          </p>
          <p className="mt-1">
            Izvor: <ExternalLink href="https://quran.com">quran.com</ExternalLink>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Snimci učenja
          </h2>
          <p className="mt-2 leading-relaxed">
            Učač: Mishary Alafasy. Snimci po ajetu učitavaju se sa stranice everyayah.com.
          </p>
          <p className="mt-1">
            Izvor: <ExternalLink href="https://everyayah.com">everyayah.com</ExternalLink>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Bosanski prijevod značenja Kur&apos;ana
          </h2>
          <p className="mt-2 leading-relaxed">
            Besim Korkut. Tekst prijevoda preuzet je sa servisa Quran.com.
          </p>
        </section>

        <p className="border-t border-[var(--theme-border)] pt-6 text-sm italic text-stone-500 dark:text-stone-500">
          Aplikacija nije zvanično povezana ni s jednom od navedenih ustanova.
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
