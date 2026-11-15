import type { Metadata } from "next";
import Link from "next/link";
import { ISSUES_NEW_URL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Kontakt | Quran Learning",
  description: "Kontaktirajte nas za pitanja, prijedloge ili povratne informacije o platformi Quran Learning.",
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 md:text-3xl">
        Kontakt
      </h1>

      <div className="mt-8 space-y-6 text-stone-600 dark:text-stone-400">
        <p className="leading-relaxed">
          Imate pitanja, prijedloge ili želite prijaviti grešku? Slobodno nam
          pišite preko GitHub Issues.
        </p>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            GitHub Issues
          </h2>
          <p className="mt-2">
            <a
              href={ISSUES_NEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400"
            >
              Otvori novu prijavu na GitHubu
            </a>
          </p>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-500">
            Za prijavu je potreban besplatan GitHub nalog. Prijave su javno
            vidljive, pa ne upisujte lične podatke.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            Povratne informacije
          </h2>
          <p className="mt-2 leading-relaxed">
            Ako primijetite grešku u tekstu, transliteraciji, prijevodu ili
            audio recitaciji, molimo navedite sure i ajat (ili link) u poruci.
          </p>
        </section>
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
