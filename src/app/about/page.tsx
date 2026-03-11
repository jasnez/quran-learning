import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "O platformi | Quran Learning",
  description:
    "Quran Learning je platforma za učenje Kur'ana s transliteracijom, prijevodom i audio recitacijom.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 md:text-3xl">
        O platformi
      </h1>

      <div className="mt-8 space-y-8 text-stone-600 dark:text-stone-400">
        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Šta je Quran Learning?
          </h2>
          <p className="mt-2 leading-relaxed">
            Quran Learning je besplatna platforma namijenjena svima koji žele
            učiti Kur&apos;an. Nudimo arapski tekst s transliteracijom (latinica),
            bosanski prijevod značenja i audio recitacije, kao i lekcije tajwida
            za bolje čitanje i izgovor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Mogućnosti
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1.5 leading-relaxed">
            <li>Čitanje sure po ajat s transliteracijom i prijevodom</li>
            <li>Audio recitacija za svaki ajat</li>
            <li>Lekcije tajwida (pravila izgovora)</li>
            <li>Praćenje napretka i zabilješke</li>
            <li>Pretraga po tekstu ili broju sure/ajata</li>
            <li>Zakładke (bookmarks) za brzi povratak</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Izvori
          </h2>
          <p className="mt-2 leading-relaxed">
            Koristimo pouzdane, otvorene izvore za tekst, transliteraciju i
            audio. Detalje možete pogledati na stranici{" "}
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
          Ova platforma je izrađena u dobronamjernoj namjeri da olakša učenje
          Kur&apos;ana. Nije zvanično povezana ni sa jednom vjerskom ili obrazovnom
          institucijom.
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
