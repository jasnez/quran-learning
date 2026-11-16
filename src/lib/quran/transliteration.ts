/**
 * Rule-based transcription of the Uthmani (Hafs) text into the "specijal" system of the
 * Islamic Community in Bosnia and Herzegovina: Rijaset, "Pravila transkripcije i
 * transliteracije orijentalnoislamske i srodne leksike u bosanskome jeziku" (2022), which
 * recommends this system for Quran ayahs, surahs and duas.
 *
 * Input is the Quran.com `text_uthmani` spelling stored in `src/data/ayahs/*.json`.
 * The rules below reproduce the way the official text of the last 26 surahs and El-Fatiha
 * (pages 55-63 of the Pravila) is written:
 * - letters: dž, ḥ, ḫ, s̱ (tha), ẕ (dhal), ṣ ḍ ṭ ẓ, g (ghayn), q, w, j (ya), ʻ (ayn), ʼ (hamza);
 * - fatha is written a next to the heavy letters and e elsewhere; long vowels are ā ī ū;
 * - a word that starts with hamzat al-wasl is joined to the word before it, and the article
 *   keeps its hyphen: "rabbil-ʻālemīn", "jewmid-dīn", "Rabbenagfir";
 * - the particles we, fe, bi, li, le, ke, the question e and the vocative jā are separate words
 *   ("we lem", "bi rabbin-nās"); which words start with such a particle is not visible from the
 *   spelling, so the caller supplies it (see `particles`);
 * - idgham and iqlab are not written ("jekun lehū", "min baʻdi");
 * - the last word of an ayah, and the word before a mandatory stop, is in its pause form
 *   ("nesteʻīn", "el-qāriʻah", "tewwābā"); other pause signs only block the joining.
 *
 * Arabic characters are built from code points on purpose: combining marks typed directly
 * into the source are invisible and easy to corrupt.
 */

const ch = (codePoint: number): string => String.fromCodePoint(codePoint);

// Vowel signs and other marks that attach to the preceding letter.
const FATHATAN = ch(0x064b);
const DAMMATAN = ch(0x064c);
const KASRATAN = ch(0x064d);
const FATHA = ch(0x064e);
const DAMMA = ch(0x064f);
const KASRA = ch(0x0650);
const SHADDA = ch(0x0651);
const SUKUN = ch(0x0652);
const MADDA = ch(0x0653);
const HAMZA_ABOVE = ch(0x0654);
const DAGGER_ALIF = ch(0x0670);
/** Small sin above sad: the sad is read as sin (2:245, 7:69). As a token of its own it is a sakta. */
const SMALL_HIGH_SEEN = ch(0x06dc);
/** Small round zero: the letter is never pronounced. */
const SILENT_ZERO = ch(0x06df);
/** Small upright zero: the alif is pronounced only when pausing on the word. */
const PAUSE_ONLY_ZERO = ch(0x06e0);
const IMALA_SIGN = ch(0x06ea);
const TASHIL_SIGN = ch(0x06ec);

// Letters with special handling.
const HAMZA = ch(0x0621);
const ALIF = ch(0x0627);
const ALIF_WASLA = ch(0x0671);
const LAM = ch(0x0644);
const MEEM = ch(0x0645);
const HA = ch(0x0647);
const WAW = ch(0x0648);
const ALIF_MAQSURA = ch(0x0649);
const YA = ch(0x064a);
const TA_MARBUTA = ch(0x0629);
const TATWEEL = ch(0x0640);
const SMALL_WAW = ch(0x06e5);
const SMALL_YA = ch(0x06e6);
const SMALL_HIGH_YA = ch(0x06e7);
const SMALL_HIGH_NOON = ch(0x06e8);

// Signs that are tokens of their own.
const MANDATORY_STOP = ch(0x06d8);
const NO_STOP = ch(0x06d9);
const RUB_EL_HIZB = ch(0x06de);
const SAJDAH = ch(0x06e9);

/** Sign for ayn: MODIFIER LETTER TURNED COMMA. Looks like the opening quote of the Pravila, but is a letter. */
export const AYN_SIGN = ch(0x02bb);
/** Sign for hamza: MODIFIER LETTER APOSTROPHE. Looks like an apostrophe, but is a letter. */
export const HAMZA_SIGN = ch(0x02bc);
/** COMBINING MACRON BELOW, for the s of tha; the z of dhal has a ready-made character. */
const LINE_BELOW = ch(0x0331);

type Consonant =
  | "hamza" | "b" | "t" | "th" | "j" | "hh" | "kh" | "d" | "dh" | "r" | "z" | "s" | "sh"
  | "ss" | "dd" | "tt" | "zz" | "ayn" | "gh" | "f" | "q" | "k" | "l" | "m" | "n" | "h" | "w" | "y";

type VowelQuality = "a" | "i" | "u" | "e";

