import type { QuranicDua, DuaCategory } from "@/types/duas";

/**
 * Kur'anske dove – izvori iz Kur'ana sa tačnom referencom (sura i ajet).
 * Prijevod prema značenju (Besim Korkut, prilagodjeno).
 */
export const QURANIC_DUAS: QuranicDua[] = [
  {
    id: "2:201",
    surahNumber: 2,
    ayahNumber: 201,
    arabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration:
      "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",
    translationBosnian:
      "Gospodaru naš, daj nam u ovom svijetu dobro i na onom svijetu dobro, i sačuvaj nas od kazne vatrom.",
    category: "rabbana",
  },
  {
    id: "3:8",
    surahNumber: 3,
    ayahNumber: 8,
    arabic:
      "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ",
    transliteration:
      "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-Wahhab",
    translationBosnian:
      "Gospodaru naš, ne odvrati srca naša nakon što si nas uputio, i daruj nam od Sebe milost; Ti si Darežljivi.",
    category: "guidance",
  },
  {
    id: "3:191",
    surahNumber: 3,
    ayahNumber: 191,
    arabic:
      "رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ",
    transliteration:
      "Rabbana ma khalaqta hadha batilan subhanaka faqina adhaban-nar",
    translationBosnian:
      "Gospodaru naš, Ti nisi ovo uzalud stvorio. Slava Tebi! Sačuvaj nas od kazne vatrom.",
    category: "rabbana",
  },
  {
    id: "7:23",
    surahNumber: 7,
    ayahNumber: 23,
    arabic:
      "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    transliteration:
      "Rabbana zalamna anfusana wa illam taghfir lana wa tarhamna lanakunanna minal-khasirin",
    translationBosnian:
      "Gospodaru naš, mi smo sami sebi zulum učinili; ako nam ne oprostiš i ne smiluješ nam, bit ćemo među gubitnicima.",
    category: "forgiveness",
  },
  {
    id: "12:101",
    surahNumber: 12,
    ayahNumber: 101,
    arabic:
      "رَبِّ قَدْ آتَيْتَنِي مِنَ الْمُلْكِ وَعَلَّمْتَنِي مِن تَأْوِيلِ الْأَحَادِيثِ",
    transliteration:
      "Rabbi qad ataytani minal-mulki wa allamtani min ta'wilil-ahadith",
    translationBosnian:
      "Gospodaru moj, Ti si mi dao dio vlasti i naučio me tumačenju snova.",
    category: "knowledge",
  },
  {
    id: "20:114",
    surahNumber: 20,
    ayahNumber: 114,
    arabic:
      "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni ilma",
    translationBosnian: "Gospodaru moj, uvećaj mi znanje.",
    category: "knowledge",
  },
  {
    id: "28:24",
    surahNumber: 28,
    ayahNumber: 24,
    arabic:
      "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
    transliteration:
      "Rabbi inni lima anzalta ilayya min khayrin faqir",
    translationBosnian:
      "Gospodaru moj, ja sam u velikoj potrebi za dobrim što mi spustiš.",
    category: "rabbana",
  },
  {
    id: "2:250",
    surahNumber: 2,
    ayahNumber: 250,
    arabic:
      "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    transliteration:
      "Rabbana afrigh alayna sabran wa thabbit aqdamana wansurna alal-qawmil-kafirin",
    translationBosnian:
      "Gospodaru naš, izlij na nas strpljenje, učvrsti noge naše i pomozi nam protiv naroda nevjernika.",
    category: "patience",
  },
  {
    id: "25:74",
    surahNumber: 25,
    ayahNumber: 74,
    arabic:
      "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    transliteration:
      "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin wajalna lil-muttaqina imama",
    translationBosnian:
      "Gospodaru naš, podari nam od supruga naših i potomstva našeg radost oka i učini nas predvodnicima bogobojaznih.",
    category: "family",
  },
  {
    id: "46:15",
    surahNumber: 46,
    ayahNumber: 15,
    arabic:
      "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَصْلِحْ لِي فِي ذُرِّيَّتِي",
    transliteration:
      "Rabbi awzi'ni an ashkura ni'matakallati an'amta alayya wa ala walidayya wa an a'mala salihan tardahu wa aslih li fi dhurriyyati",
    translationBosnian:
      "Gospodaru moj, nadahni me da zahvaljujem na blagodati Tvojoj koju si ukazao meni i roditeljima mojim, i da činim dobro kojim ćeš Ti biti zadovoljan, i učini da mi potomstvo bude dobro.",
    category: "family",
  },
];

const CATEGORIES: DuaCategory[] = [
  "forgiveness",
  "knowledge",
  "guidance",
  "patience",
  "family",
  "rabbana",
];

export function getDuasByCategory(category: DuaCategory): QuranicDua[] {
  return QURANIC_DUAS.filter((d) => d.category === category);
}

export const DUAS_BY_CATEGORY: Record<DuaCategory, QuranicDua[]> =
  Object.fromEntries(
    CATEGORIES.map((cat) => [cat, getDuasByCategory(cat)])
  ) as Record<DuaCategory, QuranicDua[]>;
