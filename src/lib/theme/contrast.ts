/**
 * WCAG 2.x relative luminance and contrast ratio, for checking the theme tokens in tests.
 * Accepts only opaque "#RRGGBB" colors, which is how every token in globals.css is written.
 */

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const m = HEX.exec(hex);
  if (!m) throw new Error(`Expected a #RRGGBB color, got "${hex}"`);
  const [r, g, b] = m.slice(1).map((h) => channel(parseInt(h, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