type ConsonantPhone = {
  t: "c";
  k: Consonant;
  /** No sign on the letter in the mushaf: it is assimilated or hidden, depending on what follows. */
  bare?: boolean;
  /** First half of a doubled letter. */
  gem?: boolean;
  /** Hamza at the start of a word (also after the article): not written. */
  mute?: boolean;
  /** First lam of the name Allah ("name") or of Allahumma ("humma"). */
  allah?: "name" | "humma";
};

/** `e`: a short fatha that is written e. Decided once the neighbouring words are known. */
type VowelPhone = { t: "v"; q: VowelQuality; long: boolean; e?: boolean };

type Phone =
  | ConsonantPhone
  | VowelPhone
  /** The n of a tanwin. */
  | { t: "n" }
  /** Position of a hamzat al-wasl; pronounced only at the start of an utterance. */
  | { t: "wasl"; vowel: "a" | "i" | "u"; e?: boolean }
  /** Hyphen after the article. `whenJoined`: only written when the word is joined to the one before. */
  | { t: "-"; whenJoined?: boolean };

/** A written word of the transcription: an Arabic word, or a particle split off from one. */
type Unit = {
  phones: Phone[];
  /** Disjoined letters (al-muqattaat), read by their names; no joining rules apply. */
  letters?: string[];
  taMarbuta: boolean;
  /** Final alif that is read only when pausing, e.g. in "ene". */
  pauseAlif: boolean;
  /** The word ends in the lengthened vowel of the pronoun -hu / -hi. */
  sila: boolean;
  /** The word is the name Allah and starts with it. */
  nameOfAllah: boolean;
};

export type TransliterationOptions = {
  /**
   * How many leading particles of this Arabic word are written as separate words
   * (we, fe, bi, li, le, ke, the question e, the vocative jā). Default: none.
   */
  particles?: (word: string) => number;
};

export type TransliteratedAyah = {
  text: string;
  /** One entry per Arabic word, in order (pause signs are not words). An entry holds a space when a particle is split off. */
  words: string[];
  /** Spellings the rules do not cover. Must stay empty for the stored data. */
  warnings: string[];
};

const CONSONANT_LETTERS = new Map<number, Consonant>([
  [0x0628, "b"], [0x062a, "t"], [0x062b, "th"], [0x062c, "j"], [0x062d, "hh"], [0x062e, "kh"],
  [0x062f, "d"], [0x0630, "dh"], [0x0631, "r"], [0x0632, "z"], [0x0633, "s"], [0x0634, "sh"],
  [0x0635, "ss"], [0x0636, "dd"], [0x0637, "tt"], [0x0638, "zz"], [0x0639, "ayn"], [0x063a, "gh"],
  [0x0641, "f"], [0x0642, "q"], [0x0643, "k"], [0x0644, "l"], [0x0645, "m"], [0x0646, "n"],
  [0x0647, "h"], [0x0629, "t"],
]);

/** Hamza on its own and on its carriers (alif above, waw, alif below, ya). */
const HAMZA_LETTERS = new Set([0x0621, 0x0623, 0x0624, 0x0625, 0x0626]);

const CONSONANT_TEXT: Partial<Record<Consonant, string>> = {
  hamza: HAMZA_SIGN, th: `s${LINE_BELOW}`, j: "dž", hh: "ḥ", kh: "ḫ", dh: "ẕ", sh: "š",
  ss: "ṣ", dd: "ḍ", tt: "ṭ", zz: "ẓ", ayn: AYN_SIGN, gh: "g", y: "j",
};

function consonantText(k: Consonant): string {
  return CONSONANT_TEXT[k] ?? k;
}

/**
 * The sign the system writes for one Arabic letter as a consonant, e.g. "ḥ" for ha.
 * Lets the letter table on /harfovi be checked against what the transliteration really writes.
 */
export function consonantSign(letter: string): string | undefined {
  const code = letter.codePointAt(0) ?? 0;
  if (HAMZA_LETTERS.has(code)) return HAMZA_SIGN;
  if (code === 0x0648) return consonantText("w");
  if (code === 0x064a) return consonantText("y");
  const k = CONSONANT_LETTERS.get(code);
  return k ? consonantText(k) : undefined;
}

const LONG_VOWELS: Record<VowelQuality, string> = { a: "ā", i: "ī", u: "ū", e: "ē" };

/** Letters next to which a fatha keeps the sound a: the throat letters and the heavy letters. */
const HEAVY = new Set<Consonant>(["hh", "kh", "ayn", "gh", "q", "ss", "dd", "tt", "zz"]);

/**
 * After a word-initial hamza the same holds, except for ayn: the Pravila write "eʻbudu",
 * "eʻlā", "eʻṭā", but "naʻbudu", "taʻbudūn".
 */
const HEAVY_AFTER_INITIAL_HAMZA = new Set<Consonant>(["hh", "kh", "gh", "q", "ss", "dd", "tt", "zz"]);

