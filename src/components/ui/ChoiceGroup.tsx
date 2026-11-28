"use client";

import { IDLE_CLASSES, SELECTED_CLASSES } from "./selected";

type ChoiceGroupProps<T extends string> = {
  /** Names the group; becomes the fieldset's legend. */
  legend: string;
  /** Keep the name for screen readers but do not show it (when a heading next to it says it). */
  hideLegend?: boolean;
  /** The radios' shared name: unique among the groups on screen. */
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Id of a text that explains the choice. */
  describedBy?: string;
  className?: string;
};

/**
 * One of two to four options (script, tajwid display, repeat, theme, speed). Native radios in a
 * fieldset: the arrow keys and screen readers work without extra code. For more options use a
 * list or a select.
 */
export function ChoiceGroup<T extends string>({
  legend,
  hideLegend = false,
  name,
  options,
  value,
  onChange,
  describedBy,
  className = "",
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className={`min-w-0 ${className}`} aria-describedby={describedBy}>
      <legend className={hideLegend ? "sr-only" : "mb-2 block p-0 text-[0.9375rem] text-ink"}>{legend}</legend>
      {/* The radius is half the height of one row, so a single row reads as a pill and a
          wrapped group still looks whole. */}
      <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-[1.375rem] border border-line bg-surface-sunken p-[3px]">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] px-3.5 text-sm font-semibold leading-none transition-colors duration-press ease-standard has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent-text ${
                checked ? SELECTED_CLASSES : IDLE_CLASSES
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="absolute inset-0 m-0 cursor-pointer opacity-0"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
