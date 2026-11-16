/**
 * Finds the particles that the IZ BiH transcription writes as separate words: we, fe, bi, li,
 * le, ke, the question e and the vocative jā ("we lem", "bi rabbin-nās", "E lem tere").
 *
 * In Arabic they are written together with the next word, and the spelling alone does not say
 * whether an initial waw is "and" or the first letter of the root ("We wedžedeke": and He found
 * you). Two kinds of evidence from data that is already in the project are combined:
 * - form: the rest of the word occurs in the Quran on its own, or after "and" / a preposition;
 * - gloss: the English word-by-word gloss from Quran.com starts the way the particle is translated.
 * `overrides` holds the words that were decided by hand.
 *
 * Arabic characters are built from code points on purpose (see transliteration.ts).
 */

const ch = (codePoint: number): string => String.fromCodePoint(codePoint);

const FATHA = ch(0x064e);
const KASRA = ch(0x0650);
const SHADDA = ch(0x0651);
const MADDA = ch(0x0653);
const HAMZA_ABOVE = ch(0x0654);
const DAGGER_ALIF = ch(0x0670);
const TATWEEL = ch(0x0640);
const HAMZA = ch(0x0621);
const ALIF_HAMZA = ch(0x0623);
const ALIF = ch(0x0627);
const ALIF_WASLA = ch(0x0671);
const LAM = ch(0x0644);
const HA = ch(0x0647);
const KAF = ch(0x0643);
const MEEM = ch(0x0645);
const NOON = ch(0x0646);
const QAF = ch(0x0642);
const DAL = ch(0x062f);
const DHAL = ch(0x0630);
const YA = ch(0x064a);
const ALIF_MAQSURA = ch(0x0649);

export type Particle = "wa" | "fa" | "bi" | "li" | "la" | "ka" | "a" | "ya";

/** Spellings a particle starts with. The vocative is ya + fatha + dagger alif on a tatweel. */
const PREFIXES: [Particle, string][] = [
  ["ya", YA + FATHA + TATWEEL + DAGGER_ALIF],
  ["wa", ch(0x0648) + FATHA],
  ["fa", ch(0x0641) + FATHA],
  ["bi", ch(0x0628) + KASRA],
  ["li", LAM + KASRA],
  ["la", LAM + FATHA],
  ["ka", KAF + FATHA],
  ["a", ALIF_HAMZA + FATHA],
  ["a", HAMZA + FATHA],
];

/** Order in which particles can follow each other: e-fe-le, we-bi, fe-le-bi. */
const RANK: Record<Particle, number> = { a: 0, ya: 0, wa: 1, fa: 1, la: 2, bi: 3, li: 3, ka: 3 };

/** How the Quran.com gloss reads when the word begins with the particle. */
const GLOSS: Record<Particle, RegExp> = {
  wa: /^(and|while|but|by|even|or|nor|yet|then|so|when|although|though|whereas|also)\b/i,
  fa: /^(then|so|and|but|therefore|thus|hence|for|lest|that|or|yet|now|thereupon|consequently|when|rather|let)\b/i,
  bi: /^(with|in|of|by|for|to|about|at|on|upon|through|from|into|without|against|because|over|concerning|regarding|after)\b/i,
  li: /^(for|to|that|so|of|in|on|at|unto|because|until|let|lest|towards?|upon|against)\b/i,
  la: /\b(surely|certainly|indeed|verily|truly|definitely|assuredly)\b/i,
  ka: /^((is|are|was|were|and|or|but) )?(like|as)\b/i,
  // A question: an auxiliary followed by its subject ("Do you take", "Then is it not"), or "whether".
  a: /^((then|so|and|or|but|what)[, ]+)*((do|does|did|have|has|had|am|are|is|was|were|will|would|shall|should|can|could)( then)? (you|they|we|i|he|she|it|not|there|your|my|our|his|her|their|this|that|these|those|allah|one|anyone)\b|whether\b|is it\b)/i,
  ya: /^(o|oh|alas|woe|ah)\b/i,
};

/**
 * Words that start with bi- / li- as part of the root, given by the letters (without vowel
 * signs) that follow: bināʼ, biṭāneh, biḍāʻah, bisāṭ; lisān, libās, liqāʼ, lizām, liwāẕ, libed.
 */
const ROOT_WORDS: Partial<Record<Particle, string[]>> = {
  bi: [[0x0646, 0x0627, 0x0621], [0x0637, 0x0627, 0x0646], [0x0636, 0x0639], [0x0633, 0x0627, 0x0637]].map((cps) =>
    String.fromCodePoint(...cps)
  ),
  li: [
    [0x0633, 0x0627, 0x0646], [0x0628, 0x0627, 0x0633], [0x0642, 0x0627], [0x0632, 0x0627, 0x0645],
    [0x0648, 0x0627, 0x0630], [0x0628, 0x062f, 0x0627],
  ].map((cps) => String.fromCodePoint(...cps)),
};

