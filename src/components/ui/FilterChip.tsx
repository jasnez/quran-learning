"use client";

import type { ReactNode } from "react";
import { SELECTED_CLASSES } from "./selected";

type FilterChipProps = {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
};

/**
 * A filter or display option that is on or off. Its name stays the same in both states; the
 * state is in aria-pressed. Name the group of chips on their wrapper.
 */
export function FilterChip({ pressed, onToggle, children, className = "" }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={`inline-flex h-8 items-center rounded-full border-[1.5px] px-3 text-sm font-semibold leading-none whitespace-nowrap transition-colors duration-press ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text ${
        pressed ? SELECTED_CLASSES : "border-line-strong text-ink-muted hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}
