import type { TajwidRule } from "@/types/quran";
import type { LessonExampleRef } from "@/lib/quran/lessonExample";

export type { LessonExampleRef } from "@/lib/quran/lessonExample";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** A list item with a bold lead-in ("Nūn ili mīm s tešdidom.") followed by its text. */
export interface LeadItem {
  lead: string;
  text: string;
}

export type LessonBlock =
  | { kind: "p"; lead?: string; text: string }
  | { kind: "list"; ordered?: boolean; items: (string | LeadItem)[] }
  | { kind: "table"; columns: string[]; rows: string[][]; /** Column shown as Arabic text. */ arabicColumn?: number }
  | { kind: "examples"; examples: LessonExampleRef[] };

export interface LessonSection {
  heading: string;
  blocks: LessonBlock[];
  /** Shown as a highlighted tip box. */
  tip?: boolean;
}

export interface TajwidLesson {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  ruleType: TajwidRule;
  estimatedMinutes: number;
  prerequisite: string | null;
  sections: LessonSection[];
  quiz: QuizQuestion[];
  nextLessonId: number | null;
  summary: string;
}

// --- Lessons data ---
// Text from the reviewed lesson doc "Lekcije tedžvida: tekst za pregled" (2026-11). Examples are
// references into src/data/ayahs; lessons.test.ts checks them and every quoted transcription.

