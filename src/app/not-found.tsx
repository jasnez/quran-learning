import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ova stranica ne postoji",
  // The layout's "./" would point to /_not-found, an address that does not exist.
  alternates: { canonical: null },
  openGraph: null,
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-read font-bold text-ink">
        Ova stranica ne postoji
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-ink-muted">
        Možda je adresa pogrešno upisana ili je stranica premještena.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          Na početnu
        </Link>
        <Link
          href="/surahs"
          className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-sunken"
        >
          Sve sure
        </Link>
      </div>
    </div>
  );
}
