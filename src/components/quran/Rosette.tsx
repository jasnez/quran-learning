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
 *
 * Size: 32 px, growing with the letters from about 29 px text up (1.1em of the Arabic size), so
 * it does not look lost next to 44 px letters. The mark has no font size of its own, so its em
 * is the Arabic text's; the number sets its own.
 */
export function Rosette({ number, filled = false }: RosetteProps) {
  return (
    <span
      data-rosette
      data-filled={filled ? "true" : undefined}
      aria-hidden="true"
      className="relative mx-1.5 inline-grid h-[max(2rem,1.1em)] w-[max(2rem,1.1em)] select-none place-items-center align-middle leading-none [direction:ltr]"
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
      <span
        className={`relative font-sans font-semibold leading-none text-ink ${
          number >= 100 ? "text-[length:max(0.6875rem,0.33em)]" : "text-[length:max(0.75rem,0.38em)]"
        }`}
      >
        {number}
      </span>
    </span>
  );
}