/** Names of the disjoined letters as recited, e.g. Elif-Lām-Mīm. */
const LETTER_NAMES = new Map<number, string>([
  [0x0627, "elif"], [0x0644, "lām"], [0x0645, "mīm"], [0x0635, "ṣād"], [0x0631, "rā"],
  [0x0643, "kāf"], [0x0647, "hā"], [0x064a, "jā"], [0x0639, `${AYN_SIGN}ajn`], [0x0637, "ṭā"],
  [0x0633, "sīn"], [0x062d, "ḥā"], [0x0642, "qāf"], [0x0646, "nūn"],
]);

/**
 * Hamzat al-wasl + lam + sukun that is not the article: the imperative "(we)lʻanhum" in 33:68.
 * Stored as the consonants after the lam; the same shape with other letters is the article.
 */
const NOT_ARTICLE_AFTER_LAM: Consonant[] = ["ayn", "n", "h", "m"];

/**
 * First two consonants of the nouns whose hamzat al-wasl is always read with kasra
 * (ism, ibn / ibnat, imru' / imra'at, ithnan / ithnatan).
 */
const WASL_KASRA_NOUNS: [Consonant, Consonant][] = [["s", "m"], ["b", "n"], ["m", "r"], ["th", "n"]];

/**
 * First two consonants of the verbs with a final ya whose plural imperative takes a damma
 * that is not original (imshū, iqḍū, ibnū, i'tū, imḍū, ihdū): kasra, not damma.
 */
const WASL_KASRA_VERBS: [Consonant, Consonant][] = [
  ["m", "sh"], ["q", "dd"], ["b", "n"], ["hamza", "t"], ["m", "dd"], ["h", "d"],
];

function codeOf(text: string): number {
  return text.codePointAt(0) ?? 0;
}

function isMark(char: string): boolean {
  const cp = codeOf(char);
  return (
    (cp >= 0x064b && cp <= 0x0655) || cp === 0x0670 || cp === 0x06dc || cp === 0x06df ||
    cp === 0x06e0 || cp === 0x06e2 || cp === 0x06e3 || (cp >= 0x06ea && cp <= 0x06ed)
  );
}

/** Pause signs, rub el hizb and sajdah: tokens that are not words. */
export function isQuranicSignToken(token: string): boolean {
  if (token.length === 0) return false;
  for (const char of token) {
    const cp = codeOf(char);
    if (!((cp >= 0x06d6 && cp <= 0x06dc) || cp === 0x06de || cp === 0x06e9)) return false;
  }
  return true;
}

/** A letter of the Arabic word with the marks written on it. */
type Glyph = { base: string; marks: string };

function splitGlyphs(word: string): Glyph[] {
  const glyphs: Glyph[] = [];
  for (const char of word) {
    if (isMark(char) && glyphs.length > 0) glyphs[glyphs.length - 1].marks += char;
    else glyphs.push({ base: char, marks: "" });
  }
  return glyphs;
}

type Marks = {
  vowel: VowelQuality | null;
  tanwin: VowelQuality | null;
  shadda: boolean;
  sukun: boolean;
  dagger: boolean;
  hamza: boolean;
  silent: boolean;
  pauseOnly: boolean;
  seen: boolean;
  imala: boolean;
  tashil: boolean;
};

function readMarks(marks: string): Marks {
  return {
    vowel: marks.includes(FATHA) ? "a" : marks.includes(DAMMA) ? "u" : marks.includes(KASRA) ? "i" : null,
    tanwin: marks.includes(FATHATAN) ? "a" : marks.includes(DAMMATAN) ? "u" : marks.includes(KASRATAN) ? "i" : null,
    shadda: marks.includes(SHADDA),
    sukun: marks.includes(SUKUN),
    dagger: marks.includes(DAGGER_ALIF),
    hamza: marks.includes(HAMZA_ABOVE),
    silent: marks.includes(SILENT_ZERO),
    pauseOnly: marks.includes(PAUSE_ONLY_ZERO),
    seen: marks.includes(SMALL_HIGH_SEEN),
    imala: marks.includes(IMALA_SIGN),
    tashil: marks.includes(TASHIL_SIGN),
  };
}

function isConsonant(p: Phone | undefined): p is ConsonantPhone {
  return p !== undefined && p.t === "c";
}

function isVowel(p: Phone | undefined): p is VowelPhone {
  return p !== undefined && p.t === "v";
}

/** Disjoined letters carry no vowel signs: only letters that have a recited name, and madda. */
function isDisjoinedLetters(glyphs: Glyph[]): boolean {
  return glyphs.every((g) => LETTER_NAMES.has(codeOf(g.base)) && (g.marks === "" || g.marks === MADDA));
}

/**
 * The name Allah, with or without prefixes (billāhi, lillāhi, āllāhu) and Allāhumme:
 * lam, lam with shadda and fatha, ha with a vowel at the end of the word.
 * "el-lehwi" and "el-lehebi" have the same start but do not end there.
 */