const LESSONS: TajwidLesson[] = [
  {
    id: 1,
    slug: "uvod-tajwid",
    title: "Uvod u tedžvid",
    subtitle: "Šta je tedžvid i kako aplikacija pokazuje njegova pravila.",
    ruleType: "normal",
    estimatedMinutes: 5,
    prerequisite: null,
    sections: [
      {
        heading: "Uvod",
        blocks: [
          {
            kind: "p",
            text: "Tedžvid (تَجْوِيد) je nauka o pravilnom učenju Kur'ana: svaki harf izgovara se sa svog mjesta i sa svojim osobinama, onako kako je Kur'an prenesen s koljena na koljeno. Sama riječ znači učiniti nešto dobrim.",
          },
          {
            kind: "p",
            text: "Zašto je to važno? U arapskom jedan glas mijenja riječ. Harfovi qāf (ق) i kāf (ك) našem uhu zvuče slično, ali „qalb“ je srce, a „kelb“ pas. Tedžvid uči uho i jezik da te razlike čuju i izgovore.",
          },
        ],
      },
      {
        heading: "Šta pokazuju boje",
        blocks: [
          { kind: "p", text: "U čitaču su bojom označena četiri pravila. Boja kaže šta glas radi:" },
          {
            kind: "list",
            items: ["medd: glas se produžava;", "gunne i ihfa: glas ide kroz nos;", "kalkala: glas lagano odskoči."],
          },
          {
            kind: "p",
            text: "Koja je boja za koje pravilo pokazuje legenda u čitaču, a dodir na obojeni harf ispisuje naziv pravila.",
          },
          {
            kind: "p",
            text: "Neobojen tekst ne znači da pravila nema. I on se uči po pravilima tedžvida: svaki harf ima svoje mjesto izgovora, neki se izgovaraju krupno, a neki tanko. Ta pravila aplikacija ne boji. Bojom je označen otprilike svaki deveti harf.",
          },
        ],
      },
      {
        heading: "Pojmovi",
        blocks: [
          {
            kind: "table",
            columns: ["Pojam", "Arapski", "Značenje"],
            arabicColumn: 1,
            rows: [
              ["Harf", "حَرْف", "Slovo arapskog pisma. Ima ih 28."],
              [
                "Hareke",
                "حَرَكَة",
                "Znak za kratki vokal: fetha (e ili a), kesra (i), damma (u). Trajanje jednog kratkog vokala je mjera za sve dužine.",
              ],
              ["Sukun", "سُكُون", "Znak da harf nema vokal."],
              ["Tešdid", "تَشْدِيد", "Znak da se harf izgovara udvojeno."],
              ["Tenvin", "تَنْوِين", "Dvostruki znak vokala na kraju riječi; čita se kao vokal i n."],
              [
                "Stajanje (vakf)",
                "وَقْف",
                "Zastoj u učenju, najčešće na kraju ajeta. Zadnji kratki vokal tada se ne izgovara.",
              ],
            ],
          },
        ],
      },
      {
        heading: "Primjeri",
        blocks: [
          { kind: "p", text: "Četiri kratka ajeta pokazuju kako se čitaju boje." },
          {
            kind: "examples",
            examples: [
              {
                surah: 103,
                ayah: 1,
                words: [1, 1],
                translitWords: [0, 0],
                note: "Nijedan harf nije obojen: nema nijednog od četiri pravila. I dalje se pazi na izgovor ʻajna i ṣāda.",
              },
              {
                surah: 1,
                ayah: 1,
                words: [0, 3],
                translitWords: [0, 0],
                note: "Obojena su dva mjesta, oba medd: mali elif u „raḥmāni“ i jā pred kraj ajeta.",
              },
              {
                surah: 112,
                ayah: 1,
                words: [1, 4],
                translitWords: [0, 2],
                note: "Obojen je samo zadnji harf: kalkala na dālu kad se stane.",
              },
              {
                surah: 113,
                ayah: 2,
                words: [0, 3],
                translitWords: [0, 3],
                note: "Dva pravila u jednom ajetu: ihfa (nūn ispred šīna) i kalkala na kraju. Dugi vokal u „mā“ nije obojen.",
              },
            ],
          },
          {
            kind: "p",
            text: "Riječi iz uvoda nalaze se u ajetima 26:89 („bi qalbin“) i 18:18 („we kelbuhum“).",
          },
        ],
      },
      {
        heading: "Savjet",
        tip: true,
        blocks: [
          {
            kind: "p",
            text: "Prije pravila utvrdi čist izgovor svakog harfa: tabela Harfovi u aplikaciji pokazuje kako se koji izgovara. Pravila iz narednih lekcija grade se na tome.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Šta je tedžvid?",
        options: ["Brzo učenje Kur'ana", "Nauka o pravilnom učenju Kur'ana", "Prijevod Kur'ana", "Učenje Kur'ana napamet"],
        correctIndex: 1,
        explanation: "Tedžvid uči kako se svaki harf izgovara sa svog mjesta i sa svojim osobinama.",
      },
      {
        question: "Šta znači kad harf u čitaču nije obojen?",
        options: [
          "Da se ne izgovara",
          "Da tu nema nijednog od četiri obojena pravila",
          "Da se uči tiše",
          "Da se tu staje",
        ],
        correctIndex: 1,
        explanation: "I neobojen tekst ima pravila izgovora, samo ih aplikacija ne boji.",
      },
      {
        question: "Zašto je važno razlikovati qāf (ق) i kāf (ك)?",
        options: [
          "Zbog ljepšeg zvuka",
          "Jer zamjena jednog harfa mijenja riječ",
          "Za početnika nije važno",
          "Jer se slično pišu",
        ],
        correctIndex: 1,
        explanation: "„qalb“ je srce, a „kelb“ pas; razlika je u jednom harfu.",
      },
    ],
    nextLessonId: 2,
    summary:
      "Tedžvid je nauka o pravilnom učenju Kur'ana. Aplikacija bojom označava četiri pravila: medd, gunne, ihfa i kalkalu. Neobojen tekst također ima pravila izgovora, samo nisu obojena.",
  },
  {
    id: 2,
    slug: "mad-duljenje",
    title: "Medd: dužina vokala",
    subtitle: "Kada se glas uči duže i koliko.",
    ruleType: "mad",
    estimatedMinutes: 7,
    prerequisite: "Lekcija 1",
    sections: [
      {
        heading: "Uvod",
        blocks: [
          {
            kind: "p",
            text: "U bosanskom dužina vokala nekad mijenja značenje: grad izgovoren dugo je naselje, a izgovoren kratko je led koji pada s neba. U arapskom je tako u svakoj rečenici: kratak i dug vokal su dva različita glasa. Zato dužina u učenju Kur'ana nije ukras, nego dio same riječi.",
          },
          {
            kind: "p",
            text: "Medd (مَدّ) znači produženje. Dug vokal se uči koliko dva kratka; to je osnovna dužina. Kad poslije dugog vokala dođe hemze ili sukun, glas se uči još duže, po pravilima ispod.",
          },
        ],
      },
      {
        heading: "Pravilo",
        blocks: [
          {
            kind: "p",
            text: "Harfovi medda su tri: elif (ا) poslije fethe, wāw (و) sa sukunom poslije damme i jā (ي) sa sukunom poslije kesre. Kad dođu tako, vokal se uči dugo: ā, ū, ī.",
          },
        ],
      },
      {
        heading: "Vrste dužine",
        blocks: [
          {
            kind: "table",
            columns: ["Vrsta", "Kada nastaje", "Trajanje"],
            rows: [
              [
                "Osnovna dužina (medd tabi'i)",
                "Harf medda, a poslije njega nema ni hemzeta ni sukuna",
                "Koliko dva kratka vokala",
              ],
              ["Spojena dužina (medd muttesil)", "Poslije harfa medda dolazi hemze u istoj riječi", "Četiri ili pet kratkih vokala"],
              ["Rastavljena dužina (medd munfesil)", "Hemze je na početku sljedeće riječi", "Četiri ili pet kratkih vokala"],
              ["Stalna dužina (medd lazim)", "Poslije harfa medda dolazi stalni sukun ili tešdid", "Šest kratkih vokala"],
              [
                "Nestalna dužina (medd arid)",
                "Kad se stane, a ispred zadnjeg harfa je harf medda",
                "Obično četiri do šest; nije strogo određeno",
              ],
            ],
          },
          { kind: "p", text: "Dvije dužine iste vrste u istom učenju uče se jednako dugo." },
        ],
      },
      {
        heading: "Šta je obojeno",
        blocks: [
          {
            kind: "p",
            text: "Osnovna dužina nije obojena, jer se dug vokal uvijek uči dugo. Boja za medd pokazuje ostale četiri vrste i dužine napisane malim znakom iznad harfa, kao što je mali elif.",
          },
        ],
      },
      {
        heading: "Kako se uči",
        blocks: [
          {
            kind: "list",
            ordered: true,
            items: [
              "Pusti ajet i slušaj gdje učač produžava glas.",
              "Uči zajedno s učačem, pa zatim bez snimka.",
              "Dužinu mjeri kratkim vokalima: jedan kratki vokal traje koliko da se skupi ili ispruži prst.",
              "Drži istu mjeru do kraja učenja: ako spojenu dužinu učiš četiri kratka vokala, uči je tako svaki put.",
            ],
          },
        ],
      },
      {
        heading: "Primjeri",
        blocks: [
          { kind: "p", text: "Po jedan primjer za svaku vrstu; prva nije obojena, ostale jesu." },
          {
            kind: "examples",
            examples: [
              { surah: 113, ayah: 2, words: [2, 3], translitWords: [2, 3], note: "Osnovna dužina u „mā“: nije obojena." },
              {
                surah: 1,
                ayah: 1,
                words: [2, 2],
                translitWords: [0, 0],
                translitChars: [12, 19],
                note: "Osnovna dužina pisana malim elifom: obojena, uči se koliko dva kratka vokala.",
              },
              {
                surah: 110,
                ayah: 1,
                words: [2, 2],
                translitWords: [1, 1],
                note: "Spojena dužina: poslije elifa dolazi hemze u istoj riječi.",
              },
              {
                surah: 109,
                ayah: 2,
                words: [0, 1],
                translitWords: [0, 1],
                note: "Rastavljena dužina: hemze počinje sljedeću riječ.",
              },
              {
                surah: 1,
                ayah: 7,
                words: [7, 8],
                translitWords: [5, 6],
                note: "Stalna dužina: poslije elifa dolazi lām s tešdidom.",
              },
              {
                surah: 1,
                ayah: 2,
                words: [3, 3],
                translitWords: [2, 2],
                translitChars: [7, 14],
                note: "Nestalna dužina na kraju ajeta: jā ispred zadnjeg harfa. U istoj riječi je i mali elif.",
              },
            ],
          },
        ],
      },
      {
        heading: "Česte greške",
        blocks: [
          {
            kind: "list",
            items: [
              "Dug vokal izgovoren kratko. Osnovna dužina je dio riječi i ne smije se skratiti.",
              "Kratak vokal izgovoren dugo. Gdje nema harfa medda, nema ni dužine.",
              "Ista vrsta dužine jednom duža, drugi put kraća.",
            ],
          },
        ],
      },
      {
        heading: "Savjet",
        tip: true,
        blocks: [{ kind: "p", text: "Tri harfa medda, svaki uz svoj vokal: elif uz fethu, wāw uz dammu, jā uz kesru." }],
      },
    ],
    quiz: [
      {
        question: "Koji su harfovi medda?",
        options: ["bā (ب), tā (ت), s̱ā (ث)", "elif (ا), wāw (و), jā (ي)", "mīm (م), nūn (ن), lām (ل)", "qāf (ق), ṭā (ط), dāl (د)"],
        correctIndex: 1,
        explanation: "Dužina nastaje samo na elifu, wāwu i jā, kad dođu poslije svog vokala.",
      },
      {
        question: "Koliko traje osnovna dužina?",
        options: [
          "Koliko jedan kratki vokal",
          "Koliko dva kratka vokala",
          "Koliko četiri kratka vokala",
          "Koliko šest kratkih vokala",
        ],
        correctIndex: 1,
        explanation: "Dug vokal se uvijek uči koliko dva kratka.",
      },
      {
        question: "U „Lā eʻbudu“ (109:2) elif je obojen. Zašto?",
        options: [
          "Jer je na kraju ajeta",
          "Jer poslije njega hemze počinje sljedeću riječ",
          "Jer ima tešdid",
          "Jer je harf kalkale",
        ],
        correctIndex: 1,
        explanation: "To je rastavljena dužina; uči se četiri ili pet kratkih vokala.",
      },
      {
        question: "Zašto dugi vokal u „mā“ (113:2) nije obojen?",
        options: [
          "Jer se ne izgovara",
          "Jer je to osnovna dužina",
          "Jer je na početku ajeta",
          "Jer je greška u aplikaciji",
        ],
        correctIndex: 1,
        explanation: "Boja pokazuje samo dužine duže od osnovne i one pisane malim znakom.",
      },
    ],
    nextLessonId: 3,
    summary:
      "Medd je dužina vokala na elifu, wāwu i jā. Osnovna dužina traje koliko dva kratka vokala i nije obojena. Uz hemze ili sukun glas se uči duže: spojena i rastavljena dužina četiri ili pet, stalna šest, a nestalna, kad se stane, obično četiri do šest kratkih vokala.",
  },
  {
    id: 3,
    slug: "ghunnah-nazalni-zvuk",
    title: "Gunne: glas kroz nos",
    subtitle: "Nosni zvuk nūna i mīma i kada se zadržava.",
    ruleType: "ghunnah",
    estimatedMinutes: 8,
    prerequisite: "Lekcije 1–2",
    sections: [
      {
        heading: "Uvod",
        blocks: [
          {
            kind: "p",
            text: "Zatvori usta i izgovori „mmm“. Glas ne izlazi kroz usta, nego kroz nos. Taj nosni zvuk zove se gunne (غُنَّة), a imaju ga samo dva harfa: nūn (ن) i mīm (م).",
          },
          {
            kind: "p",
            text: "Gunne je stalna osobina ta dva harfa. Pravila tedžvida kažu kada se zadržava duže: koliko dva kratka vokala.",
          },
        ],
      },
      {
        heading: "Kada se gunne zadržava",
        blocks: [
          {
            kind: "list",
            ordered: true,
            items: [
              { lead: "Nūn ili mīm s tešdidom.", text: "Uvijek, gdje god se nalaze." },
              {
                lead: "Idgam s gunnom.",
                text: "Kad poslije nūna sa sukunom ili tenvina, u sljedećoj riječi, dođe jā (ي), nūn (ن), mīm (م) ili wāw (و). Nūn se tada ne izgovara, nego se uklapa u taj harf, a gunne ostaje.",
              },
              { lead: "Mīm sa sukunom ispred mīma.", text: "Dva mīma se spajaju u jedan, s gunnom." },
              { lead: "Ihfa i iklab.", text: "O njima je sljedeća lekcija." },
            ],
          },
          {
            kind: "p",
            text: "Kad poslije nūna sa sukunom ili tenvina dođe lām (ل) ili rā (ر), nūn se također uklapa, ali bez gunne. To mjesto nije obojeno.",
          },
        ],
      },
      {
        heading: "Kako se izgovara",
        blocks: [
          {
            kind: "list",
            ordered: true,
            items: [
              "Za mīm sklopi usne; za nūn prisloni vrh jezika iza gornjih zuba.",
              "Pusti glas kroz nos.",
              "Zadrži ga koliko dva kratka vokala.",
              "Provjera: lagano stisni nos prstima. Ako se zvuk prekine, išao je kroz nos, kako i treba.",
            ],
          },
        ],
      },
      {
        heading: "Primjeri",
        blocks: [
          {
            kind: "p",
            text: "Pet obojenih primjera i jedan neobojen, za poređenje. Transkripcija idgam ne piše: nūn je napisan, a uči se uklopljen.",
          },
          {
            kind: "examples",
            examples: [
              {
                surah: 103,
                ayah: 2,
                words: [0, 0],
                translitWords: [0, 0],
                translitChars: [0, 4],
                note: "Nūn s tešdidom: gunne od dva kratka vokala.",
              },
              { surah: 102, ayah: 4, words: [0, 0], translitWords: [0, 0], note: "Mīm s tešdidom: gunne od dva kratka vokala." },
              { surah: 99, ayah: 7, words: [0, 1], translitWords: [0, 2], note: "Idgam s gunnom: nūn sa sukunom ispred jā." },
              {
                surah: 111,
                ayah: 5,
                words: [2, 4],
                translitWords: [2, 4],
                note: "Idgam s gunnom dva puta: tenvin ispred mīma, pa nūn ispred mīma.",
              },
              {
                surah: 106,
                ayah: 4,
                words: [1, 3],
                translitWords: [1, 3],
                rules: ["ghunnah"],
                note: "Mīm sa sukunom ispred mīma: spajaju se, s gunnom.",
              },
              {
                surah: 107,
                ayah: 4,
                words: [0, 1],
                translitWords: [0, 2],
                // The jā in "muṣallīn" is medd at the end of the ayah; this example is about gunne.
                rules: ["ghunnah"],
                note: "Idgam bez gunne: tenvin ispred lāma. Nije obojeno.",
              },
            ],
          },
        ],
      },
      {
        heading: "Česte greške",
        blocks: [
          {
            kind: "list",
            items: [
              "Gunne na tešdidu prekratka: treba trajati koliko dva kratka vokala.",
              "Nūn izgovoren jasno ispred jā, nūna, mīma ili wāwa, umjesto da se uklopi.",
              "Gunne ispred lāma i rā, gdje je nema.",
            ],
          },
        ],
      },
      {
        heading: "Savjet",
        tip: true,
        blocks: [{ kind: "p", text: "Četiri harfa idgama s gunnom pamte se po riječi sastavljenoj od njih: ينمو." }],
      },
    ],
    quiz: [
      {
        question: "Koja dva harfa imaju gunne?",
        options: ["bā (ب) i tā (ت)", "nūn (ن) i mīm (م)", "elif (ا) i wāw (و)", "qāf (ق) i kāf (ك)"],
        correctIndex: 1,
        explanation: "Gunne je nosni zvuk nūna i mīma.",
      },
      {
        question: "Koliko se zadržava gunne na nūnu s tešdidom?",
        options: ["Koliko jedan kratki vokal", "Koliko dva kratka vokala", "Koliko četiri kratka vokala", "Ne zadržava se"],
        correctIndex: 1,
        explanation: "Nūn i mīm s tešdidom uvijek imaju gunne od dva kratka vokala.",
      },
      {
        question: "U „Fe wejlun lil-muṣallīn“ (107:4) tenvin dolazi ispred lāma. Šta se dešava?",
        options: ["Ihfa", "Idgam s gunnom", "Idgam bez gunne", "Kalkala"],
        correctIndex: 2,
        explanation: "Ispred lāma i rā nūn se uklapa bez gunne, pa to mjesto nije obojeno.",
      },
    ],
    nextLessonId: 4,
    summary:
      "Gunne je nosni zvuk nūna i mīma. Zadržava se koliko dva kratka vokala kad nūn ili mīm imaju tešdid, kod idgama s gunnom (ispred jā, nūna, mīma i wāwa) i kad se mīm spaja s mīmom. Ispred lāma i rā gunne nema.",
  },
  {
    id: 4,
    slug: "ikhfa-skriveni-zvuk",
    title: "Ihfa: prikriven nūn",
    subtitle: "Kada se nūn bez vokala ne izgovara jasno, nego prikriveno i kroz nos.",
    ruleType: "ikhfa",
    estimatedMinutes: 8,
    prerequisite: "Lekcije 1–3",
    sections: [
      {
        heading: "Uvod",
        blocks: [
          {
            kind: "p",
            text: "Nūn sa sukunom i tenvin uče se na četiri načina, zavisno od harfa koji dolazi poslije njih: jasno (izhar), uklopljeno u naredni harf (idgam), pretvoreno u mīm (iklab) ili prikriveno (ihfa).",
          },
          {
            kind: "p",
            text: "Ihfa (إِخْفَاء) znači prikrivanje. Nūn se ne izgovara jasno, ali se i ne uklapa potpuno: jezik ne dotiče mjesto nūna, a gunne se čuje koliko dva kratka vokala, dok se usta već spremaju za naredni harf.",
          },
        ],
      },
      {
        heading: "Pravilo",
        blocks: [
          {
            kind: "p",
            text: "Ihfa nastaje kad poslije nūna sa sukunom ili tenvina dođe jedan od ovih petnaest harfova: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك.",
          },
          {
            kind: "p",
            text: "Lakše je zapamtiti ostalih trinaest: šest grlenih harfova uz koje se nūn uči jasno (ء ه ع ح غ خ), šest harfova idgama (ي ر م ل و ن) i bā (ب), uz koji nastaje iklab.",
          },
        ],
      },
      {
        heading: "Iklab i ihfa na mīmu",
        blocks: [
          {
            kind: "p",
            lead: "Iklab.",
            text: "Kad poslije nūna sa sukunom ili tenvina dođe bā (ب), nūn se uči kao mīm, s gunnom. U mushafu je tada iznad nūna mali mīm.",
          },
          {
            kind: "p",
            lead: "Ihfa na mīmu.",
            text: "Kad poslije mīma sa sukunom dođe bā (ب), mīm se uči prikriveno, s gunnom.",
          },
          {
            kind: "p",
            text: "Oba mjesta u čitaču imaju istu boju kao ihfa, jer glas i tu ide kroz nos. Koje je pravilo, pokazuje dodir na harf.",
          },
        ],
      },
      {
        heading: "Kako se izgovara",
        blocks: [
          {
            kind: "list",
            ordered: true,
            items: [
              "Ne dotiči jezikom mjesto nūna.",
              "Usta pripremi za naredni harf.",
              "Pusti glas kroz nos koliko dva kratka vokala.",
              "Pređi na naredni harf.",
            ],
          },
        ],
      },
      {
        heading: "Primjeri",
        blocks: [
          {
            kind: "p",
            text: "Četiri primjera ihfaa, jedan iklaba i jedan ihfaa na mīmu. Transkripcija uvijek piše n, a uči se po pravilu.",
          },
          {
            kind: "examples",
            examples: [
              { surah: 113, ayah: 2, words: [0, 1], translitWords: [0, 1], note: "Ihfa: nūn sa sukunom ispred šīna." },
              { surah: 109, ayah: 3, words: [1, 1], translitWords: [2, 2], note: "Ihfa unutar riječi: nūn ispred tā." },
              {
                surah: 103,
                ayah: 2,
                words: [1, 1],
                translitWords: [0, 0],
                translitChars: [6, 12],
                note: "Ihfa unutar riječi: nūn ispred sīna.",
              },
              { surah: 111, ayah: 3, words: [1, 2], translitWords: [1, 2], note: "Ihfa s tenvinom: tenvin ispred ẕāla." },
              {
                surah: 104,
                ayah: 4,
                words: [2, 2],
                translitWords: [1, 2],
                note: "Iklab: nūn ispred bā uči se kao mīm. U istoj riječi je i nūn s tešdidom.",
              },
              {
                surah: 105,
                ayah: 4,
                words: [0, 1],
                translitWords: [0, 2],
                // The last tenvin is gunne because of the next, unshown word.
                rules: ["ikhfa"],
                note: "Ihfa na mīmu: mīm sa sukunom ispred bā.",
              },
            ],
          },
        ],
      },
      {
        heading: "Česte greške",
        blocks: [
          {
            kind: "list",
            items: [
              "Nūn izgovoren jasno. Jasno se uči samo uz šest grlenih harfova.",
              "Nūn potpuno uklopljen, bez gunne.",
              "Gunne prekratka: traje koliko dva kratka vokala.",
            ],
          },
        ],
      },
      {
        heading: "Savjet",
        tip: true,
        blocks: [
          {
            kind: "p",
            text: "Izhar: nūn se čuje cijeli. Idgam: nūn se ne čuje. Ihfa je između: nūn se ne čuje, ali njegova gunne ostaje.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Šta znači ihfa?",
        options: ["Produžavanje", "Prikrivanje", "Uklapanje", "Odskok"],
        correctIndex: 1,
        explanation: "Nūn se prikriva; ne izgovara se jasno, ali njegova gunne ostaje.",
      },
      {
        question: "Koliko harfova daje ihfa?",
        options: ["6", "13", "15", "28"],
        correctIndex: 2,
        explanation: "Od 28 harfova, šest daje izhar, šest idgam, jedan iklab, a preostalih petnaest ihfa.",
      },
      {
        question: "U „entum“ (109:3) nūn sa sukunom dolazi ispred tā. Koje je to pravilo?",
        options: ["Izhar", "Idgam", "Iklab", "Ihfa"],
        correctIndex: 3,
        explanation: "Tā je jedan od petnaest harfova ihfaa.",
      },
      {
        question: "Šta se dešava kad poslije nūna sa sukunom dođe bā (ب)?",
        options: ["Nūn se uči jasno", "Nūn se uči kao mīm, s gunnom", "Nūn se uklapa bez gunne", "Glas odskoči"],
        correctIndex: 1,
        explanation: "To je iklab; u mushafu je iznad nūna mali mīm.",
      },
    ],
    nextLessonId: 5,
    summary:
      "Ihfa je prikrivanje nūna sa sukunom ili tenvina ispred petnaest harfova: nūn se ne izgovara jasno, a gunne se čuje koliko dva kratka vokala. Ispred bā nūn se uči kao mīm (iklab), a mīm sa sukunom ispred bā uči se prikriveno. Sva tri mjesta imaju istu boju.",
  },
  {
    id: 5,
    slug: "qalqalah-odskok",
    title: "Kalkala: odskok glasa",
    subtitle: "Pet harfova koji, kad nemaju vokal, lagano odskoče.",
    ruleType: "qalqalah",
    estimatedMinutes: 7,
    prerequisite: "Lekcije 1–4",
    sections: [
      {
        heading: "Uvod",
        blocks: [
          {
            kind: "p",
            text: "Kad harf nema vokal, glas se na njemu zaustavi. Pet harfova bi se pri tome izgubilo, pa se izgovaraju uz lagan odskok glasa, kao kad loptica dotakne pod i odmah se odbije. Taj odskok zove se kalkala (قَلْقَلَة).",
          },
        ],
      },
      {
        heading: "Pravilo",
        blocks: [
          {
            kind: "p",
            text: "Harfovi kalkale su: qāf (ق), ṭā (ط), bā (ب), džīm (ج) i dāl (د). Pamte se po izrazu sastavljenom od tih pet harfova: قطب جد.",
          },
          {
            kind: "p",
            text: "Kalkala se uči samo kad harf nema vokal: kad ima sukun ili kad se na njemu stane. Harf s vokalom nema kalkalu.",
          },
        ],
      },
      {
        heading: "Jačina",
        blocks: [
          {
            kind: "list",
            items: [
              { lead: "Slabija:", text: "harf sa sukunom usred riječi ili usred učenja." },
              { lead: "Jača:", text: "kad se na harfu stane." },
              { lead: "Najjača:", text: "kad se stane na harfu koji ima tešdid." },
            ],
          },
        ],
      },
      {
        heading: "Kako se izgovara",
        blocks: [
          {
            kind: "list",
            ordered: true,
            items: [
              "Izgovori harf bez vokala.",
              "Pusti da glas kratko odskoči s mjesta izgovora.",
              "Ne dodaji vokal: čuje se samo harf i odskok.",
            ],
          },
        ],
      },
      {
        heading: "Primjeri",
        blocks: [
          { kind: "p", text: "Šest primjera, od slabije do najjače kalkale." },
          {
            kind: "examples",
            examples: [
              { surah: 105, ayah: 2, words: [1, 1], translitWords: [2, 2], note: "Slabija: džīm sa sukunom usred riječi." },
              { surah: 89, ayah: 8, words: [1, 2], translitWords: [1, 2], note: "Slabija: qāf sa sukunom usred učenja." },
              {
                surah: 113,
                ayah: 1,
                words: [4, 4],
                translitWords: [3, 3],
                translitChars: [7, 12],
                note: "Jača: kraj ajeta, stane se na qāfu.",
              },
              {
                surah: 112,
                ayah: 1,
                words: [1, 4],
                translitWords: [0, 2],
                note: "Jača: stane se na dālu. Mushaf piše tenvin; kad se stane, čita se „eḥad“.",
              },
              {
                surah: 111,
                ayah: 5,
                words: [2, 4],
                translitWords: [2, 4],
                note: "Obje u jednom ajetu: slabija na bā u „ḥablun“, jača na dālu na kraju.",
              },
              {
                surah: 111,
                ayah: 1,
                words: [5, 5],
                translitWords: [4, 5],
                // The wāw is gunne because of the tenvin in the previous, unshown word.
                rules: ["qalqalah"],
                note: "Najjača: stane se na bā s tešdidom.",
              },
            ],
          },
        ],
      },
      {
        heading: "Česte greške",
        blocks: [
          {
            kind: "list",
            items: [
              "Dodavanje vokala poslije harfa: odskok nije vokal.",
              "Harf bez odskoka, pa se ne čuje.",
              "Kalkala na harfu koji ima vokal.",
            ],
          },
        ],
      },
      {
        heading: "Savjet",
        tip: true,
        blocks: [
          {
            kind: "p",
            text: "U surama 111, 112 i 113 svaki ajet završava harfom kalkale. Dobre su za vježbu, jer se na kraju svakog ajeta staje.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Koji su harfovi kalkale?",
        options: ["ق ط ب ج د", "ن م و ي", "ا و ي", "ت ث ج"],
        correctIndex: 0,
        explanation: "Pet harfova kalkale su qāf, ṭā, bā, džīm i dāl.",
      },
      {
        question: "Kada se uči kalkala?",
        options: [
          "Uvijek na tih pet harfova",
          "Samo kad harf ima vokal",
          "Samo kad harf nema vokal: ima sukun ili se na njemu stane",
          "Samo na početku riječi",
        ],
        correctIndex: 2,
        explanation: "Harf s vokalom nema kalkalu.",
      },
      {
        question: "Gdje je kalkala jača?",
        options: ["Usred riječi", "Kad se na harfu stane", "Kad harf ima fethu", "Svugdje je ista"],
        correctIndex: 1,
        explanation:
          "Usred riječi je slabija, pri stajanju jača, a najjača kad harf na kojem se stane ima tešdid.",
      },
    ],
    nextLessonId: null,
    summary:
      "Kalkala je lagan odskok glasa na pet harfova (ق ط ب ج د) kad nemaju vokal. Usred riječi je slabija, pri stajanju jača, a najjača kad harf na kojem se stane ima tešdid.",
  },
];

export async function getAllTajwidLessons(): Promise<TajwidLesson[]> {
  return LESSONS;
}

export async function getTajwidLessonBySlug(
  slug: string
): Promise<TajwidLesson | null> {
  const lesson = LESSONS.find((l) => l.slug === slug);
  return lesson ?? null;
}

export async function getTajwidLessonById(
  id: number
): Promise<TajwidLesson | null> {
  const lesson = LESSONS.find((l) => l.id === id);
  return lesson ?? null;
}
