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
      <h1 className="text-2xl font-semibold text-ink md:text-3xl">
        Kontakt
      </h1>

      <div className="mt-8 space-y-6 text-ink-muted">
        <p className="leading-relaxed">
          Pitanja, prijedlozi i prijave grešaka stižu nam preko GitHub Issues.
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
            Za prijavu je potreban besplatan GitHub nalog. Prijave su javne, pa u
            njih ne treba upisivati lične podatke.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-ink">
            Povratne informacije
          </h2>
          <p className="mt-2 leading-relaxed">
            Kod greške u tekstu, transkripciji, prijevodu ili snimku najviše
            pomaže kad prijava navodi suru i ajet ili link.
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