function nameOfAllah(glyphs: Glyph[]): "name" | "humma" | null {
  let end = glyphs.length - 1;
  let kind: "name" | "humma" = "name";
  const lastMarks = readMarks(glyphs[end]?.marks ?? "");
  if (glyphs[end]?.base === MEEM && lastMarks.shadda && lastMarks.vowel === "a") {
    end -= 1;
    kind = "humma";
  }
  const [first, second, ha] = [glyphs[end - 2], glyphs[end - 1], glyphs[end]];
  if (!first || first.base !== LAM || second.base !== LAM || ha.base !== HA) return null;
  const secondMarks = readMarks(second.marks);
  if (!secondMarks.shadda || secondMarks.vowel !== "a" || secondMarks.dagger) return null;
  const haMarks = readMarks(ha.marks);
  if (haMarks.vowel === null || haMarks.shadda || haMarks.sukun) return null;
  const firstMarks = readMarks(first.marks);
  if (firstMarks.vowel === "i") return kind; // lillāhi
  const before = glyphs[end - 3];
  const isBare = firstMarks.vowel === null && !firstMarks.sukun && !firstMarks.shadda;
  const afterAlif = before !== undefined && (before.base === ALIF_WASLA || (before.base === ALIF && before.marks.includes(MADDA)));
  return isBare && afterAlif ? kind : null;
}

function parseWord(word: string, warnings: string[]): Unit {
  const glyphs = splitGlyphs(word);
  const unit: Unit = { phones: [], taMarbuta: false, pauseAlif: false, sila: false, nameOfAllah: false };

  if (isDisjoinedLetters(glyphs)) {
    unit.letters = glyphs.map((g) => g.base);
    return unit;
  }

  const phones = unit.phones;
  const warn = (what: string) => warnings.push(`${what}: ${word}`);
  const last = () => phones[phones.length - 1];

  /** Marks the previous vowel as long. Returns false when it is not one of `qualities`. */
  const lengthen = (...qualities: VowelQuality[]): boolean => {
    const p = last();
    if (isVowel(p) && qualities.includes(p.q)) {
      p.long = true;
      return true;
    }
    return false;
  };

  const emit = (k: Consonant, m: Marks) => {
    const bare = !m.vowel && !m.tanwin && !m.sukun && !m.shadda && !m.imala;
    if (m.shadda) phones.push({ t: "c", k, gem: true }, { t: "c", k });
    else phones.push(bare ? { t: "c", k, bare: true } : { t: "c", k });
    // A dagger alif that carries a hamza (2:72) does not lengthen the vowel.
    if (m.vowel) phones.push({ t: "v", q: m.vowel, long: m.dagger && !m.hamza });
    else if (m.imala) phones.push({ t: "v", q: "e", long: false });
    if (m.tanwin) phones.push({ t: "v", q: m.tanwin, long: false }, { t: "n" });
  };

  glyphs.forEach((glyph, index) => {
    const m = readMarks(glyph.marks);
    const isLast = index === glyphs.length - 1;
    const hasOwnSound = m.vowel !== null || m.tanwin !== null || m.sukun || m.shadda;

    switch (glyph.base) {
      case ALIF_WASLA:
        phones.push({ t: "wasl", vowel: "i" });
        return;

      case ALIF: {
        if (m.silent) return;
        if (m.pauseOnly) {
          if (isLast) unit.pauseAlif = true;
          return;
        }
        if (m.tashil) {
          // 41:44: the second hamza is softened; written as a second vowel after a hamza sign.
          phones.push({ t: "c", k: "hamza" }, { t: "v", q: "a", long: false });
          return;
        }
        if (last()?.t === "n") return; // alif after tanwin: read only when pausing
        if (!lengthen("a")) warn("alif without a preceding fatha");
        return;
      }

      case WAW: {
        if (m.silent) return;
        if (m.dagger && !hasOwnSound) {
          // eṣ-ṣalāte, el-ḥajāti: the waw only carries the long a.
          if (!lengthen("a")) warn("waw with dagger alif without a preceding fatha");
          return;
        }
        if (hasOwnSound) {
          emit("w", m);
          return;
        }
        if (lengthen("u")) return;
        phones.push({ t: "c", k: "w", bare: true });
        return;
      }

      case YA:
      case ALIF_MAQSURA: {
        if (m.silent) return;
        if (m.dagger && !hasOwnSound) {
          if (!lengthen("a", "e")) warn("ya with dagger alif without a preceding fatha");
          return;
        }
        if (hasOwnSound) {
          emit("y", m);
          return;
        }
        if (last()?.t === "n") return; // alif maqsura after tanwin, e.g. huden
        if (lengthen("i", "a")) return;
        phones.push({ t: "c", k: "y", bare: true });
        return;
      }

      case SMALL_WAW: {
        if (!lengthen("u")) warn("small waw without a preceding damma");
        else if (isLast && glyphs[index - 1]?.base === HA) unit.sila = true;
        return;
      }

      case SMALL_YA:
      case SMALL_HIGH_YA: {
        if (hasOwnSound) {
          emit("y", m);
          return;
        }
        if (!lengthen("i")) warn("small ya without a preceding kasra");
        else if (isLast && glyph.base === SMALL_YA && glyphs[index - 1]?.base === HA) unit.sila = true;
        return;
      }

      case SMALL_HIGH_NOON:
        phones.push({ t: "c", k: "n" });
        return;

      case TATWEEL: {
        if (m.hamza) emit("hamza", m);
        else if (m.dagger && !lengthen("a")) warn("dagger alif without a preceding fatha");
        return;
      }

      default: {
        const code = codeOf(glyph.base);
        if (HAMZA_LETTERS.has(code)) {
          emit("hamza", m);
          return;
        }
        let k = CONSONANT_LETTERS.get(code);
        if (!k) {
          warn(`unknown character U+${code.toString(16).toUpperCase().padStart(4, "0")}`);
          return;
        }
        if (k === "ss" && m.seen) k = "s";
        emit(k, m);
        // 2:72: a hamza with sukun written on the dagger alif above the letter.
        if (m.hamza) phones.push({ t: "c", k: "hamza" });
        if (glyph.base === TA_MARBUTA && isLast) unit.taMarbuta = true;
      }
    }
  });

  resolveArticle(glyphs, unit);
  // A doubled first letter only marks idgham with the previous word, which is not written.
  if (isConsonant(phones[0]) && phones[0].gem) phones.shift();
  muteLeadingHamza(phones);
  return unit;
}