/** Letters (without vowel signs) of the pronouns that form one word with bi-, li-, le-: bihī, lehum, lī. */
const PRONOUNS = new Set(
  [
    [HA], [HA, ALIF], [HA, MEEM], [HA, MEEM, ALIF], [HA, NOON], [KAF], [KAF, MEEM], [KAF, MEEM, ALIF],
    [KAF, NOON], [NOON, ALIF], [YA], [ALIF_MAQSURA],
  ].map((letters) => letters.join(""))
);

function isLetter(char: string | undefined): boolean {
  const cp = char?.codePointAt(0) ?? 0;
  return (cp >= 0x0621 && cp <= 0x064a) || cp === 0x0671;
}

/** Fatha, damma, kasra and the three tanwin signs. */
function isVowelSign(char: string | undefined): boolean {
  const cp = char?.codePointAt(0) ?? 0;
  return cp >= 0x064b && cp <= 0x0650;
}

function lettersOf(text: string): string {
  return Array.from(text).filter((c) => isLetter(c) && c !== TATWEEL).join("");
}

/** The words of a gloss without brackets and quotation marks: "(is) surely" -> "is surely". */
function plainGloss(gloss: string): string {
  return gloss.replace(/[^A-Za-z ,.!?;:-]/g, "").trim();
}

/** A doubled first letter only marks idgham with the previous word. */
function withoutLeadingShadda(word: string): string {
  const chars = Array.from(word);
  return chars[1] === SHADDA ? chars[0] + chars.slice(2).join("") : word;
}

/**
 * Form used to recognise the same word in different surroundings: the hamza is written on
 * different carriers depending on what precedes it, and the madda sign depends on what follows.
 */
function matchKey(text: string): string {
  let out = "";
  const chars = Array.from(withoutLeadingShadda(text));
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const cp = c.codePointAt(0) ?? 0;
    if (c === MADDA || cp === 0x06e2 || cp === 0x06ed) continue;
    if (c === TATWEEL) {
      // A tatweel carries either a hamza or the dagger alif of the letter before it.
      let j = i + 1;
      let marks = "";
      while (j < chars.length && !isLetter(chars[j])) marks += chars[j++];
      out += (marks.includes(HAMZA_ABOVE) ? HAMZA : "") + marks.replace(HAMZA_ABOVE, "").replace(MADDA, "");
      i = j - 1;
      continue;
    }
    out += cp === 0x0623 || cp === 0x0624 || cp === 0x0625 || cp === 0x0626 ? HAMZA : c;
  }
  return out;
}

export type ParticleSource = { word: string; gloss?: string };

export type ParticleDoubt = {
  word: string;
  particle: Particle;
  glosses: string[];
  /** What the analysis decided. */
  split: boolean;
  /** Which kind of evidence supported a particle. */
  support: "form" | "gloss";
};

export type ParticleAnalysis = {
  /** Arabic word -> number of leading particles written as separate words. Words without any are absent. */
  counts: Map<string, number>;
  /** Words for which only one kind of evidence supports a particle. */
  doubts: ParticleDoubt[];
};

