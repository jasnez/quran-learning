import type { ArabicLetter, ArabicVowel } from "@/types/letters";
import { AYN_SIGN, HAMZA_SIGN } from "@/lib/quran/transliteration";

/**
 * Arapski harfovi u tri sistema iz Pravila transkripcije i transliteracije
 * orijentalnoislamske i srodne leksike u bosanskome jeziku (Rijaset IZ u BiH, 2022,
 * str. 53-55). Kolona `special` je sistem koji aplikacija koristi za ajete i dove.
 *
 * Nazivi harfova i opisi izgovora nisu dio Pravila; to su objašnjenja aplikacije.
 * Znakovi za hemze i 'ajn uzimaju se iz generatora da ostanu isti kao u transliteraciji.
 */
export const ARABIC_LETTERS: ArabicLetter[] = [
  { arabic: "ء", name: "Hemze", general: "'", special: HAMZA_SIGN, dmg: HAMZA_SIGN, pronunciation: "Nagli prekid glasa, kao kratka stanka usred riječi. Znak je apostrof." },
  { arabic: "ب", name: "Bā", general: "b", special: "b", dmg: "b", pronunciation: "Obično bosansko b." },
  { arabic: "ت", name: "Tā", general: "t", special: "t", dmg: "t", pronunciation: "Obično bosansko t." },
  { arabic: "ث", name: "S̱ā", general: "s", special: "s̱", dmg: "ṯ", pronunciation: "Međuzubno s: vrh jezika je između zuba." },
  { arabic: "ج", name: "Džīm", general: "dž", special: "dž", dmg: "ğ", pronunciation: "Obično bosansko dž." },
  { arabic: "ح", name: "Ḥā", general: "h", special: "ḥ", dmg: "ḥ", pronunciation: "Oštro, čisto grleno h, iz sredine grla." },
  { arabic: "خ", name: "Ḫā", general: "h", special: "ḫ", dmg: "ḫ", pronunciation: "Tvrdo, strugavo h, kao kad se čisti grlo." },
  { arabic: "د", name: "Dāl", general: "d", special: "d", dmg: "d", pronunciation: "Obično bosansko d." },
  { arabic: "ذ", name: "Ẕāl", general: "z", special: "ẕ", dmg: "ḏ", pronunciation: "Međuzubno z: vrh jezika je između zuba." },
  { arabic: "ر", name: "Rā", general: "r", special: "r", dmg: "r", pronunciation: "Bosansko r, nekad krupno, nekad tanko." },
  { arabic: "ز", name: "Zāj", general: "z", special: "z", dmg: "z", pronunciation: "Obično bosansko z." },
  { arabic: "س", name: "Sīn", general: "s", special: "s", dmg: "s", pronunciation: "Obično bosansko s." },
  { arabic: "ش", name: "Šīn", general: "š", special: "š", dmg: "š", pronunciation: "Obično bosansko š." },
  { arabic: "ص", name: "Ṣād", general: "s", special: "ṣ", dmg: "ṣ", pronunciation: "Krupno, duboko s, uz podignut zadnji dio jezika." },
  { arabic: "ض", name: "Ḍād", general: "d", special: "ḍ", dmg: "ḍ", pronunciation: "Krupno, duboko d, svojstveno arapskom jeziku." },
  { arabic: "ط", name: "Ṭā", general: "t", special: "ṭ", dmg: "ṭ", pronunciation: "Krupno, duboko t." },
  { arabic: "ظ", name: "Ẓā", general: "z", special: "ẓ", dmg: "ẓ", pronunciation: "Krupno, duboko međuzubno z." },
  { arabic: "ع", name: `${AYN_SIGN}Ajn`, general: "'", special: AYN_SIGN, dmg: AYN_SIGN, pronunciation: "Duboki grleni glas: steže se donji dio grla. Znak je obrnuti apostrof." },
  { arabic: "غ", name: "Gajn", general: "g", special: "g", dmg: "ġ", pronunciation: "Grleno g, kao francusko r ili grgljanje." },
  { arabic: "ف", name: "Fā", general: "f", special: "f", dmg: "f", pronunciation: "Obično bosansko f." },
  { arabic: "ق", name: "Qāf", general: "k", special: "q", dmg: "q", pronunciation: "Krupno, duboko k, iz resice." },
  { arabic: "ك", name: "Kāf", general: "k", special: "k", dmg: "k", pronunciation: "Obično bosansko k." },
  { arabic: "ل", name: "Lām", general: "l", special: "l", dmg: "l", pronunciation: "Obično bosansko l; krupno samo u imenu Allāh." },
  { arabic: "م", name: "Mīm", general: "m", special: "m", dmg: "m", pronunciation: "Obično bosansko m." },
  { arabic: "ن", name: "Nūn", general: "n", special: "n", dmg: "n", pronunciation: "Obično bosansko n." },
  { arabic: "ه", name: "Hā", general: "h", special: "h", dmg: "h", pronunciation: "Lahko, prsno h, kao bosansko h u riječi hava." },
  { arabic: "و", name: "Wāw", general: "v", special: "w", dmg: "w", pronunciation: "Dvousneno v, kao englesko w. Kao vokal: dugo u." },
  { arabic: "ي", name: "Jā", general: "j", special: "j", dmg: "y", pronunciation: "Obično bosansko j. Kao vokal: dugo i." },
];

/** Kratki i dugi vokali, prikazani na harfu ba. */
export const ARABIC_VOWELS: ArabicVowel[] = [
  { arabic: "بَ", name: "Fetha", general: "e / a", special: "e / a", dmg: "a" },
  { arabic: "بُ", name: "Damma", general: "u", special: "u", dmg: "u" },
  { arabic: "بِ", name: "Kesra", general: "i", special: "i", dmg: "i" },
  { arabic: "بَا", name: "Dugo a", general: "a / ā", special: "ā", dmg: "ā" },
  { arabic: "بُو", name: "Dugo u", general: "u / ū", special: "ū", dmg: "ū" },
  { arabic: "بِي", name: "Dugo i", general: "i / ī", special: "ī", dmg: "ī" },
];

/** Izvor tabele. */
export const LETTER_RULES_SOURCE = {
  title: "Pravila transkripcije i transliteracije orijentalnoislamske i srodne leksike u bosanskome jeziku",
  publisher: "Rijaset Islamske zajednice u Bosni i Hercegovini, 2022.",
  url: "https://ilmijja.ba/wp-content/uploads/2022/03/Pravila.pdf",
};