/** A hamza at the start of a word is not written. */
function muteLeadingHamza(phones: Phone[]): void {
  const first = phones[0];
  if (isConsonant(first) && first.k === "hamza" && isVowel(phones[1])) first.mute = true;
}

function startsWithPair(phones: Phone[], from: number, pairs: [Consonant, Consonant][]): boolean {
  const a = phones[from];
  const b = phones[from + 1];
  // A doubled first consonant (ittaqū) is not one of the listed stems.
  if (!isConsonant(a) || !isConsonant(b) || a.gem) return false;
  return pairs.some(([x, y]) => a.k === x && b.k === y);
}

/**
 * Places the hyphen after the article, writes the sun letters as pronounced, and decides
 * which vowel a leading hamzat al-wasl takes.
 */
function resolveArticle(glyphs: Glyph[], unit: Unit): void {
  const phones = unit.phones;
  const allah = nameOfAllah(glyphs);
  let leadIsArticle = false;

  /** `lamIndex`: the lam of an article. `waslIndex`: its hamzat al-wasl, or -1 when not written. */
  const articles: { lamIndex: number; waslIndex: number }[] = [];
  phones.forEach((p, i) => {
    const lam = phones[i + 1];
    if (p.t === "wasl" && isConsonant(lam) && lam.k === "l") articles.push({ lamIndex: i + 1, waslIndex: i });
  });

  const [g0, g1, g2] = glyphs;
  if (g0?.base === HAMZA && g0.marks === FATHA && g1?.base === ALIF && g1.marks.includes(MADDA) && g2?.base === LAM) {
    // 6:143, 10:51, 10:59: the question hamza replaces the alif of the article ("āl-āne").
    articles.push({ lamIndex: 2, waslIndex: -1 });
  }

  if (articles.length === 0) {
    // "lil-" and "lel-": the alif of the article is not written after li- / le-.
    let p = 0;
    const c0 = phones[0];
    const v0 = phones[1];
    if (isConsonant(c0) && (c0.k === "w" || c0.k === "f") && isVowel(v0) && v0.q === "a" && !v0.long) p = 2;
    // The first lam may itself be doubled by idgham with the previous word.
    const doubled = phones[p];
    if (isConsonant(doubled) && doubled.gem && doubled.k === "l") p += 1;
    const [l1, v1, l2, after] = [phones[p], phones[p + 1], phones[p + 2], phones[p + 3]];
    if (
      isConsonant(l1) && l1.k === "l" && isVowel(v1) && !v1.long && (v1.q === "i" || v1.q === "a") &&
      isConsonant(l2) && l2.k === "l" && isConsonant(after)
    ) {
      articles.push({ lamIndex: p + 2, waslIndex: -1 });
    } else if (isConsonant(c0) && c0.k === "l" && !c0.gem && !c0.bare && isConsonant(v0)) {
      if (v0.k === "hamza") {
        // 26:176, 38:13: "l-ejketi" is written without the alif of the article.
        articles.push({ lamIndex: 0, waslIndex: -1 });
      } else if (v0.k === "y" || v0.k === "t" || v0.k === "n") {
        // 22:15, 22:29: the lam of command after "s̱umme", joined like the article.
        phones.splice(1, 0, { t: "-" });
      }
    } else if (
      isConsonant(c0) && (c0.k === "w" || c0.k === "f") && p === 2 && isConsonant(l1) && l1.k === "l" && !l1.gem &&
      !l1.bare && isConsonant(v1) && (v1.k === "y" || v1.k === "t" || v1.k === "n")
    ) {
      // The lam of command after we- / fe-: "Fel-jaʻbudū", "wel-jektub".
      phones.splice(p + 1, 0, { t: "-" });
    }
  }

  // Work from the end so that earlier indices stay valid while splicing.
  for (const { lamIndex, waslIndex } of articles.reverse()) {
    const lam = phones[lamIndex];
    const after = phones[lamIndex + 1];
    const wasl = waslIndex >= 0 ? phones[waslIndex] : undefined;
    if (!isConsonant(lam)) continue;
    const markArticle = () => {
      if (wasl?.t === "wasl") wasl.vowel = "a";
      if (waslIndex === 0) leadIsArticle = true;
    };

    if (allah) {
      // Written without a hyphen: the two lams belong to the name.
      if (lam.bare) phones.splice(lamIndex, 1);
      markArticle();
      if (waslIndex === 0) unit.nameOfAllah = true;
    } else if (lam.bare && isConsonant(after) && after.gem) {
      // Sun letter: the lam is assimilated, the hyphen goes inside the doubled letter.
      phones.splice(lamIndex, 1);
      phones.splice(lamIndex + 1, 0, { t: "-" });
      markArticle();
    } else if (lam.gem) {
      // elleẕī, elletī, el-lejl: one lam with shadda in the Uthmani spelling. The hyphen is
      // written when something precedes it: "Ṣirāṭal-leẕīne", "Wel-leẕīne", but "Elleẕīne".
      markArticle();
      const [a, y, l] = [phones[lamIndex + 2], phones[lamIndex + 3], phones[lamIndex + 4]];
      const isLayl = isVowel(a) && a.q === "a" && !a.long && isConsonant(y) && y.k === "y" && isConsonant(l) && l.k === "l";
      phones.splice(lamIndex + 1, 0, isLayl || waslIndex !== 0 ? { t: "-" } : { t: "-", whenJoined: true });
    } else if (!lam.bare && isConsonant(after)) {
      // Moon letter. Lam + sukun before ta is never the article (iltaqā, 3:155), nor is 33:68.
      const stem = phones.slice(lamIndex + 1).filter(isConsonant).map((c) => c.k);
      const isImperative =
        stem.length === NOT_ARTICLE_AFTER_LAM.length && NOT_ARTICLE_AFTER_LAM.every((k, i) => stem[i] === k);
      if (after.k === "t" || isImperative) continue;
      if (after.k === "hamza") after.mute = true;
      phones.splice(lamIndex + 1, 0, { t: "-" });
      markArticle();
    } else if (wasl?.t === "wasl" && isVowel(after)) {
      // 49:11 "el-ismu": the lam of the article takes a helping kasra before another hamzat al-wasl.
      phones.splice(lamIndex + 1, 0, { t: "-" });
      markArticle();
    }
  }

  // Idgham inside a word is not written: the unmarked letter stays and the next one is single
  // ("ʻabedtum" for a dal without a sign before a doubled ta).
  for (let i = phones.length - 2; i >= 0; i--) {
    const p = phones[i];
    const next = phones[i + 1];
    if (isConsonant(p) && p.bare && isConsonant(next) && next.gem && !next.allah) phones.splice(i + 1, 1);
  }

  if (allah) {
    // The long a of the name is not written in the mushaf.
    for (let i = 0; i + 3 < phones.length; i++) {
      const [l1, l2, a, h] = [phones[i], phones[i + 1], phones[i + 2], phones[i + 3]];
      if (isConsonant(l1) && l1.k === "l" && l1.gem && isConsonant(l2) && isVowel(a) && isConsonant(h) && h.k === "h") {
        a.long = true;
        l1.allah = allah;
      }
    }
  }

  const lead = phones[0];
  if (lead?.t === "wasl" && !leadIsArticle) {
    // Verbs take damma when the third letter has an original damma, otherwise kasra. The vowel
    // of the third letter is the fourth phone, also when the second letter is doubled (itteqū).
    const vowel = phones[3];
    const hasDamma = isVowel(vowel) && vowel.q === "u";
    const kasraNoun = startsWithPair(phones, 1, WASL_KASRA_NOUNS);
    const kasraVerb = isVowel(vowel) && vowel.long && startsWithPair(phones, 1, WASL_KASRA_VERBS);
    lead.vowel = hasDamma && !kasraNoun && !kasraVerb ? "u" : "i";
  }
}

