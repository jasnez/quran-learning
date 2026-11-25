import Link from "next/link";

type EndLink = {
  href: string;
  /** Small line over the name: "Prethodna sura". */
  kicker: string;
  /** What it leads to: the surah's, lesson's or juz's name. */
  title: string;
};

type EndNavProps = {
  /** Names the navigation: "Susjedne sure". */
  label: string;
  prev?: EndLink;
  next?: EndLink;
  /** The whole list: "Sve sure". */
  all: { href: string; label: string };
};

const CARD =
  "flex min-w-0 flex-col gap-0.5 rounded-control border border-line p-3 text-ink transition-colors duration-press ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";

function Card({ link, side }: { link: EndLink | undefined; side: "left" | "right" }) {
  // An empty cell keeps the other card on its side (the first and the last of a list).
  if (!link) return <span aria-hidden="true" />;
  return (
    <Link href={link.href} className={`${CARD} ${side === "right" ? "items-end text-right" : ""}`}>
      <span className="text-[0.8125rem] text-ink-muted">{link.kicker}</span>{" "}
      <span className="max-w-full truncate font-semibold">{link.title}</span>
    </Link>
  );
}

/**
 * Where to go after the last ayah, the last section of a lesson or the end of a juz: the
 * previous one on the left, the next one on the right, and one link to the whole list. Quiet on
 * purpose: it is never the strongest thing on the page, and it never stands above the content.
 */
export function EndNav({ label, prev, next, all }: EndNavProps) {
  return (
    <nav aria-label={label} className="mt-8">
      <div className="grid grid-cols-2 gap-3">
        <Card link={prev} side="left" />
        <Card link={next} side="right" />
      </div>
      <p className="mt-3 text-center">
        <Link
          href={all.href}
          className="inline-flex min-h-11 items-center px-2 text-[0.9375rem] font-semibold text-accent-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          {all.label}
        </Link>
      </p>
    </nav>
  );
}
