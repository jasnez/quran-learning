"use client";

import Link from "next/link";
import { getDailyDua } from "@/lib/duas/dailyDua";
import { QURANIC_DUAS } from "@/lib/duas/data";
import { DuaCard } from "@/components/duas/DuaCard";

export function DailyDuaSection() {
  const dailyDua = getDailyDua(QURANIC_DUAS);
  if (!dailyDua) return null;

  return (
    <section aria-labelledby="daily-dua-heading">
      <h2
        id="daily-dua-heading"
        className="text-xl font-medium text-stone-900 dark:text-stone-100 md:text-2xl"
      >
        Dova dana
      </h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Jedna Kur&apos;anska dova svaki dan.
      </p>
      <div className="mt-6">
        <DuaCard dua={dailyDua} />
        <p className="mt-4">
          <Link
            href="/duas"
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Sve Kur&apos;anske dove →
          </Link>
        </p>
      </div>
    </section>
  );
}
