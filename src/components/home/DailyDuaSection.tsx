"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getDailyDua } from "@/lib/duas/dailyDua";
import { QURANIC_DUAS } from "@/lib/duas/data";
import { mergeConsecutiveDuas } from "@/lib/duas/mergeConsecutiveDuas";
import { DuaCard } from "@/components/duas/DuaCard";

// The same whole duas as the duas page: single ayahs showed fragments such as 23:98 alone
// (QA P2-8; the owner chose this). The text itself is unchanged.
const DAILY_DUAS = mergeConsecutiveDuas(QURANIC_DUAS);

// The static HTML is built on a different day than the visit, so the dua is
// picked only on the client: false during the build and hydration, true after.
const subscribeMount = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export function DailyDuaSection() {
  const mounted = useSyncExternalStore(subscribeMount, getMounted, getMountedServer);
  const dailyDua = mounted ? getDailyDua(DAILY_DUAS) : undefined;
  if (mounted && !dailyDua) return null;

  return (
    <section aria-labelledby="daily-dua-heading">
      <h2
        id="daily-dua-heading"
        className="text-lg font-semibold tracking-tight text-ink md:text-xl"
      >
        Dova dana
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Svaki dan jedna dova iz Kur&apos;ana.
      </p>
      <div className="mt-4">
        {dailyDua ? (
          <DuaCard dua={dailyDua} />
        ) : (
          <div
            className="min-h-48 w-full animate-pulse rounded-2xl border border-line bg-surface/50"
            aria-hidden
            data-testid="daily-dua-placeholder"
          />
        )}
        <p className="mt-3">
          <Link
            href="/duas"
            className="text-sm font-medium text-accent-text underline-offset-2 hover:underline"
          >
            Sve dove iz Kur&apos;ana
          </Link>
        </p>
      </div>
    </section>
  );
}
