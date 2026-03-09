"use client";

type TestOptionProps = {
  index: number;
  label: string;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrect?: boolean;
  showFeedback?: boolean;
  onSelect: (index: number) => void;
};

export function TestOption({
  index,
  label,
  disabled = false,
  isSelected = false,
  isCorrect = false,
  showFeedback = false,
  onSelect,
}: TestOptionProps) {
  const handleClick = () => {
    if (disabled) return;
    onSelect(index);
  };

  const base =
    "flex w-full gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors";
  const stateClass = showFeedback
    ? isCorrect
      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
      : isSelected
        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
        : "border-[var(--theme-border)] bg-transparent"
    : isSelected
      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
      : "border-[var(--theme-border)] bg-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50";

  const circleBase =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-medium";
  const circleClass = showFeedback
    ? isCorrect
      ? "border-emerald-500 bg-emerald-500 text-white"
      : isSelected
        ? "border-red-400 bg-red-400 text-white"
        : "border-stone-300 dark:border-stone-600"
    : isSelected
      ? "border-emerald-500 bg-emerald-500 text-white"
      : "border-stone-300 dark:border-stone-600";

  const circleContent = showFeedback
    ? isCorrect
      ? "✓"
      : isSelected
        ? "✗"
        : String.fromCharCode(65 + index)
    : String.fromCharCode(65 + index);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      data-testid={`test-option-${index}`}
      className={`${base} ${stateClass} ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className={`${circleBase} ${circleClass}`}>{circleContent}</span>
      <span>{label}</span>
    </button>
  );
}

