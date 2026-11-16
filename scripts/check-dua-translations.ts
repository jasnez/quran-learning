/**
 * Drift check: compares the Bosnian translation of each Quranic dua in src/lib/duas/data.ts
 * with the Besim Korkut translation (resource 126) that the Quran.com API serves today.
 * Writes nothing.
 *
 * It needs network access, so it is not part of `npm test`. The unit test in
 * src/lib/duas/__tests__/data.test.ts compares the duas offline with src/data/ayahs instead.
 *
 * Run from the project root:
 *   npm run check:dua-translations
 *
 * Exits non-zero when a translation differs or a request fails. A difference means the text
 * on Quran.com changed (or the stored one is wrong). Review it before changing anything:
 * the dua in data.ts and its ayah in src/data/ayahs (scripts/generate-ayahs-json.ts) must
 * change together, or the unit test fails.
 */

import { QURANIC_DUAS } from "../src/lib/duas/data";
import { fetchVerseContentByKey } from "../src/lib/quran/fetch-verse-by-key";

async function main(): Promise<void> {
  const differences: string[] = [];
  // One request at a time, to stay gentle with the API.
  for (const dua of QURANIC_DUAS) {
    const live = (await fetchVerseContentByKey(dua.id)).translationBosnian;
    if (live === "") {
      differences.push(`${dua.id}: the API response holds no translation 126`);
    } else if (live !== dua.translationBosnian) {
      differences.push(`${dua.id}:\n  data.ts:   ${dua.translationBosnian}\n  Quran.com: ${live}`);
    }
  }

  if (differences.length > 0) {
    console.error(
      `${differences.length} of ${QURANIC_DUAS.length} dua translations differ from Quran.com (Besim Korkut, resource 126):\n${differences.join("\n")}`
    );
    process.exitCode = 1;
    return;
  }
  console.log(`All ${QURANIC_DUAS.length} dua translations match Quran.com (Besim Korkut, resource 126).`);
}

main().catch((error: unknown) => {
  console.error("Drift check stopped before it compared every dua:", error);
  process.exitCode = 1;
});
