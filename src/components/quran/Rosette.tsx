type RosetteProps = {
  /** The ayah number. */
  number: number;
  /** Filled with gold at 25% while its ayah is playing. */
  filled?: boolean;
};

/**
 * The ayah number in the eight-pointed mark of a mushaf, placed at the end of the Arabic text.
 * Ornament for the eye only: it is hidden from screen readers (the ayah unit names the ayah) and
 * is not selected when the ayah text is copied. Gold carries no information here; the number is
 * ink.
 */
export function Rosette({ number, filled = false }: RosetteProps) {
  return (
    <span
      data-rosette
      data-filled={filled ? "true" : undefined}
      aria-hidden="true"
      className={`relative mx-1.5 inline-grid h-8 w-8 select-none place-items-center align-middle font-sans font-semibold leading-none text-ink [direction:ltr] ${
        number >= 100 ? "text-[0.6875rem]" : "text-xs"
      }`}
    >
      <svg
        viewBox="0 0 40 40"
        focusable="false"
        className={`absolute inset-0 h-full w-full text-gold ${filled ? "fill-gold/25" : "fill-none"}`}
      >
        <rect x="8.5" y="8.5" width="23" height="23" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect
          x="8.5"
          y="8.5"
          width="23"
          height="23"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
          transform="rotate(45 20 20)"
        />
      </svg>
      <span className="relative">{number}</span>
    </span>
  );
}
