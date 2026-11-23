export function SurahListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="space-y-3" role="list" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div
            data-skeleton-card
            className="flex min-h-[4rem] items-center gap-4 rounded-xl border border-line bg-surface px-4 py-4"
          >
            <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-sunken" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="block h-4 w-32 animate-pulse rounded bg-surface-sunken" />
              <span className="block h-3 w-24 animate-pulse rounded bg-surface-sunken" />
              <span className="block h-3 w-28 animate-pulse rounded bg-surface-sunken" />
            </div>
            <span className="h-6 w-12 animate-pulse rounded bg-surface-sunken" aria-hidden />
          </div>
        </li>
      ))}
    </ul>
  );
}
