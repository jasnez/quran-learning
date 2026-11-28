"use client";

import { useId } from "react";

type SwitchProps = {
  /** What is on when the switch is on ("Transkripcija"), not "show" or "hide". */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

/**
 * One setting that is on or off and acts at once. The label is tied to the switch, so the whole
 * row is clickable and the switch is named by the visible text.
 */
export function Switch({ label, checked, onChange, id }: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? autoId;
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <label htmlFor={switchId} className="flex-1 cursor-pointer text-[0.9375rem] text-ink">
        {label}
      </label>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[1.625rem] w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-press ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text ${
          checked ? "bg-accent" : "bg-line-strong"
        }`}
      >
        {/* White on both tracks: at least 3:1 in every theme (the surface token is not, in dark). */}
        <span
          aria-hidden="true"
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-on-accent transition-[left] duration-press ease-standard ${
            checked ? "left-[calc(100%-1.25rem-3px)]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
