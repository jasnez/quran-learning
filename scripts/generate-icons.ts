/**
 * Draws the app icons and the link-preview image from the mark, public/icons/elif-mark.svg (the
 * design system's "elif u rozeti": shapes only, no text).
 *
 *   npx tsx scripts/generate-icons.ts
 *
 * Uses the Chromium that Playwright installs for the e2e tests (`npx playwright install
 * chromium`), so no image library is needed. The link-preview image sets its text in the app's own
 * font files (src/app/fonts), so every machine draws the same image; the files are committed.
 */
import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";
import { SITE_NAME, SITE_TAGLINE } from "../src/lib/site";

// Light Tezhib tokens (src/app/globals.css).
const ACCENT = "#1F3A5F";
const PAPER = "#F7F4ED";
const INK = "#1E1B16";
const INK_MUTED = "#5F584A";

type Variant = {
  file: string;
  size: number;
  /** Fill the whole square with the accent first (iOS and maskable icons have no transparent corners). */
  fullBleed: boolean;
  /** The mark's size as a share of the icon. A maskable icon keeps it inside the 80 % safe zone. */
  scale: number;
};

const VARIANTS: Variant[] = [
  { file: "public/icons/icon-elif-192.png", size: 192, fullBleed: false, scale: 1 },
  { file: "public/icons/icon-elif-512.png", size: 512, fullBleed: false, scale: 1 },
  // A launcher crops a maskable icon to its own shape; only a centred circle 80 % wide is sure to
  // stay visible, so the mark (whose rosette nearly touches its edges) is drawn at 80 %.
  { file: "public/icons/icon-elif-maskable-512.png", size: 512, fullBleed: true, scale: 0.8 },
  // iOS rounds the corners itself and shows transparent pixels as black.
  { file: "src/app/apple-icon.png", size: 180, fullBleed: true, scale: 1 },
];
const FAVICON = { file: "src/app/favicon.ico", size: 32 };
const OG = { file: "public/og.png", width: 1200, height: 630 };

/** Runs in the browser: draws the SVG on a canvas and returns a PNG data URL. */
async function drawIcon(args: { svg: string; size: number; fullBleed: boolean; scale: number; background: string }) {
  const { svg, size, fullBleed, scale, background } = args;
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas context");
  if (fullBleed) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }
  const drawn = size * scale;
  ctx.drawImage(img, (size - drawn) / 2, (size - drawn) / 2, drawn, drawn);
  return canvas.toDataURL("image/png");
}

/** A one-image .ico that holds a PNG (supported by every current browser). */
function icoFromPng(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size, 6); // width
  header.writeUInt8(size, 7); // height
  header.writeUInt8(0, 8); // no palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14); // image size
  header.writeUInt32LE(header.length, 18); // image offset
  return Buffer.concat([header, png]);
}

function fontFace(root: string, family: string, file: string, weight: string): string {
  const data = fs.readFileSync(path.join(root, "src/app/fonts", file)).toString("base64");
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};}`;
}

function ogHtml(root: string, svg: string): string {
  return `<!doctype html><html lang="bs"><head><meta charset="utf-8"><style>
${fontFace(root, "Elif Book", "ElifBook-Bold.woff2", "700")}
${fontFace(root, "Elif Sans", "ElifSans.woff2", "400 700")}
html,body{margin:0;width:${OG.width}px;height:${OG.height}px;background:${PAPER};}
body{display:flex;align-items:center;gap:72px;padding:0 120px;box-sizing:border-box;}
.mark{width:240px;height:240px;flex:none;}
h1{margin:0;font:700 120px/1 "Elif Book";color:${INK};}
p{margin:24px 0 0;font:400 40px/1.3 "Elif Sans";color:${INK_MUTED};}
</style></head><body>
<img class="mark" alt="" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}">
<div><h1>${SITE_NAME}</h1><p>${SITE_TAGLINE}</p></div>
</body></html>`;
}

async function main() {
  const root = process.cwd();
  const svg = fs.readFileSync(path.join(root, "public/icons/elif-mark.svg"), "utf8");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const v of [...VARIANTS, { ...FAVICON, fullBleed: false, scale: 1 }]) {
      const dataUrl = await page.evaluate(drawIcon, { svg, size: v.size, fullBleed: v.fullBleed, scale: v.scale, background: ACCENT });
      const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
      if (png.length === 0) throw new Error(`Empty PNG for ${v.file}`);
      const out = v.file.endsWith(".ico") ? icoFromPng(png, v.size) : png;
      fs.writeFileSync(path.join(root, v.file), out);
      console.log(`${v.file}: ${v.size}x${v.size}, ${out.length} bytes`);
    }

    await page.setViewportSize({ width: OG.width, height: OG.height });
    await page.setContent(ogHtml(root, svg));
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").length);
    if (loaded < 2) throw new Error(`Link-preview fonts did not load (${loaded} of 2)`);
    const og = await page.screenshot({ type: "png" });
    fs.writeFileSync(path.join(root, OG.file), og);
    console.log(`${OG.file}: ${OG.width}x${OG.height}, ${og.length} bytes`);
  } finally {
    await browser.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
