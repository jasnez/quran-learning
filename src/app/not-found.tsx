import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stranica nije pronađena | Quran Learning",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
        Stranica nije pronađena
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-stone-600 dark:text-stone-400">
        Adresa koju si tražio ne postoji ili je premještena.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Na početnu
        </Link>
        <Link
          href="/surahs"
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Sve sure
        </Link>
      </div>
    </div>
  );
}
