/**
 * Writes the Next.js build id into out/sw.js (runs after `next build`, see package.json).
 *
 * The browser installs a new service worker only when sw.js changes. Without a per-build
 * value the file stays the same across deploys, its "activate" cleanup never runs, and the
 * static cache keeps the files of every old deploy (QA P2-7).
 */
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const PLACEHOLDER = "__SW_VERSION__";

export function stampServiceWorker(source: string, version: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(version)) {
    throw new Error(`Invalid service worker version: ${JSON.stringify(version)}`);
  }
  if (!source.includes(`"${PLACEHOLDER}"`)) {
    throw new Error(`sw.js has no "${PLACEHOLDER}" placeholder; it would not change between deploys.`);
  }
  return source.replace(`"${PLACEHOLDER}"`, `"${version}"`);
}

function main() {
  const root = process.cwd();
  const buildId = fs.readFileSync(path.join(root, ".next", "BUILD_ID"), "utf8").trim();
  const swPath = path.join(root, "out", "sw.js");
  fs.writeFileSync(swPath, stampServiceWorker(fs.readFileSync(swPath, "utf8"), buildId));
  console.log(`Stamped out/sw.js with version ${buildId}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