/**
 * Splits `count` leading particles off a word. A particle that stands before hamzat al-wasl
 * or before the lam of command stays attached ("Wel-fedžr", "Fel-jaʻbudū").
 */
function splitParticles(unit: Unit, count: number): Unit[] {
  if (unit.letters || count <= 0) return [unit];
  const units: Unit[] = [];
  let rest = unit.phones;
  for (let i = 0; i < count; i++) {
    const [c, v, next, afterNext] = rest;
    if (!isConsonant(c) || c.gem || !isVowel(v) || next === undefined) break;
    if (next.t === "wasl" || afterNext?.t === "-") break;
    units.push({ phones: [c, v], taMarbuta: false, pauseAlif: false, sila: false, nameOfAllah: false });
    rest = rest.slice(2);
    muteLeadingHamza(rest);
  }
  units.push({ ...unit, phones: rest });
  return units;
}

type Boundary = "flow" | "neutral" | "pause";

/** Rewrites the end of a word the way it is read when the reciter stops on it. */
function applyPauseForm(unit: Unit): void {
  const phones = unit.phones;
  if (unit.letters || phones.length === 0) return;
  const end = phones[phones.length - 1];

  if (unit.pauseAlif && isVowel(end)) {
    end.long = true;
    return;
  }

  const taToHa = () => {
    const t = phones[phones.length - 1];
    if (isConsonant(t)) t.k = "h";
  };

  if (end.t === "n") {
    const vowel = phones[phones.length - 2];
    if (unit.taMarbuta) {
      phones.splice(phones.length - 2, 2);
      taToHa();
    } else if (isVowel(vowel) && vowel.q === "a") {
      phones.pop();
      vowel.long = true;
    } else {
      phones.splice(phones.length - 2, 2);
    }
    return;
  }

  if (!isVowel(end)) return;

  if (unit.taMarbuta) {
    phones.pop();
    taToHa();
    return;
  }
  if (end.long) {
    if (unit.sila) phones.pop();
    return;
  }
  phones.pop();
  // nesije -> nesī: a single w / j after its own short vowel becomes a long vowel.
  const glide = phones[phones.length - 1];
  const before = phones[phones.length - 2];
  if (isConsonant(glide) && isVowel(before) && !before.long) {
    if ((glide.k === "w" && before.q === "u") || (glide.k === "y" && before.q === "i")) {
      phones.pop();
      before.long = true;
    }
  }
}

