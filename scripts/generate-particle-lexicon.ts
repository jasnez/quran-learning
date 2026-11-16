/**
 * Rebuilds src/data/transliteration/particles.json: for every Arabic word of the Quran that
 * starts with a particle the IZ BiH transcription writes separately (we, fe, bi, li, le, ke,
 * the question e, the vocative jā), the number of such particles.
 *
 * Input: the ayahs in src/data/ayahs, the English word glosses in public/data/words and the
 * words decided by hand in src/data/transliteration/particle-overrides.json.
 * See src/lib/quran/particles.ts for how the decision is made. No network access.
 *
 * Run from the project root:
 *   npx tsx scripts/generate-particle-lexicon.ts            report only, writes nothing
 *   npx tsx scripts/generate-particle-lexicon.ts --doubts   also list the words decided on one kind of evidence
 *   npx tsx scripts/generate-particle-lexicon.ts --write    write particles.json
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeParticles, type ParticleSource } from "../src/lib/quran/particles";
import { isQuranicSignToken } from "../src/lib/quran/transliteration";

const ROOT = process.cwd();
const AYAHS_DIR = path.join(ROOT, "src", "data", "ayahs");
const WORDS_DIR = path.join(ROOT, "public", "data", "words");
const OVERRIDES_PATH = path.join(ROOT, "src", "data", "transliteration", "particle-overrides.json");
const LEXICON_PATH = path.join(ROOT, "src", "data", "transliteration", "particles.json");

type AyahJson = { ayahNumberGlobal: number; arabicText: string };
type WordJson = { ayahNumberGlobal: number; wordOrder: number; translationShort?: string };

/** Every word of the Quran with its English gloss, where the two word lists of an ayah line up. */
export function loadParticleSources(): ParticleSource[] {
  const sources: ParticleSource[] = [];
  for (const file of fs.readdirSync(AYAHS_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const ayahs = (JSON.parse(fs.readFileSync(path.join(AYAHS_DIR, file), "utf-8")) as { ayahs: AyahJson[] }).ayahs;
    const words = JSON.parse(fs.readFileSync(path.join(WORDS_DIR, file), "utf-8")) as WordJson[];
    const byAyah = new Map<number, WordJson[]>();
    for (const w of words) byAyah.set(w.ayahNumberGlobal, [...(byAyah.get(w.ayahNumberGlobal) ?? []), w]);
    for (const ayah of ayahs) {
      const tokens = ayah.arabicText.split(/\s+/).filter((t) => t && !isQuranicSignToken(t));
      const glosses = (byAyah.get(ayah.ayahNumberGlobal) ?? []).sort((a, b) => a.wordOrder - b.wordOrder);
      const aligned = tokens.length === glosses.length;
      tokens.forEach((word, i) => sources.push({ word, gloss: aligned ? glosses[i].translationShort : undefined }));
    }
  }
  return sources;
}

/** One entry per line, sorted, so that a change shows up as a small diff. */
export function serializeLexicon(counts: Map<string, number>): string {
  const entries = [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{\n${entries.map(([word, n]) => `${JSON.stringify(word)}: ${n}`).join(",\n")}\n}\n`;
}

function main(): void {
  const args = process.argv.slice(2);
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8")) as Record<string, number>;
  const sources = loadParticleSources();
  if (sources.every((s) => !s.gloss)) {
    console.error("No glosses found in public/data/words: the particles cannot be determined. Nothing written.");
    process.exit(1);
  }
  const { counts, doubts } = analyzeParticles(sources, overrides);
  const serialized = serializeLexicon(counts);
  const current = fs.existsSync(LEXICON_PATH) ? fs.readFileSync(LEXICON_PATH, "utf-8") : "";

  console.log(`${new Set(sources.map((s) => s.word)).size} distinct words, ${counts.size} start with a separable particle.`);
  console.log(`${Object.keys(overrides).length} decided by hand, ${doubts.length} decided on one kind of evidence.`);
  if (args.includes("--doubts")) {
    for (const d of doubts) console.log(`${d.split ? "split" : "kept "} ${d.particle} (${d.support} only)  ${d.word}  ${d.glosses[0] ?? ""}`);
  }
  if (serialized === current) {
    console.log("particles.json is up to date.");
  } else if (args.includes("--write")) {
    fs.writeFileSync(LEXICON_PATH, serialized, "utf-8");
    console.log("particles.json written.");
  } else {
    console.log("particles.json differs from this result. Run with --write to save.");
  }
}

// Only when run as a script; the test imports the helpers above.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) main();
