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
      ? "border-accent-text bg-accent-wash"
      : isSelected
        ? "border-danger-text bg-surface-sunken"
        : "border-line bg-transparent"
    : isSelected
      ? "border-accent-text bg-accent-wash"
      : "border-line bg-transparent hover:bg-surface-sunken";

  const circleBase =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-medium";
  const circleClass = showFeedback
    ? isCorrect
      ? "border-accent bg-accent text-on-accent"
      : isSelected
        ? "border-danger-text bg-danger text-on-accent"
        : "border-line-strong"
    : isSelected
      ? "border-accent bg-accent text-on-accent"
      : "border-line-strong";

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