/**
 * Decides for every short fatha of a group of joined words whether it is written a or e.
 * `phones` are the pronounced sounds in order, before the pause form is applied: the rule
 * looks at the letter that carries the fatha and at the letter that closes its syllable.
 */
function decideFatha(sounds: (ConsonantPhone | VowelPhone | { t: "n" })[]): void {
  sounds.forEach((vowel, i) => {
    if (!isVowel(vowel) || vowel.q !== "a" || vowel.long) return;
    const carrier = sounds[i - 1];
    const next = sounds[i + 1];
    const afterNext = sounds[i + 2];
    vowel.e = !keepsA(isConsonant(carrier) ? carrier : undefined, next, afterNext);
  });
}

function keepsA(carrier: ConsonantPhone | undefined, next: Phone | undefined, afterNext: Phone | undefined): boolean {
  if (carrier && HEAVY.has(carrier.k)) return true;
  if (!isConsonant(next)) return false; // open syllable, or the n of a tanwin
  const initialHamza = carrier === undefined || carrier.mute === true;
  // Before the heavy lam of the name: "huwallāhu", "minallāhi"; but "Subḥānekellāhumme".
  if (next.allah) return initialHamza || next.allah === "name";
  if (carrier?.k === "r" && next.k === "b" && next.gem) return true; // rabb-
  if (carrier?.k === "r" && next.k === "hh") return true; // raḥmān, raḥīm
  if (next.gem) return false; // "teleẓẓā", "neʻʻamehū", "Weḍ-ḍuḥā"
  const closesSyllable = afterNext === undefined || isConsonant(afterNext);
  if (!closesSyllable) return false;
  return (initialHamza ? HEAVY_AFTER_INITIAL_HAMZA : HEAVY).has(next.k);
}

function capitalize(text: string): string {
  // The signs for ayn and hamza are not capitalized; the first real letter is.
  const chars = Array.from(text);
  const i = chars.findIndex((c) => c !== AYN_SIGN && c !== HAMZA_SIGN);
  if (i < 0) return text;
  chars[i] = chars[i].toLocaleUpperCase("bs");
  return chars.join("");
}

