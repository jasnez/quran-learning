export function ReaderSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="list-none" role="list" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div data-skeleton-ayah className="animate-pulse border-t border-line py-5">
            <div className="ml-auto h-10 w-3/4 rounded bg-surface-sunken" />
            <div className="mt-4 h-4 w-2/3 rounded bg-surface-sunken" />
            <div className="mt-3 h-4 w-5/6 rounded bg-surface-sunken" />
          </div>
        </li>
      ))}
    </ul>
  );
}
