"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getDailyDua } from "@/lib/duas/dailyDua";
import { QURANIC_DUAS } from "@/lib/duas/data";
import { DuaCard } from "@/components/duas/DuaCard";

// The static HTML is built on a different day than the visit, so the dua is
// picked only on the client: false during the build and hydration, true after.
const subscribeMount = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export function DailyDuaSection() {
  const mounted = useSyncExternalStore(subscribeMount, getMounted, getMountedServer);
  const dailyDua = mounted ? getDailyDua(QURANIC_DUAS) : undefined;
  if (mounted && !dailyDua) return null;

  return (
    <section aria-labelledby="daily-dua-heading">
      <h2
        id="daily-dua-heading"
        className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-xl"
      >
        Dova dana
      </h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Jedna Kur&apos;anska dova svaki dan.
      </p>
      <div className="mt-4">
        {dailyDua ? (
          <DuaCard dua={dailyDua} />
        ) : (
          <div
            className="min-h-48 w-full animate-pulse rounded-2xl border border-stone-200/80 bg-white/50 dark:border-stone-700/80 dark:bg-stone-900/20"
            aria-hidden
            data-testid="daily-dua-placeholder"
          />
        )}
        <p className="mt-3">
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
