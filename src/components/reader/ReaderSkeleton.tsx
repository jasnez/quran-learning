export function ReaderSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="space-y-14 list-none" role="list" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div
            data-skeleton-ayah
            className="animate-pulse rounded-2xl border border-stone-200/80 bg-stone-50/50 px-6 py-10 dark:border-stone-700/80 dark:bg-stone-900/20"
          >
            <div className="mx-auto h-12 w-full max-w-md rounded bg-stone-200 dark:bg-stone-700" />
            <div className="mx-auto mt-6 h-4 w-3/4 max-w-xs rounded bg-stone-100 dark:bg-stone-700" />
            <div className="mx-auto mt-4 h-4 w-full max-w-sm rounded bg-stone-100 dark:bg-stone-700" />
          </div>
        </li>
      ))}
    </ul>
  );
}
