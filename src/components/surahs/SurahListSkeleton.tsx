export function SurahListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="space-y-3" role="list" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div
            data-skeleton-card
            className="flex min-h-[4rem] items-center gap-4 rounded-xl border border-stone-200/80 bg-white px-4 py-4 dark:border-stone-700/80 dark:bg-stone-900/50"
          >
            <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="block h-4 w-32 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <span className="block h-3 w-24 animate-pulse rounded bg-stone-100 dark:bg-stone-700" />
              <span className="block h-3 w-28 animate-pulse rounded bg-stone-100 dark:bg-stone-700" />
            </div>
            <span className="h-6 w-12 animate-pulse rounded bg-stone-200 dark:bg-stone-700" aria-hidden />
          </div>
        </li>
      ))}
    </ul>
  );
}
