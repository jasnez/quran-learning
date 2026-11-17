/**
 * Makes the static export smaller (runs after `next build`, see package.json).
 *
 * Vercel keeps the whole out/ folder of every preview and production deployment, and the
 * Hobby plan has 10 GB for all of them, so each MB here is stored once per deploy.
 *
 * 1. Removes `__next._full.txt`. Next writes it next to the segment prefetch files of every
 *    route for PPR resume on a Next server. It is a byte-for-byte copy of the route's
 *    `<route>.txt`, and the client router of an `output: "export"` build never requests it
 *    (it fetches `<route>.txt`, `__next._tree.txt` and the segment files). Before anything is
 *    deleted, every copy must equal its route payload and no client chunk may mention
 *    `_full`; otherwise the build fails.
 * 2. Minifies the JSON in out/data (copied from public/data, which stays readable).
 */
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const FULL_SEGMENT_FILE = "__next._full.txt";

function walk(dir: string, visit: (file: string) => void) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, visit);
    else visit(file);
  }
}

/** `out/surah/2/__next._full.txt` -> `out/surah/2.txt`; the root route's payload is `out/index.txt`. */
function routePayloadFor(outDir: string, fullFile: string): string {
  const routeDir = path.dirname(fullFile);
  return path.resolve(routeDir) === path.resolve(outDir)
    ? path.join(outDir, "index.txt")
    : `${routeDir}.txt`;
}

export function removeFullSegmentCopies(outDir: string): { files: number; bytes: number } {
  const staticDir = path.join(outDir, "_next", "static");
  const clientFilesMentioningFull: string[] = [];
  if (fs.existsSync(staticDir)) {
    walk(staticDir, (file) => {
      if (file.endsWith(".js") && fs.readFileSync(file, "utf8").includes("_full")) {
        clientFilesMentioningFull.push(path.relative(outDir, file));
      }
    });
  }
  if (clientFilesMentioningFull.length > 0) {
    throw new Error(
      `Client code mentions "_full" (${clientFilesMentioningFull.join(", ")}): the router may request ` +
        `${FULL_SEGMENT_FILE}, so it is not removed. Check the Next.js export protocol before changing this script.`,
    );
  }

  const copies: string[] = [];
  walk(outDir, (file) => {
    if (path.basename(file) === FULL_SEGMENT_FILE) copies.push(file);
  });

  // Check every copy first, so a failure leaves the export as Next wrote it.
  let bytes = 0;
  for (const copy of copies) {
    const payload = routePayloadFor(outDir, copy);
    if (!fs.existsSync(payload)) {
      throw new Error(`${path.relative(outDir, copy)} has no route payload at ${path.relative(outDir, payload)}.`);
    }
    const content = fs.readFileSync(copy);
    if (!content.equals(fs.readFileSync(payload))) {
      throw new Error(`${path.relative(outDir, copy)} differs from ${path.relative(outDir, payload)}; not removing it.`);
    }
    bytes += content.length;
  }
  for (const copy of copies) fs.rmSync(copy);
  return { files: copies.length, bytes };
}

export function minifyJsonFiles(dir: string): { files: number; before: number; after: number } {
  let files = 0;
  let before = 0;
  let after = 0;
  walk(dir, (file) => {
    if (!file.endsWith(".json")) return;
    const source = fs.readFileSync(file, "utf8");
    let data: unknown;
    try {
      data = JSON.parse(source);
    } catch (err) {
      throw new Error(`${file} is not valid JSON: ${(err as Error).message}`);
    }
    const minified = JSON.stringify(data);
    fs.writeFileSync(file, minified);
    files++;
    before += Buffer.byteLength(source);
    after += Buffer.byteLength(minified);
  });
  if (files === 0) throw new Error(`${dir} has no JSON files; the app loads its data from there.`);
  return { files, before, after };
}

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

function main() {
  const outDir = path.join(process.cwd(), "out");
  const removed = removeFullSegmentCopies(outDir);
  if (removed.files === 0) {
    console.warn(`[prune-export] WARN: no ${FULL_SEGMENT_FILE} found; the Next.js export layout may have changed.`);
  } else {
    console.log(`[prune-export] Removed ${removed.files} ${FULL_SEGMENT_FILE} copies (${mb(removed.bytes)}).`);
  }
  const json = minifyJsonFiles(path.join(outDir, "data"));
  console.log(`[prune-export] Minified ${json.files} JSON files in out/data: ${mb(json.before)} -> ${mb(json.after)}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
