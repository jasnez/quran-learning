/**
 * Finds the Next.js static files (/_next/static/chunks/*, /_next/static/media/*) that a
 * page, script or stylesheet refers to. Pages refer to them as "/_next/static/...",
 * the Turbopack runtime as "static/chunks/...", and stylesheets as "url(../media/...)".
 *
 * public/sw.js has a copy of this function (it cannot import modules); a test checks
 * that both return the same result.
 */
const STATIC_REF = /(?:\/_next\/)?static\/(chunks|media)\/([A-Za-z0-9._~-]+)|\.\.\/media\/([A-Za-z0-9._~-]+)/g;

export function extractStaticRefs(text: string): string[] {
  const refs = new Set<string>();
  for (const m of text.matchAll(STATIC_REF)) {
    refs.add(m[3] ? `/_next/static/media/${m[3]}` : `/_next/static/${m[1]}/${m[2]}`);
  }
  return [...refs];
}