export function analyzeParticles(sources: Iterable<ParticleSource>, overrides: Record<string, number> = {}): ParticleAnalysis {
  const glossesByWord = new Map<string, string[]>();
  for (const { word, gloss } of sources) {
    if (!glossesByWord.has(word)) glossesByWord.set(word, []);
    if (gloss?.trim()) glossesByWord.get(word)!.push(gloss.trim());
  }

  const prefixOf = (text: string): [Particle, string] | null => {
    for (const [particle, prefix] of PREFIXES) {
      if (!text.startsWith(prefix)) continue;
      const rest = text.slice(prefix.length);
      // The long a of the vocative may carry a madda sign before a hamza.
      return [particle, particle === "ya" && rest.startsWith(MADDA) ? rest.slice(MADDA.length) : rest];
    }
    return null;
  };

  /**
   * At least half of the glosses of the word read like the particle. For "and" / "then" a
   * word the translator added in parentheses does not count: "(and) boastful" is fe-ḫūr, a root.
   */
  const glossed = (particle: Particle, glosses: string[]): boolean => {
    const read = particle === "wa" || particle === "fa" ? glosses.map((g) => g.replace(/^(\([^)]*\)\s*)+/, "")) : glosses;
    return glosses.length > 0 && read.filter((g) => GLOSS[particle].test(plainGloss(g))).length * 2 >= glosses.length;
  };

  // Form evidence: every whole word, and what follows "and" or a preposition where the gloss agrees.
  const wholeWords = new Map<string, string>();
  /** Stem -> the words that attest it. A word does not count as evidence for itself. */
  const stems = new Map<string, Set<string>>();
  const attest = (key: string, word: string) => {
    if (!stems.has(key)) stems.set(key, new Set());
    stems.get(key)!.add(word);
  };
  for (const [word, glosses] of glossesByWord) {
    const text = withoutLeadingShadda(word);
    wholeWords.set(text, word);
    attest(matchKey(text), "");
    const hit = prefixOf(text);
    if (hit && RANK[hit[0]] !== 0 && hit[0] !== "la" && hit[0] !== "ka" && glossed(hit[0], glosses)) attest(matchKey(hit[1]), word);
  }
  const hasForm = (rest: string, word: string): boolean => {
    const witnesses = stems.get(matchKey(rest));
    return witnesses !== undefined && [...witnesses].some((w) => w !== word);
  };

  const doubts: ParticleDoubt[] = [];
  const memo = new Map<string, number>();

  /** Number of separable particles at the start of `text`; `minRank` is the rank the next particle must exceed. */
  const count = (text: string, minRank: number, glosses: string[] | null, word: string, afterQuestion = false): number => {
    const hit = prefixOf(text);
    if (!hit) return 0;
    const [particle, rest] = hit;
    if (RANK[particle] < minRank || (minRank > 0 && RANK[particle] === 0)) return 0;
    const chars = Array.from(rest);
    if (chars.length === 0 || chars[0] === ALIF_WASLA) return 0; // joined with the article anyway
    // The particle's own vowel is long, or the rest starts with a doubled or vowelless letter.
    // (A hamza written on a tatweel has its hamza sign before the vowel.)
    const firstSign = chars[1] === HAMZA_ABOVE ? chars[2] : chars[1];
    if (!isLetter(chars[0]) || !isVowelSign(firstSign)) return 0;

    const letters = lettersOf(rest);
    const isPronoun = PRONOUNS.has(letters);
    const isMa = letters === MEEM + ALIF || letters === MEEM;
    const isRoot = (ROOT_WORDS[particle] ?? []).some((stem) => letters.startsWith(stem));
    const form = hasForm(rest, word);
    const gloss = glosses !== null && glossed(particle, glosses);
    const wordGlosses = glossesByWord.get(word) ?? [];

    let split: boolean;
    switch (particle) {
      case "wa":
      case "fa":
        // After the question hamza it is always the conjunction: "E fe lā", "E we lem".
        split = form || gloss || afterQuestion;
        break;
      case "bi":
      case "li":
        // bihī, lī and bimā, limā, lime are one word. Otherwise a word that starts with bi- / li-
        // is the preposition, except the few words where the letter belongs to the root.
        split = !isPronoun && !isMa && !isRoot;
        break;
      case "la": {
        // lehū, lemā and leqad are one word. Before a hamza it is always the emphatic lam
        // ("le udḫilennehum"); "surely" may stand anywhere in the gloss, also after "and".
        const first = chars[0].codePointAt(0) ?? 0;
        const beforeHamza = first === 0x0623 || first === 0x0625;
        const emphatic = wordGlosses.length > 0 && glossed("la", wordGlosses);
        split = !isPronoun && !isMa && letters !== QAF + DAL && (form || emphatic || beforeHamza);
        break;
      }
      case "ka": {
        // kemā, keẕālike, keʼenne, keʼejjin are one word.
        const compound = isMa || letters.startsWith(DHAL + LAM + KAF) || letters.startsWith(ALIF_HAMZA + NOON) || letters.startsWith(ALIF_HAMZA + YA);
        split = !compound && (glosses === null ? form : gloss);
        break;
      }
      case "a": {
        // The question hamza. Certain before another hamza written on the line or on alif; before
        // a hamza on waw / ya the rest must be a known word (not "eʼimmeh"). Otherwise the gloss
        // must read as a question, or the rest must be a word that itself starts with we / fe.
        const first = chars[0].codePointAt(0) ?? 0;
        const beforeHamza = first === 0x0621 || first === 0x0623 || first === 0x0625;
        const beforeCarriedHamza = first === 0x0624 || first === 0x0626;
        const restAsWord = wholeWords.get(rest);
        const restParticle = prefixOf(rest)?.[0];
        const beforeConjunction =
          restAsWord !== undefined && (restParticle === "wa" || restParticle === "fa") && countWord(restAsWord) > 0;
        const question = glosses !== null && glosses.some((g) => GLOSS.a.test(plainGloss(g)));
        split = beforeHamza || (beforeCarriedHamza && form) || beforeConjunction || question;
        break;
      }
      default:
        split = gloss;
    }
    if ((particle === "wa" || particle === "fa" || particle === "la") && glosses !== null && form !== gloss) {
      doubts.push({ word, particle, glosses, split, support: form ? "form" : "gloss" });
    }
    if (!split) return 0;

    // The rest may be a word of its own with its own gloss ("we bi iẕni"); otherwise only form counts.
    const restWord = wholeWords.get(rest);
    const next = prefixOf(rest);
    if (restWord !== undefined && next && RANK[next[0]] > RANK[particle]) return 1 + countWord(restWord);
    return 1 + count(rest, RANK[particle] + 1, null, word, particle === "a");
  };

  const countWord = (word: string): number => {
    if (word in overrides) return overrides[word];
    const known = memo.get(word);
    if (known !== undefined) return known;
    memo.set(word, 0); // guards against cycles
    const result = count(withoutLeadingShadda(word), 0, glossesByWord.get(word) ?? [], word);
    memo.set(word, result);
    return result;
  };

  const counts = new Map<string, number>();
  for (const word of glossesByWord.keys()) {
    const n = countWord(word);
    if (n > 0) counts.set(word, n);
  }
  return { counts, doubts };
}