/** `initial`: the word starts an utterance. `joined`: it is written together with the word before. */
function renderUnit(unit: Unit, initial: boolean, joined: boolean): string {
  if (unit.letters) {
    return unit.letters.map((letter) => capitalize(LETTER_NAMES.get(codeOf(letter)) ?? "")).join("-");
  }

  const phones = unit.phones;
  // "i'ti" at the start of an utterance is read "īti": the hamza becomes a long vowel.
  const waslBeforeHamza =
    initial && phones[0]?.t === "wasl" && isConsonant(phones[1]) && phones[1].k === "hamza" && isConsonant(phones[2]);

  let out = "";
  phones.forEach((p, i) => {
    switch (p.t) {
      case "wasl":
        if (i !== 0 || !initial) return;
        if (waslBeforeHamza) out += LONG_VOWELS[p.vowel];
        else out += p.vowel === "a" && p.e ? "e" : p.vowel;
        return;
      case "-":
        if (!p.whenJoined || joined) out += "-";
        return;
      case "c":
        if (p.mute || (i === 1 && waslBeforeHamza)) return;
        out += consonantText(p.k);
        return;
      case "v":
        if (p.long) out += LONG_VOWELS[p.q];
        else out += p.q === "a" && p.e ? "e" : p.q;
        return;
      case "n":
        out += "n";
    }
  });
  return unit.nameOfAllah && initial ? capitalize(out) : out;
}

/**
 * The letters of a single word as spelled, outside of any context: no pause form, no joining,
 * no particles, and every fatha written a. Used to compare the rules with word-by-word sources.
 */
export function transliterateWord(word: string): string {
  return renderUnit(parseWord(word, []), false, false);
}

type Item = {
  unit: Unit;
  /** Index of the Arabic word this unit comes from. */
  word: number;
  /** What follows the unit. */
  boundary: Boundary;
  /** Written together with the unit before it. */
  joined: boolean;
};

/**
 * Transliterates one ayah. `arabicText` is the stored Uthmani text, including pause signs.
 */
export function transliterateAyah(arabicText: string, options: TransliterationOptions = {}): TransliteratedAyah {
  const warnings: string[] = [];
  const items: Item[] = [];
  let wordCount = 0;

  for (const token of arabicText.split(/\s+/).filter(Boolean)) {
    if (!isQuranicSignToken(token)) {
      const units = splitParticles(parseWord(token, warnings), options.particles?.(token) ?? 0);
      for (const unit of units) items.push({ unit, word: wordCount, boundary: "flow", joined: false });
      wordCount++;
      continue;
    }
    const lastItem = items[items.length - 1];
    if (!lastItem || lastItem.boundary === "pause") continue;
    if (token.includes(MANDATORY_STOP)) lastItem.boundary = "pause";
    else if (token !== NO_STOP && token !== RUB_EL_HIZB && token !== SAJDAH) lastItem.boundary = "neutral";
  }
  if (items.length > 0) items[items.length - 1].boundary = "pause";

  const isInitial = (i: number) => i === 0 || items[i - 1].boundary !== "flow";

  // Joining: hamzat al-wasl is dropped, the word is written together with the one before it.
  items.forEach((item, i) => {
    const phones = item.unit.phones;
    const next = items[i + 1];
    if (item.boundary !== "flow" || !next || item.unit.letters || next.unit.letters) return;
    const [first, second] = next.unit.phones;
    const startsWithCluster = isConsonant(first) && second?.t === "-";
    if (first?.t !== "wasl" && !startsWithCluster) return;
    const end = phones[phones.length - 1];
    // A long vowel is shortened and a tanwin takes a helping kasra before hamzat al-wasl.
    if (isVowel(end)) end.long = false;
    else if (end?.t === "n") phones.push({ t: "v", q: "i", long: false });
    else if (first?.t === "wasl") warnings.push(`consonant without a vowel before hamzat al-wasl: ${arabicText}`);
    next.joined = true;
  });

  // a or e: decided per group of joined words, on the sounds as pronounced before any pause.
  let group: (ConsonantPhone | VowelPhone | { t: "n" })[] = [];
  const leadingWasl = new Map<VowelPhone, Extract<Phone, { t: "wasl" }>>();
  const closeGroup = () => {
    decideFatha(group);
    for (const [vowel, wasl] of leadingWasl) wasl.e = vowel.e;
    leadingWasl.clear();
    group = [];
  };
  items.forEach((item, i) => {
    if (!item.joined) closeGroup();
    item.unit.phones.forEach((p, index) => {
      if (p.t === "-") return;
      if (p.t === "wasl") {
        if (index !== 0 || item.joined || !isInitial(i)) return;
        const vowel: VowelPhone = { t: "v", q: p.vowel, long: false };
        leadingWasl.set(vowel, p);
        group.push(vowel);
        return;
      }
      group.push(p);
    });
  });
  closeGroup();

  for (const item of items) if (item.boundary === "pause") applyPauseForm(item.unit);

  const words: string[] = Array.from({ length: wordCount }, () => "");
  let text = "";
  items.forEach((item, i) => {
    const rendered = renderUnit(item.unit, isInitial(i), item.joined);
    const sameWord = i > 0 && items[i - 1].word === item.word;
    words[item.word] += (sameWord ? " " : "") + rendered;
    text += (i > 0 && !item.joined ? " " : "") + rendered;
  });

  return { text: capitalize(text), words, warnings };
}
