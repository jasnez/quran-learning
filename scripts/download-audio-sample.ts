/**
 * Download a small sample of verse MP3s from EveryAyah into public/audio/mishary-alafasy/
 * so you can run npm run upload:audio and test CDN playback.
 *
 * Run: npm run download:audio-sample
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "audio", "mishary-alafasy");

const BASE = "https://everyayah.com/data/Alafasy_128kbps";
// Surah Al-Fatiha (7 verses): 001001 - 001007
const FILES = ["001001", "001002", "001003", "001004", "001005", "001006", "001007"];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of FILES) {
    const url = `${BASE}/${name}.mp3`;
    const dest = path.join(outDir, `${name}.mp3`);
    if (fs.existsSync(dest)) {
      console.log("Skip (exists):", name + ".mp3");
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log("Downloaded:", name + ".mp3");
    } catch (e) {
      console.error("Failed", name + ".mp3", e);
    }
  }
  console.log("Done. Run: npm run upload:audio");
}

main();
