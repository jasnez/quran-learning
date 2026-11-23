import type { Metadata } from "next";
import Link from "next/link";
import { ISSUES_NEW_URL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Pitanja, prijedlozi i prijave grešaka.",
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-[700px] px-4 py-8 md:py-12">
      <h1 className="text-2xl font-read font-bold text-ink md:text-3xl">
        Kontakt
      </h1>

      <div className="mt-8 space-y-6 text-ink-muted">
        <p className="leading-relaxed">
          Pitanje, prijedlog ili greška u tekstu? Piši nam preko GitHuba.
        </p>

        <section>
          <h2 className="text-lg font-medium text-ink">
            GitHub Issues
          </h2>
          <p className="mt-2">
            <a
              href={ISSUES_NEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-text underline hover:no-underline"
            >
              Otvori novu prijavu na GitHubu
            </a>
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Za prijavu treba besplatan GitHub nalog. Prijave su javne, pa ne upisuj
            lične podatke.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-ink">
            Povratne informacije
          </h2>
          <p className="mt-2 leading-relaxed">
            Ako je greška u tekstu, transkripciji, prijevodu ili snimku, navedi
            suru i ajet ili zalijepi link.
          </p>
        </section>
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
