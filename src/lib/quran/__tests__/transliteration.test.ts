import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AYN_SIGN, HAMZA_SIGN, isQuranicSignToken, transliterateAyah, transliterateWord } from "../transliteration";

/**
 * The Arabic input is read from the stored ayahs so that the tests exercise the exact
 * spelling the app displays (Quran.com text_uthmani, with its pause signs).
 *
 * Expected values written for whole surahs (El-Fatiha, El-Kewser, El-Ihlas, El-Feleq, En-Nas,
 * El-Qadr) are the official text of the IZ BiH "specijal" system: Rijaset, Pravila
 * transkripcije i transliteracije... (2022), pages 55-63.
 */
const AYAHS_DIR = path.join(process.cwd(), "src", "data", "ayahs");
const lexicon = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src", "data", "transliteration", "particles.json"), "utf8")
) as Record<string, number>;
const particles = (word: string) => lexicon[word] ?? 0;
const cache = new Map<number, { id: string; arabicText: string }[]>();

function arabic(id: string): string {
  const surah = Number(id.split(":")[0]);
  if (!cache.has(surah)) {
    const file = fs.readdirSync(AYAHS_DIR).find((f) => f.startsWith(String(surah).padStart(3, "0")));
    cache.set(surah, JSON.parse(fs.readFileSync(path.join(AYAHS_DIR, file!), "utf8")).ayahs);
  }
  return cache.get(surah)!.find((a) => a.id === id)!.arabicText;
}

const text = (id: string) => transliterateAyah(arabic(id), { particles }).text;
const surah = (number: number, count: number) => Array.from({ length: count }, (_, i) => text(`${number}:${i + 1}`));

describe("transliterateAyah: official texts", () => {
  it("El-Fatiha", () => {
    expect(surah(1, 7)).toEqual([
      "Bismillāhir-raḥmānir-raḥīm",
      "El-ḥamdu lillāhi rabbil-ʻālemīn",
      "Er-raḥmānir-raḥīm",
      "Māliki jewmid-dīn",
      "Ijjāke naʻbudu we ijjāke nesteʻīn",
      "Ihdineṣ-ṣirāṭal-musteqīm",
      "Ṣirāṭal-leẕīne enʻamte ʻalejhim gajril-magḍūbi ʻalejhim we leḍ-ḍāllīn",
    ]);
  });

  it("El-Qadr", () => {
    expect(surah(97, 5)).toEqual([
      "Innā enzelnāhu fī lejletil-qadr",
      "We mā edrāke mā lejletul-qadr",
      "Lejletul-qadri ḫajrun min elfi šehr",
      "Tenezzelul-melāʼiketu wer-rūḥu fīhā bi iẕni rabbihim min kulli emr",
      "Selāmun hije ḥattā maṭleʻil-fedžr",
    ]);
  });

  it("El-Kewser", () => {
    expect(surah(108, 3)).toEqual(["Innā eʻṭajnākel-kews̱er", "Fe ṣalli li rabbike wenḥar", "Inne šāniʼeke huwel-ebter"]);
  });

  it("El-Ihlas", () => {
    expect(surah(112, 4)).toEqual([
      "Qul huwallāhu eḥad",
      "Allāhuṣ-ṣamed",
      "Lem jelid we lem jūled",
      "We lem jekun lehū kufuwen eḥad",
    ]);
  });

  it("El-Feleq", () => {
    expect(surah(113, 5)).toEqual([
      "Qul eʻūẕu bi rabbil-feleq",
      "Min šerri mā ḫaleq",
      "We min šerri gāsiqin iẕā weqab",
      "We min šerrin-neffās̱āti fil-ʻuqad",
      "We min šerri ḥāsidin iẕā ḥased",
    ]);
  });

  it("En-Nas", () => {
    expect(surah(114, 6)).toEqual([
      "Qul eʻūẕu bi rabbin-nās",
      "Melikin-nās",
      "Ilāhin-nās",
      "Min šerril-weswāsil-ḫannās",
      "Elleẕī juweswisu fī ṣudūrin-nās",
      "Minel-džinneti wen-nās",
    ]);
  });
});

