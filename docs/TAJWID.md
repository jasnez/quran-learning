# Tajwid u aplikaciji

## Kako je zamisljeno

1. **Postavke → Prikaz → „Tajwid boje”**  
   Uključuje/isključuje obojenje arapskog teksta prema pravilima izgovora. Kada je uključeno, svaki *segment* teksta može imati jednu od boja: normalan tekst, mad (duljenje), ghunnah, ikhfa, qalqalah (vidi legendu u postavkama).

2. **Podaci po ajetu**  
   Za svaki ajet u podacima postoji niz `tajwidSegments`:  
   `[{ "text": "…", "rule": "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah" }, …]`.  
   Aplikacija prikazuje svaki segment u boji koja odgovara `rule` samo ako je u Postavkama uključeno „Tajwid boje”.

3. **Audio**  
   Reprodukcija audio zapisa **nije** povezana s prikazom tajwid pravila. Audio samo pušta ajet; nema „highlighta” trenutne riječi tijekom puštanja. Tajwid boje su statične – ovise isključivo o tome što je u `tajwidSegments` za taj ajet.

## Odakle dolaze `tajwidSegments`

- Segmenti se generišu unaprijed (`scripts/generate-ayahs-json.ts`) i stoje u `src/data/ayahs/*.json` za svih 114 sura; ništa se ne preuzima u runtime-u.
- Izvor pravila su anotacije [cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed) (licenca CC BY 4.0). Njihovi indeksi važe samo za cpfair-ovu kopiju Tanzil teksta iz 2017 (`quran-uthmani.txt`, link u cpfair README-u), a aplikacija prikazuje Quran.com `text_uthmani`. Tekstovi se razlikuju (tatweel ispred natpisanog elifa, znakovi pauze kao zasebne riječi, zapis hemze, Bismilla na početku prvog ajeta u cpfair tekstu, U+06E6 vs U+06E7), pa se indeksi prenose preko poravnanja po kodnim tačkama (`src/lib/quran/tajwidAlignment.ts`), a ne direktno.
- Generator pada glasno ako cpfair anotacije ne odgovaraju baznom tekstu ili ako neka boja padne samo na harakat/tatweel. Test `src/lib/quran/__tests__/tajwidSegmentsData.test.ts` provjerava isto nad podacima u repou.
- Prikazuju se četiri boje: mad (`madd_*`), ghunnah (`ghunnah`, `idghaam_ghunnah`, `idghaam_shafawi`), ikhfa (`ikhfa`, `ikhfa_shafawi`, `iqlab`), qalqalah. Iqlab i šefevi idgham nemaju vlastitu boju: uče se uz nazalni zvuk, pa dijele boju ikhfe odnosno ghunne (`mapCpfairRule` u `tajwidAlignment.ts`). Ostala cpfair pravila (`idghaam_no_ghunnah`, `idghaam_mutajanisayn`, `idghaam_mutaqaribayn`, `lam_shamsiyyah`, `hamzat_wasl`, `silent`) se ne boje.

Ponovno računanje samo tajwid segmenata (bez poziva Quran.com API-ja, ostala polja ostaju ista):

```text
npx tsx scripts/generate-ayahs-json.ts --tajwid-only
```
