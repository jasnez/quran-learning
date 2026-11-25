/**
 * The one look of a chosen or pressed control (Phase 4, D2): accent wash, accent text and an
 * accent border. The border is what makes it a shape: on the sunken track of a ChoiceGroup the
 * wash alone is 1.01:1 (light theme), the border 9.5:1 (themeTokens.test.ts).
 * Use it through ChoiceGroup and FilterChip; src/app/__tests__/selectedStyle.test.ts lists the
 * few other places that may.
 */
export const SELECTED_CLASSES = "border-accent-text bg-accent-wash text-accent-text";

/** An option that is not chosen: no fill, a border of the same width so nothing shifts. */
export const IDLE_CLASSES = "border-transparent text-ink-muted hover:text-ink";