describe("transliterateAyah: rules", () => {
  it("uses letters, not quotation marks, for ayn and hamza", () => {
    expect(AYN_SIGN.codePointAt(0)).toBe(0x02bb);
    expect(HAMZA_SIGN.codePointAt(0)).toBe(0x02bc);
    expect(text("1:5")).toContain(`na${AYN_SIGN}budu`);
    expect(text("96:1")).toContain(`Iqre${HAMZA_SIGN}`);
  });

  it("returns one entry per Arabic word and no warnings", () => {
    const result = transliterateAyah(arabic("2:255"), { particles });
    const arabicWords = arabic("2:255").split(" ").filter((t) => t && !isQuranicSignToken(t));
    expect(result.words).toHaveLength(arabicWords.length);
    expect(result.words.every((w) => w.length > 0)).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  describe("a or e for fatha", () => {
    it("keeps a on the heavy letters and before one that closes the syllable", () => {
      expect(text("93:9")).toBe("Fe emmel-jetīme fe lā taqher");
      expect(text("94:1")).toBe("E lem nešraḥ leke ṣadrek");
      expect(text("105:2")).toBe("E lem jedžʻal kejdehum fī taḍlīl");
    });

    it("writes e before a doubled heavy letter and before one that starts the next syllable", () => {
      expect(text("92:14")).toBe("Fe enẕertukum nāren teleẓẓā");
      expect(text("113:3")).toContain("weqab");
      expect(text("93:1")).toBe("Weḍ-ḍuḥā");
    });

    it("treats a word-initial hamza before ayn differently from other letters", () => {
      expect(text("109:2")).toBe("Lā eʻbudu mā taʻbudūn");
      expect(text("95:4")).toContain("fī aḥseni taqwīm");
    });

    it("keeps a in rabb and before the name Allah", () => {
      expect(text("106:3")).toBe("Fel-jaʻbudū rabbe hāẕel-bejt");
      expect(text("98:2")).toBe("Resūlun minallāhi jetlū ṣuḥufen muṭahhereh");
    });

    it("decides before the pause form is applied", () => {
      // "feleq" from "feleqi": the q starts a syllable; "nešraḥ": the ḥ closes one.
      expect(text("113:1")).toMatch(/feleq$/);
      expect(text("89:8")).toBe("Elletī lem juḫlaq mis̱luhā fil-bilād");
    });
  });

  describe("joining and the article", () => {
    it("joins a word that starts with hamzat al-wasl to the word before it", () => {
      expect(text("2:201")).toBe(
        "We minhum men jeqūlu rabbenā ātinā fid-dunjā ḥaseneten we fil-āḫireti ḥaseneten we qinā ʻaẕāben-nār"
      );
      expect(text("89:15")).toContain("iẕā mebtelāhu rabbuhū");
      expect(text("110:3")).toContain("westagfirhu");
    });

    it("writes the hyphen of elleẕī only when something precedes it", () => {
      expect(text("107:5")).toBe("Elleẕīne hum ʻan ṣalātihim sāhūn");
      expect(text("107:1")).toBe("E reʼejtel-leẕī jukeẕẕibu bid-dīn");
      expect(text("90:19")).toMatch(/^Wel-leẕīne /);
    });

    it("writes the name Allah without a hyphen and with a capital only at the start", () => {
      expect(text("110:1")).toBe("Iẕā džāʼe naṣrullāhi wel-fetḥ");
      expect(text("2:255")).toMatch(/^Allāhu lā ilāhe illā huwel-ḥajjul-qajjūmu /);
      expect(text("3:26")).toMatch(/^Qulillāhumme /);
    });

    it("reads a leading hamzat al-wasl with e, i or u at the start of an ayah", () => {
      expect(text("55:1")).toBe("Er-raḥmān");
      expect(text("96:3")).toBe("Iqreʼ we rabbukel-ekrem");
      expect(text("12:9")).toMatch(/^Uqtulū /);
    });

    it("does not treat lam + sukun of a verb as the article", () => {
      expect(text("33:68")).toContain("welʻanhum");
      expect(text("54:12")).toContain("felteqal-māʼu");
    });

    it("writes the lam of command like the article", () => {
      expect(text("96:17")).toBe("Fel-jedʻu nādijeh");
    });

    it("gives a tanwin a helping kasra before hamzat al-wasl", () => {
      expect(text("53:50")).toBe("We ennehū ehleke ʻādenil-ūlā");
    });

    it("does not join across a pause sign and keeps the full form before it", () => {
      expect(text("3:8")).toContain("raḥmeten inneke entel-wehhāb");
      expect(text("98:5")).toContain("we juʼtuz-zekāte we ẕālike dīnul-qajjimeh");
      expect(text("24:35")).toContain("miṣbāḥun el-miṣbāḥu fī zudžādžetin ez-zudžādžetu");
    });
  });

  describe("particles", () => {
    it("writes we, fe, bi, li, le, ke and the question e as separate words", () => {
      expect(text("89:5")).toBe("Hel fī ẕālike qasemun li ẕī ḥidžr");
      expect(text("89:14")).toBe("Inne rabbeke le bil-mirṣād");
      expect(text("105:5")).toBe("Fe džeʻalehum ke ʻaṣfin meʼkūl");
      expect(text("105:1")).toBe("E lem tere kejfe feʻale rabbuke bi aṣḥābil-fīl");
    });

    it("keeps a particle attached to the article and to hamzat al-wasl", () => {
      expect(text("89:1")).toBe("Wel-fedžr");
      expect(text("111:4")).toBe("Wemreʼetuhū ḥammāletel-ḥaṭab");
    });

    it("does not split a letter of the root", () => {
      expect(text("93:7")).toBe("We wedžedeke ḍāllen fe hedā");
      expect(text("90:13")).toBe("Fekku reqabeh");
      expect(text("90:9")).toBe("We lisānen we šefetejn");
    });

    it("keeps pronouns and fixed compounds together", () => {
      expect(text("109:6")).toBe("Lekum dīnukum we lije dīn");
      expect(text("90:4")).toMatch(/^Leqad /);
      expect(text("92:7")).toBe("Fe senujessiruhū lil-jusrā");
    });

    it("separates the vocative", () => {
      expect(text("109:1")).toBe("Qul jā ejjuhel-kāfirūn");
    });

    it("leaves every word whole when no particles are supplied", () => {
      expect(transliterateAyah(arabic("112:3")).text).toBe("Lem jelid welem jūled");
    });
  });

  describe("pause form at the end of an ayah", () => {
    it("drops the final short vowel and the tanwin of -un / -in", () => {
      expect(text("1:5")).toMatch(/nesteʻīn$/);
      expect(text("89:2")).toBe("We lejālin ʻašr");
    });

    it("reads the tanwin of -an as a long a", () => {
      expect(text("110:2")).toMatch(/efwādžā$/);
      expect(text("100:1")).toBe("Wel-ʻādijāti ḍabḥā");
    });

    it("reads ta marbuta as h", () => {
      expect(text("101:1")).toBe("El-qāriʻah");
      expect(text("90:11")).toBe("Fe laqteḥamel-ʻaqabeh");
    });

    it("drops the lengthened vowel of the pronoun", () => {
      expect(text("99:7")).toBe("Fe men jaʻmel mis̱qāle ẕerretin ḫajren jereh");
      expect(text("101:6")).toBe("Fe emmā men s̱equlet mewāzīnuh");
    });

    it("keeps a doubled final consonant and reads the pause-only alif", () => {
      expect(text("111:1")).toBe("Tebbet jedā ebī lehebin we tebb");
      expect(text("33:10")).toMatch(/ẓ-ẓunūnā$/);
    });

    it("reads the word before a mandatory stop in its pause form", () => {
      expect(text("2:26")).toContain("bi hāẕā mes̱elā juḍillu");
    });
  });

  describe("idgham and iqlab are not written", () => {
    it("between words", () => {
      expect(text("112:4")).toContain("jekun lehū");
      expect(text("98:4")).toContain("min baʻdi mā džāʼethumul-bejjineh");
      expect(text("90:5")).toBe("E jaḥsebu en len jaqdire ʻalejhi eḥad");
    });

    it("inside a word", () => {
      expect(text("109:4")).toBe("We lā ene ʻābidun mā ʻabedtum");
    });
  });

  describe("disjoined letters", () => {
    it("writes the names of the letters as one word", () => {
      expect(text("2:1")).toBe("Elif-Lām-Mīm");
      expect(text("19:1")).toBe("Kāf-Hā-Jā-ʻAjn-Ṣād");
      expect(text("36:1")).toBe("Jā-Sīn");
      expect(text("38:1")).toBe("Ṣād wel-qurʼāni ẕiẕ-ẕikr");
    });
  });

  describe("special readings of Hafs", () => {
    it("11:41 imala", () => expect(text("11:41")).toContain("medžrēhā"));
    it("2:245 sad read as sin", () => expect(text("2:245")).toContain("we jebsuṭu"));
    it("18:38 alif of lakinna read only when pausing", () => expect(text("18:38")).toMatch(/^Lākinne huwallāhu rabbī/));
    it("2:72 hamza on a dagger alif", () => expect(text("2:72")).toContain("feddāreʼtum"));
    it("49:11 article with a helping kasra", () => expect(text("49:11")).toContain("biʼsel-ismul-fusūqu"));
    it("10:51 question hamza before the article", () => expect(text("10:51")).toContain("āl-āne"));
    it("26:176 article written without alif", () => expect(text("26:176")).toBe("Keẕẕebe aṣḥābul-ejketil-murselīn"));
    it("silent letters marked with the small zero", () => {
      expect(text("2:5")).toMatch(/^Ulāʼike /);
      expect(text("18:23")).toContain("li šejʼin");
    });
  });
});

describe("transliterateWord", () => {
  it("writes the letters of a word as spelled, with a for every fatha", () => {
    const words = arabic("112:4").split(" ").filter(Boolean);
    expect(words.map((w) => transliterateWord(w))).toEqual(["walam", "jakun", "lahū", "kufuwan", "aḥadun"]);
  });
});
