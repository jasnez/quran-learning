import type { TajwidRule } from "@/types/quran";

export interface TajwidExample {
  arabic: string;
  transliteration: string;
  translation: string;
  rule: string;
  surahRef?: string;
  audioTimestamp?: {
    surah: number;
    ayah: number;
    wordFrom: number;
    wordTo: number;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface KeyTerm {
  term: string;
  arabic?: string;
  definition: string;
}

export interface TajwidLesson {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  ruleType: TajwidRule;
  color: string;
  colorHex: string;
  estimatedMinutes: number;
  prerequisite: string | null;
  sections: {
    introduction: string[];
    definition: string[];
    whenItOccurs: string[];
    howToProduce?: string[];
    examples: TajwidExample[];
    commonMistakes?: string[];
    keyTerms?: KeyTerm[];
    practiceAyahs?: { surah: number; ayah: number; description: string }[];
    tip?: { title: string; text: string };
  };
  quiz: QuizQuestion[];
  nextLessonId: number | null;
  summary: string;
}

// --- Lessons data ---

const LESSONS: TajwidLesson[] = [
  {
    id: 1,
    slug: "uvod-tajwid",
    title: "Uvod u tajwid i normalan tekst",
    subtitle:
      "Zašto je važno učiti Kur'an s pravilnim tedžvidom i šta znači 'normalan' tekst.",
    ruleType: "normal",
    color: "text-gray-800 dark:text-gray-200",
    colorHex: "#1A1A1A",
    estimatedMinutes: 5,
    prerequisite: null,
    sections: {
      introduction: [
        "Svaki put kada otvorimo Kur'an — bilo da ga čitamo, slušamo ili učimo napamet — susrećemo se sa jednom od najljepših tradicija arapskog jezika: tedžvidom. Riječ tedžvid (تَجْوِيد) dolazi od arapskog korijena ج-و-د koji znači \"poboljšati\" ili \"učiniti lijepim\". U kontekstu Kur'ana, tedžvid označava pravilno izgovaranje svakog slova, sa svim njegovim osobinama, tačno onako kako je objavljeno.",
        "Ali tedžvid nije samo pravilo — on je most između tebe i teksta. Kada izgovaraš svako slovo na pravilan način, tekst dobija ritam, melodiju i dubinu koja se gubi kod nepravilnog čitanja."
      ],
      definition: [
        "U arapskom jeziku, promjena jednog zvuka može potpuno promijeniti značenje riječi. Na primjer, قَلْب (qalb) znači \"srce\", dok كَلْب (kalb) znači \"pas\". Razlika je samo u jednom slovu, ali značenje je potpuno drugačije. Tedžvid te uči da čuješ i izgovaraš te razlike."
      ],
      whenItOccurs: [
        "U ovoj aplikaciji koristimo sistem boja da ti pomognemo prepoznati pravila tedžvida. Tekst prikazan u standardnoj tamnoj boji — bez ikakve posebne oznake — je \"normalan tekst\". To znači da se slova izgovaraju na osnovni, čist način, bez produžavanja, nazalnog zvuka, skrivanja ili odskoka.",
        "Normalan tekst čini otprilike 60–70% Kur'ana — on je osnova na koju se nadograđuju sva ostala pravila."
      ],
      examples: [
        {
          arabic: "بِسْمِ",
          transliteration: "bismi",
          translation:
            "U ime — sva slova se izgovaraju čisto i jasno, bez posebnog pravila",
          rule: "Normalan tekst"
        },
        {
          arabic: "رَبِّ",
          transliteration: "rabbi",
          translation:
            "Gospodar — dvostruko \"b\" (tašdid), ali bez posebnog tedžvid pravila",
          rule: "Normalan tekst"
        },
        {
          arabic: "كِتَابَ",
          transliteration: "kitāba",
          translation:
            "Knjiga — svako slovo se izgovara jasno na svom mjestu, bez dodatnih efekata",
          rule: "Normalan tekst"
        }
      ],
      keyTerms: [
        {
          term: "Tedžvid",
          arabic: "تَجْوِيد",
          definition:
            "Nauka o pravilnom izgovaranju Kur'ana — svako slovo na svom mjestu, sa svim osobinama."
        },
        {
          term: "Harf",
          arabic: "حَرْف",
          definition:
            "Slovo arapskog alfabeta — u Kur'anu ih ima 28 (+hamza), svako ima tačno definisano mjesto izgovora."
        },
        {
          term: "Harakat",
          arabic: "حَرَكَات",
          definition:
            "Znakovi iznad ili ispod slova koji određuju kratki vokal: fetha (a), kesra (i), damma (u)."
        },
        {
          term: "Sukun",
          arabic: "سُكُون",
          definition:
            "Mali krug iznad slova — slovo nema vokal i izgovara se \"mirno\"."
        },
        {
          term: "Tašdid",
          arabic: "تَشْدِيد",
          definition:
            "Znak sličan malom \"w\" iznad slova — slovo se izgovara dvostruko, pojačano."
        }
      ],
      tip: {
        title: "Savjet za učenje",
        text: "Prije nego kreneš na posebna pravila, posveti vrijeme vježbanju čistog izgovora arapskih slova. Kada osnova bude stabilna, sva ostala pravila će se prirodno nadograditi."
      }
    },
    quiz: [
      {
        question: "Šta znači riječ \"tedžvid\"?",
        options: [
          "Brzo čitanje Kur'ana",
          "Poboljšati / učiniti lijepim izgovor",
          "Čitanje na melodičan način",
          "Prevođenje arapskog teksta"
        ],
        correctIndex: 1,
        explanation:
          "Tedžvid dolazi od korijena ج-و-د što znači poboljšati ili uljepšati."
      },
      {
        question: "Kako prepoznaješ normalan tekst u aplikaciji?",
        options: [
          "Označen je zelenom bojom",
          "Označen je crvenom bojom",
          "Nema posebne boje — prikazan standardnom tamnom bojom",
          "Označen je plavom bojom"
        ],
        correctIndex: 2,
        explanation:
          "Normalan tekst je jedini koji nema posebnu boju — sve ostale boje označavaju posebno pravilo."
      },
      {
        question: "Zašto je pravilno izgovaranje slova važno?",
        options: [
          "Samo zbog tradicije",
          "Jer promjena jednog zvuka može promijeniti značenje",
          "Nije posebno važno",
          "Važno je samo za hafize"
        ],
        correctIndex: 1,
        explanation:
          "U arapskom jeziku, razlika u jednom slovu može potpuno promijeniti značenje cijele riječi."
      }
    ],
    nextLessonId: 2,
    summary:
      "Tedžvid je nauka o pravilnom izgovaranju Kur'ana. Normalan tekst (bez posebne boje) čini osnovu — čist, jasan izgovor svakog slova. Na tu osnovu se nadograđuju sva ostala pravila."
  },
  {
    id: 2,
    slug: "mad-duljenje",
    title: "Mad — duljenje samoglasnika",
    subtitle:
      "Nauči kada i koliko produžiti glas prilikom učenja Kur'ana.",
    ruleType: "mad",
    color: "text-emerald-600 dark:text-emerald-400",
    colorHex: "#16A34A",
    estimatedMinutes: 7,
    prerequisite: "Lekcija 1",
    sections: {
      introduction: [
        "Zamisli da pjevaš svoju omiljenu pjesmu i da na jednom mjestu produžiš ton — to produžavanje daje melodiju i emociju. U Kur'anu postoji nešto slično, ali preciznije i sa jasnim pravilima: to je madd (مَدّ).",
        "Doslovno, madd znači \"produženje\" ili \"rastezanje\". U praksi, to je produžavanje glasa na samoglasniku — malo duže nego obično."
      ],
      definition: [
        "Madd nastaje kada se pojavi jedno od tri slova madda (huruf al-madd) nakon vokala koji im odgovara: alif (ا) nakon fathe — produžava zvuk \"a\"; waw (و) nakon damme — produžava zvuk \"u\"; ya (ي) nakon kesre — produžava zvuk \"i\"."
      ],
      whenItOccurs: [
        "Madd tabii (prirodni) traje 2 harakate i javlja se uvijek kada se pojavi slovo madda.",
        "Madd muttasil traje 4–5 harakata kada nakon slova madda dođe hamza u istoj riječi.",
        "Madd munfasil traje 4–5 harakata kada hamza dođe u sljedećoj riječi.",
        "Madd lazim traje 6 harakata kada nakon slova madda dođe sukun ili tašdid."
      ],
      howToProduce: [
        "Pusti audio ajeta koji sadrži madd.",
        "Slušaj pažljivo gdje učač produžava glas.",
        "Pokušaj izgovoriti zajedno sa učačem — osjeti ritam produženja.",
        "Probaj bez audija — produžavaj na istim mjestima brojeći do 2 (za tabii) ili do 4/6 za duže vrste.",
        "U aplikaciji: zelena boja ti pokazuje tačno gdje se primjenjuje pravilo mad."
      ],
      examples: [
        {
          arabic: "قَالُوا",
          transliteration: "qālū",
          translation:
            "Oni rekoše — alif produžava \"a\", waw produžava \"u\".",
          rule: "Madd tabii (2 harakate)",
          surahRef: "Al-Baqarah 2:11"
        },
        {
          arabic: "ٱلرَّحْمَـٰنِ",
          transliteration: "ar-Raḥmāni",
          translation:
            "Milostivi — alif iznad slova م produžava glas \"a\".",
          rule: "Madd tabii (2 harakate)",
          surahRef: "Al-Fatiha 1:1"
        },
        {
          arabic: "ٱلرَّحِيمِ",
          transliteration: "ar-Raḥīmi",
          translation:
            "Samilosni — ya nakon kesre produžava glas \"i\".",
          rule: "Madd tabii (2 harakate)",
          surahRef: "Al-Fatiha 1:1"
        },
        {
          arabic: "جَآءَ",
          transliteration: "jā'a",
          translation:
            "Došao je — alif prije hamze u istoj riječi, glas se produžava 4–5 harakata.",
          rule: "Madd muttasil (4–5 harakata)"
        }
      ],
      commonMistakes: [
        "Prekratko produžavanje — madd tabii traje tačno 2 harakate, ne kraće.",
        "Predugačko produžavanje bez razloga — ne pretjerivati, slušaj učača za tačan ritam.",
        "Produžavanje na pogrešnom mjestu — samo slova alif, waw i ya nakon odgovarajućeg vokala su slova madda."
      ],
      tip: {
        title: "Kako zapamtiti?",
        text: "Slova madda su tri: alif, waw, ya — a svako \"voli\" svoj vokal. Alif voli fathu (a), waw voli dammu (u), ya voli kesru (i). Kada se nađu zajedno, glas se rasteže."
      }
    },
    quiz: [
      {
        question: "Koja tri slova su \"slova madda\"?",
        options: [
          "Ba, Ta, Tha",
          "Alif, Waw, Ya",
          "Mim, Nun, Lam",
          "Ha, Kha, Jim"
        ],
        correctIndex: 1,
        explanation:
          "Tri slova madda su alif (ا), waw (و) i ya (ي). Samo na njima se primjenjuje pravilo mad."
      },
      {
        question: "Koliko traje madd tabii?",
        options: ["1 harakat", "2 harakate", "4 harakate", "6 harakata"],
        correctIndex: 1,
        explanation:
          "Madd tabii traje tačno 2 harakate — to je osnovno, prirodno produžavanje glasa."
      },
      {
        question:
          "U riječi قَالُوا (qālū), koji zvukovi se produžavaju zbog madda?",
        options: ["Samo \"a\"", "Samo \"u\"", "I \"a\" i \"u\"", "Nijedan"],
        correctIndex: 2,
        explanation:
          "Alif produžava \"a\" (qā-), a waw produžava \"u\" (-lū), pa se oba produžavaju."
      }
    ],
    nextLessonId: 3,
    summary:
      "Madd je produžavanje glasa na samoglasniku. Tri slova madda su alif, waw i ya. Madd tabii (prirodni) traje 2 harakate i najčešći je. Zelena boja u aplikaciji označava mjesta gdje se primjenjuje mad."
  },
  {
    id: 3,
    slug: "ghunnah-nazalni-zvuk",
    title: "Ghunnah — nazalni zvuk",
    subtitle:
      "Prepoznaj i uvježbaj nazalni (nosni) zvuk na nunu i mimu.",
    ruleType: "ghunnah",
    color: "text-rose-600 dark:text-rose-400",
    colorHex: "#E11D48",
    estimatedMinutes: 8,
    prerequisite: "Lekcije 1–2",
    sections: {
      introduction: [
        "Jesi li ikada primijetio/la kako zvuči glas kada imaš blagu prehladu i govoriš kroz nos? Taj nazalni, rezonantni zvuk — koji dolazi iz nosne šupljine — vrlo je sličan onome što u tedžvidu zovemo ghunnah (غُنَّة).",
        "Ghunnah je melodičan, nazalni zvuk koji se proizvodi kroz nos (ne kroz usta!). On je jedna od najprepoznatljivijih osobina kur'anskog učenja."
      ],
      definition: [
        "Ghunnah se pojavljuje na dva slova: nun (ن) i mim (م). Ali ne uvijek — samo kada imaju tašdid (نّ ili مّ), kod idghama sa ghunnah, ili kod ikhfa-e."
      ],
      whenItOccurs: [
        "Nun/Mim sa tašdidom: ghunnah traje pune 2 harakate, uvijek prisutna.",
        "Idgham sa ghunnah: kada nun sa sukunom ili tenvin dođe prije slova ya, nun, mim ili waw (zapamti: يَنْمُو) — nun se utapa u sljedeće slovo uz nazalni zvuk.",
        "Kod ikhfa-e: ghunnah je također prisutna u blažem obliku, jer se nun djelimično skriva."
      ],
      howToProduce: [
        "Zatvori usta potpuno.",
        "Pokušaj izgovoriti \"mmmm\" kroz nos.",
        "Osjeti vibraciju u nosu — to je ghunnah!",
        "Sada probaj \"nnnn\" kroz nos — ista vibracija.",
        "Taj zvuk treba trajati 2 harakate (otprilike jedna sekunda normalnog, mirnog disanja)."
      ],
      examples: [
        {
          arabic: "إِنَّ",
          transliteration: "inna",
          translation:
            "Zaista — nun sa tašdidom proizvodi jaku ghunnah na početku riječi.",
          rule: "Ghunnah musaddadah (2 harakate)"
        },
        {
          arabic: "ثُمَّ",
          transliteration: "thumma",
          translation:
            "Zatim — mim sa tašdidom, jasna i duga ghunnah.",
          rule: "Ghunnah musaddadah (2 harakate)"
        },
        {
          arabic: "مِنْ وَلِيٍّ",
          transliteration: "miw-waliyy",
          translation:
            "Od zaštitnika — nun se utapa u waw uz ghunnah (idgham sa ghunnom).",
          rule: "Idgham sa ghunnom (2 harakate)"
        },
        {
          arabic: "مِنْ رَبِّهِمْ",
          transliteration: "mir-rabbihim",
          translation:
            "Od Gospodara njihovog — primjer idghama bez ghunnaha na ra i lam, za kontrast.",
          rule: "Idgham bila ghunnah (bez nazalnog zvuka)"
        }
      ],
      commonMistakes: [
        "Izgovaranje ghunnaha kroz usta umjesto kroz nos — stavi prst na nos da provjeriš vibraciju.",
        "Prekratka ghunnah — mora trajati pune 2 harakate.",
        "Izgovaranje nuna jasno umjesto utapanja kod idghama sa ghunnom."
      ],
      tip: {
        title: "Test nosnog zvuka",
        text: "Stavi prst na nos dok izgovaraš ghunnah — trebao/la bi osjetiti vibraciju. Ako vibracije nema, zvuk dolazi iz usta a ne iz nosa."
      }
    },
    quiz: [
      {
        question: "Na koja dva slova se pojavljuje ghunnah?",
        options: ["Ba i Ta", "Nun i Mim", "Alif i Waw", "Ha i Kha"],
        correctIndex: 1,
        explanation:
          "Ghunnah se vezuje isključivo za nun (ن) i mim (م)."
      },
      {
        question: "Koliko traje ghunnah sa tašdidom?",
        options: ["1 harakat", "2 harakate", "3 harakate", "4 harakate"],
        correctIndex: 1,
        explanation:
          "Ghunnah sa tašdidom treba trajati 2 harakate — ni kraće ni duže."
      },
      {
        question: "Šta znači idgham?",
        options: [
          "Produžavanje zvuka",
          "Utapanje jednog slova u drugo",
          "Skakanje zvuka",
          "Zaustavljanje"
        ],
        correctIndex: 1,
        explanation:
          "Idgham znači utapanje — jedno slovo se spaja i stapa u sljedeće."
      }
    ],
    nextLessonId: 4,
    summary:
      "Ghunnah je nazalni zvuk na slovima nun i mim. Najjača je sa tašdidom (2 harakate). Kod idghama, nun se utapa u sljedeće slovo (ya, nun, mim, waw) uz ghunnah. Crvena/ružičasta boja u aplikaciji označava ghunnah."
  },
  {
    id: 4,
    slug: "ikhfa-skriveni-zvuk",
    title: "Ikhfa — skriveni nazalni zvuk",
    subtitle:
      "Pravilo kada se nun sa sukunom ili tenvinom izgovara skriveno, između jasnog i potpunog idghama.",
    ruleType: "ikhfa",
    color: "text-sky-600 dark:text-sky-400",
    colorHex: "#0284C7",
    estimatedMinutes: 8,
    prerequisite: "Lekcije 1–3",
    sections: {
      introduction: [
        "U prethodnoj lekciji naučili smo da se nun ponekad potpuno \"utapa\" u sljedeće slovo (idgham). Ali šta kada se nun nađe ispred slova u koje se ne može potpuno utopiti, a ne može ni ostati potpuno jasan? Odgovor je — ikhfa (إِخْفَاء).",
        "Ikhfa doslovno znači \"skrivanje\". Nun sa sukunom ili tenvin se ne izgovara potpuno jasno, ali se ne utapa potpuno. Umjesto toga, nun postaje \"skriven\" — čuješ blagi nazalni zvuk koji se lagano preliva u sljedeće slovo."
      ],
      definition: [
        "Ikhfa nastaje kada nun sa sukunom (نْ) ili tenvin dođu ispred jednog od 15 slova: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك. To su sva slova osim onih za idgham, hamze, ha, ayn, ğayn i ba."
      ],
      whenItOccurs: [
        "Zapamti pomoćnu rečenicu gdje svako početno slovo predstavlja jedno od ikhfa slova: صِفْ ذَا ثَنَا كَمْ جَادَ شَخْصٌ قَدْ سَمَا دُمْ طَيِّبًا زِدْ فِي تُقًى ضَعْ ظَالِمًا."
      ],
      howToProduce: [
        "Pripremi jezik za izgovor SLJEDEĆEG slova (ne nuna!).",
        "Pusti nazalni zvuk (ghunnah) kroz nos — 2 harakate.",
        "Lagano pređi u sljedeće slovo bez potpunog izgovora \"n\".",
        "Pazi da se nun ne izgubi potpuno kao kod idghama — čuje se njegov trag."
      ],
      examples: [
        {
          arabic: "مِنْ قَبْلِ",
          transliteration: "min qabli",
          translation:
            "Prije — nun ispred qaf, nun je skriven uz nazalni zvuk koji prelazi u qaf.",
          rule: "Ikhfa (2 harakate ghunnah)"
        },
        {
          arabic: "أَنْتُمْ",
          transliteration: "antum",
          translation:
            "Vi — nun ispred ta, jezik se priprema za ta dok se ghunnah čuje kroz nos.",
          rule: "Ikhfa (2 harakate ghunnah)"
        },
        {
          arabic: "يُنْفِقُونَ",
          transliteration: "yunfiqūna",
          translation:
            "Oni troše — nun ispred fa, ikhfa unutar riječi.",
          rule: "Ikhfa (2 harakate ghunnah)"
        },
        {
          arabic: "مَنْ ذَا",
          transliteration: "man dhā",
          translation:
            "Ko je taj — ikhfa između dvije riječi (nun ispred ذ).",
          rule: "Ikhfa (2 harakate ghunnah)"
        }
      ],
      commonMistakes: [
        "Izgovaranje nuna potpuno jasno — kod ikhfa-e nun mora biti \"skriven\".",
        "Potpuno utapanje nuna — to je idgham, ne ikhfa. Kod ikhfa-e čuješ nagovještaj nuna.",
        "Izostavljanje ghunnaha — ikhfa uvijek ima nazalni zvuk u trajanju od 2 harakate."
      ],
      tip: {
        title: "Ikhfa vs. idgham analogija",
        text: "Idgham je kao kap vode u rijeci — potpuno se stopi. Ikhfa je kao kap boje u čaši vode — vidiš trag, ali nije čista boja. Nun je \"tu\" ali skriven."
      }
    },
    quiz: [
      {
        question: "Šta znači ikhfa?",
        options: ["Produžavanje", "Skrivanje", "Utapanje", "Odskok"],
        correctIndex: 1,
        explanation:
          "Ikhfa znači skrivanje — nun nije potpuno jasan ali ni potpuno utopljen."
      },
      {
        question: "Koliko slova izaziva ikhfa?",
        options: ["4", "6", "10", "15"],
        correctIndex: 3,
        explanation:
          "Tačno 15 slova izaziva ikhfa — zato se kaže da je to najčešće složenije pravilo."
      },
      {
        question: "U riječi أَنْتُمْ, koji tip pravila se primjenjuje na nun?",
        options: ["Idgham", "Ikhfa", "Iqlab", "Izhar"],
        correctIndex: 1,
        explanation:
          "Nun sa sukunom ispred slova ta spada u ikhfa — nun se skriva uz ghunnah."
      }
    ],
    nextLessonId: 5,
    summary:
      "Ikhfa je skrivanje nuna sa sukunom ispred 15 slova. Nun se ne izgovara jasno ali ni ne utapa potpuno — čuješ blagi nazalni zvuk (2 harakate) koji prelazi u sljedeće slovo. Plava boja u aplikaciji označava ikhfa."
  },
  {
    id: 5,
    slug: "qalqalah-odskok",
    title: "Qalqalah — odskok zvuka",
    subtitle:
      "Pravilo drhtaja / odskoka glasa na određenim sukunisanim slovima.",
    ruleType: "qalqalah",
    color: "text-amber-600 dark:text-amber-400",
    colorHex: "#D97706",
    estimatedMinutes: 7,
    prerequisite: "Lekcije 1–4",
    sections: {
      introduction: [
        "Zamisli da stisneš gumenu lopticu u ruci i pustiš je — ona odskoči. Upravo to se dešava sa zvukom u qalqalah (قَلْقَلَة): slovo se izgovori, a zatim zvuk lagano \"odskoči\" od mjesta izgovora.",
        "Qalqalah doslovno znači \"drhtanje\" ili \"potresanje\" — i kad jednom naučiš prepoznati ovaj zvuk, čut ćeš ga svugdje u Kur'anu. On razbija monotoniju i dodaje živost recitaciji."
      ],
      definition: [
        "Samo 5 slova imaju qalqalah. Zapamti frazu: قُطْبُ جَدٍ (Qutbu Jad) — ق (Qaf), ط (Ta), ب (Ba), ج (Jim), د (Dal)."
      ],
      whenItOccurs: [
        "Qalqalah se primjenjuje SAMO kada je jedno od 5 slova \"mirno\" — ima sukun ili je na mjestu vakfa (stajanja). Ako slovo ima vokal, nema qalqale.",
        "Qalqalah sughra (mala): slovo sa sukunom unutar riječi — blaži odskok.",
        "Qalqalah kubra (velika): slovo je zadnje na kojem staješ (kraj ajeta) — jači odskok."
      ],
      howToProduce: [
        "Izgovori slovo sa sukunom (npr. \"ab\").",
        "Na kraju izgovora, pusti zvuk da lagano \"odskoči\" — kratki impuls, bez dodavanja vokala.",
        "Zvuk NIJE \"aba\" nego kratko, energično \"ab\" sa blagim odskokom.",
        "Vježbaj sa svakim od 5 slova: aq, at, ab, aj, ad."
      ],
      examples: [
        {
          arabic: "أَحَدْ",
          transliteration: "aḥad",
          translation:
            "Jedan — dal na kraju ajeta, snažan odskok pri vakfu.",
          rule: "Qalqalah kubra na د",
          surahRef: "Al-Ikhlas 112:1"
        },
        {
          arabic: "ٱلْفَلَقِ",
          transliteration: "al-falaq",
          translation:
            "Svitanje — qaf na kraju sure, čuje se jasno odskočni zvuk.",
          rule: "Qalqalah kubra na ق",
          surahRef: "Al-Falaq 113:1"
        },
        {
          arabic: "يَجْعَلْ",
          transliteration: "yajʿal",
          translation:
            "Učini — jim sa sukunom u sredini riječi, blaži odskok.",
          rule: "Qalqalah sughra na ج"
        },
        {
          arabic: "مَسَدٍ",
          transliteration: "masad",
          translation:
            "Vlakno palme — dal na kraju sure, jaka qalqalah pri stajanju.",
          rule: "Qalqalah kubra na د",
          surahRef: "Al-Masad 111:5"
        },
        {
          arabic: "يَخْلُقْ",
          transliteration: "yakhluq",
          translation:
            "Stvara — qaf sa sukunom na kraju riječi.",
          rule: "Qalqalah kubra na ق"
        }
      ],
      commonMistakes: [
        "Dodavanje vokala: \"ab\" postaje \"aba\" — qalqalah NIJE dodavanje vokala.",
        "Preslabi odskok: slovo zvuči \"mrtvo\" bez energije.",
        "Qalqalah na slovu koje ima vokal — pravilo važi samo kada je slovo mirno (sukun ili vakf)."
      ],
      tip: {
        title: "Praktičan test",
        text: "Izgovori \"ab\" sa čistim završetkom, pa pusti zvuk da lagano odskoči kao loptica — \"ab(-)\". Taj mali impuls je ispravna qalqalah!"
      }
    },
    quiz: [
      {
        question: "Koja su slova qalqalah?",
        options: ["ق ط ب ج د", "ن م و ي", "ا و ي", "ت ث ج"],
        correctIndex: 0,
        explanation:
          "Pet slova su ق ط ب ج د — lako ih je zapamtiti kroz izraz قُطْبُ جَدٍ (Qutbu Jad)."
      },
      {
        question: "Kada se primjenjuje qalqalah?",
        options: [
          "Uvijek na 5 posebnih slova",
          "Samo sa vokalom",
          "Samo sa sukunom ili na vakfu",
          "Samo na početku riječi"
        ],
        correctIndex: 2,
        explanation:
          "Qalqalah je samo na \"mirnom\" slovu — kada ima sukun ili kada staneš na to slovo na kraju riječi/ajeta."
      },
      {
        question: "Šta razlikuje qalqalah sughru od kubre?",
        options: [
          "Sughra je glasnija",
          "Kubra je na kraju (jači odskok), sughra u sredini riječi (blaži)",
          "Nema razlike",
          "Sughra je samo na slovu ق"
        ],
        correctIndex: 1,
        explanation:
          "Qalqalah kubra je kada staneš na slovu — odskok je jači. Sughra je unutar riječi i blažeg je intenziteta."
      }
    ],
    nextLessonId: null,
    summary:
      "Qalqalah je odskok zvuka na 5 slova: ق ط ب ج د (Qutbu Jad). Primjenjuje se samo na sukun ili vakf. Kubra (na kraju) je jača, sughra (u sredini) blaža. Narandžasta boja u aplikaciji označava qalqalah."
  }
];

// --- Public API ---

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

