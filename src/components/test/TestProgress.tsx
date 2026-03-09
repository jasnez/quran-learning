"use client";

type TestProgressProps = {
  current: number;
  total: number;
};

export function TestProgress({ current, total }: TestProgressProps) {
  const clampedTotal = total > 0 ? total : 1;
  const value = Math.min(Math.max(current, 1), clampedTotal);
  const percent = (value / clampedTotal) * 100;

  return (
    <div className="mb-3 flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400">
      <div className="flex items-center justify-between">
        <span>
          Pitanje {value} od {clampedTotal}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${percent}%` }}
          data-testid="test-progress-bar"
        />
      </div>
    </div>
  );
}

