/**
 * Draws the app icons as PNG files (QA section 7: the manifest had only SVG icons marked
 * "any maskable", and there was no apple-touch-icon).
 *
 *   npx tsx scripts/generate-icons.ts
 *
 * Uses the Chromium that Playwright installs for the e2e tests (`npx playwright install
 * chromium`), so no image library is needed. The letter is drawn with the system serif font
 * of the machine that runs the script; the PNG files are committed, so every device shows
 * the same icon.
 */
import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";

const BACKGROUND = "#16a34a";
const LETTER = String.fromCodePoint(0x0642); // qaf

type Variant = {
  file: string;
  size: number;
  /** Rounded corners with transparent pixels; false fills the whole square. */
  rounded: boolean;
  /** The longer side of the letter's drawn shape, as a share of the icon size. */
  letter: number;
};

const VARIANTS: Variant[] = [
  { file: "public/icons/icon-192.png", size: 192, rounded: true, letter: 0.5 },
  { file: "public/icons/icon-512.png", size: 512, rounded: true, letter: 0.5 },
  // A launcher crops a maskable icon to its own shape; only a centred circle 80 % of the
  // icon wide is sure to stay visible. A letter 0.45 wide and high fits in it (diagonal 0.64).
  { file: "public/icons/icon-maskable-512.png", size: 512, rounded: false, letter: 0.45 },
  // iOS rounds the corners itself and shows transparent pixels as black.
  { file: "src/app/apple-icon.png", size: 180, rounded: false, letter: 0.5 },
];

/** Runs in the browser: draws one icon on a canvas and returns it as a PNG data URL. */
function drawIcon(args: { size: number; rounded: boolean; letter: number; background: string; glyph: string }) {
  const { size, rounded, letter, background, glyph } = args;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas context");

  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, rounded ? size * 0.16 : 0);
  ctx.fill();

  // Scale the font so the drawn shape (not the font's line box) has the wanted size.
  const probe = 100;
  ctx.font = `${probe}px serif`;
  const m = ctx.measureText(glyph);
  const shapeW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const shapeH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const fontSize = (probe * letter * size) / Math.max(shapeW, shapeH);
  ctx.font = `${fontSize}px serif`;
  const s = ctx.measureText(glyph);
  // Centre the drawn shape: it spans x - left .. x + right and y - ascent .. y + descent.
  const x = size / 2 - (s.actualBoundingBoxRight - s.actualBoundingBoxLeft) / 2;
  const y = size / 2 + (s.actualBoundingBoxAscent - s.actualBoundingBoxDescent) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(glyph, x, y);
  return canvas.toDataURL("image/png");
}

async function main() {
  const root = process.cwd();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const v of VARIANTS) {
      const dataUrl = await page.evaluate(drawIcon, {
        size: v.size,
        rounded: v.rounded,
        letter: v.letter,
        background: BACKGROUND,
        glyph: LETTER,
      });
      const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
      if (png.length === 0) throw new Error(`Empty PNG for ${v.file}`);
      fs.writeFileSync(path.join(root, v.file), png);
      console.log(`${v.file}: ${v.size}x${v.size}, ${png.length} bytes`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
