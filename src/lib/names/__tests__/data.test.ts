import { describe, it, expect } from "vitest";
import { ALLAH_NAMES } from "../data";

/** Sun letters assimilate the lam of al-: the lam carries no sukun and the sun letter takes a shadda. */
const SUN_LETTERS = "\u062A\u062B\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0644\u0646";
const LAM_WITH_SUKUN_BEFORE_SUN_LETTER = new RegExp(`^\u0671\u0644\u0652[${SUN_LETTERS}]`);
/** The article is alef wasla + lam; a plain alef right after the alef wasla is a typing error. */
const DOUBLED_ALEF_ARTICLE = /^\u0671\u0627/;

describe("ALLAH_NAMES", () => {
  it("lists the 99 names in order", () => {
    expect(ALLAH_NAMES.map((n) => n.index)).toEqual(Array.from({ length: 99 }, (_, i) => i + 1));
  });

  it("gives every name its own transliteration", () => {
    const seen = new Map<string, number>();
    const repeated = ALLAH_NAMES.filter((n) => {
      const first = seen.get(n.transliteration);
      seen.set(n.transliteration, n.index);
      return first !== undefined;
    }).map((n) => `${n.index} ${n.transliteration}`);
    expect(repeated).toEqual([]);
  });

  it("never writes a sukun on the lam of al- before a sun letter", () => {
    const offenders = ALLAH_NAMES.filter((n) => LAM_WITH_SUKUN_BEFORE_SUN_LETTER.test(n.arabic)).map(
      (n) => `${n.index} ${n.transliteration}`
    );
    expect(offenders).toEqual([]);
  });

  it("never doubles the alef of the article (alef wasla followed by a plain alef)", () => {
    const offenders = ALLAH_NAMES.filter((n) => DOUBLED_ALEF_ARTICLE.test(n.arabic)).map(
      (n) => `${n.index} ${n.transliteration}`
    );
    expect(offenders).toEqual([]);
  });

  it('gives every name its own translation, except pairs the source itself repeats', () => {
    // IZ BiH, Allahova lijepa imena (Takvim 2009): these pairs share a translation there as well.
    const SOURCE_REPEATS: Record<string, number[]> = {
      Zaštitnik: [7, 38, 55],
      Sveznajući: [19, 31],
      Veličanstveni: [10, 41],
      Veliki: [33, 36, 37],
      Milostivi: [2, 32],
      'Onaj koji uskraćuje': [20, 90],
      Upravitelj: [52, 77],
      Začetnik: [58, 95],
    };
    const byTranslation = new Map<string, number[]>();
    for (const n of ALLAH_NAMES) byTranslation.set(n.translationBosnian, [...(byTranslation.get(n.translationBosnian) ?? []), n.index]);
    const repeated = Object.fromEntries([...byTranslation].filter(([, idx]) => idx.length > 1));
    expect(repeated).toEqual(SOURCE_REPEATS);
  });
});
