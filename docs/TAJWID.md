# Tajwid u aplikaciji

## Kako je zamisljeno

1. **Postavke -> Prikaz -> "Tedžvid boje"** (i čip "Tedžvid boje" u traci čitača)  
   Uključuje/isključuje obojenje arapskog teksta prema pravilima izgovora. Boje su kao u tedžvidskom mushafu (Dar al-Maarifa), po onome šta glas radi:
   - crveno: produži (medd, `mad`);
   - zeleno: kroz nos (gunne `ghunnah` i ihfa `ikhfa`, ista zelena);
   - plavo: odskok (kalkala, `qalqalah`).

   Normalan tekst (`normal`) nema boju. Boje dolaze samo iz tokena `--tj-*` u `src/app/globals.css` (jedna vrijednost po temi), preko klasa u `src/lib/quran/tajwidStyles.ts`; `tajwidColorSource.test.ts` pada ako ih neki drugi fajl imenuje. Legenda ("Šta znače boje", `TajwidLegend.tsx`) ima tri reda, a nazivi pravila su linkovi na lekcije: to je put do pravila za tastaturu i čitač ekrana.

   Dodir na obojeni harf otvara traku s nazivom pravila, jednom rečenicom i linkom na lekciju (`TajwidRuleBar.tsx`, jedna u `AppShell`). Obojeni dijelovi nose `data-tj-rule`, a jedan klik po ajetu ga čita (`tajwidRuleTap.ts`); u modu riječ po riječ dodir i premota učenje na riječ i otvori traku. Harfovi nisu u Tab redu.

   Postavka "Tedžvid" ima tri izbora: Isključeno / Boje / Boje i linije. Uz linije svako pravilo dobija i liniju ispod harfa: medd puna, gunne tačkice, ihfa crtice, kalkala dvostruka (valovita se ispod jednog harfa ne vidi u WebKitu). Linije uključuje atribut `data-tajwid-lines` na `<html>` (`ThemeProvider`, `themeInitScript`).

2. **Podaci po ajetu**  
   Za svaki ajet u podacima postoji niz `tajwidSegments`:  
   `[{ "text": "…", "rule": "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah" }, …]`.  
   Aplikacija prikazuje svaki segment u boji koja odgovara `rule` samo ako je uključeno "Tedžvid boje".

3. **Audio**  
   Reprodukcija audio zapisa **nije** povezana s prikazom tajwid pravila. Audio samo pušta ajet; nema „highlighta” trenutne riječi tijekom puštanja. Tajwid boje su statične – ovise isključivo o tome što je u `tajwidSegments` za taj ajet.

## Odakle dolaze `tajwidSegments`

- Segmenti se generišu unaprijed (`scripts/generate-ayahs-json.ts`) i stoje u `src/data/ayahs/*.json` za svih 114 sura; ništa se ne preuzima u runtime-u.
- Izvor pravila su anotacije [cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed) (licenca CC BY 4.0). Njihovi indeksi važe samo za cpfair-ovu kopiju Tanzil teksta iz 2017 (`quran-uthmani.txt`, link u cpfair README-u), a aplikacija prikazuje Quran.com `text_uthmani`. Tekstovi se razlikuju (tatweel ispred natpisanog elifa, znakovi pauze kao zasebne riječi, zapis hemze, Bismilla na početku prvog ajeta u cpfair tekstu, U+06E6 vs U+06E7), pa se indeksi prenose preko poravnanja po kodnim tačkama (`src/lib/quran/tajwidAlignment.ts`), a ne direktno.
- Generator pada glasno ako cpfair anotacije ne odgovaraju baznom tekstu ili ako neka boja padne samo na harakat/tatweel. Test `src/lib/quran/__tests__/tajwidSegmentsData.test.ts` provjerava isto nad podacima u repou.
- Boje se četiri pravila (u tri boje, jer ihfa ima zelenu gunne): mad (`madd_*`), ghunnah (`ghunnah`, `idghaam_ghunnah`, `idghaam_shafawi`), ikhfa (`ikhfa`, `ikhfa_shafawi`, `iqlab`), qalqalah. Iqlab i šefevi idgham nemaju vlastitu boju: uče se uz nazalni zvuk, pa dijele boju ikhfe odnosno ghunne (`mapCpfairRule` u `tajwidAlignment.ts`). Ostala cpfair pravila (`idghaam_no_ghunnah`, `idghaam_mutajanisayn`, `idghaam_mutaqaribayn`, `lam_shamsiyyah`, `hamzat_wasl`, `silent`) se ne boje.

Ponovno računanje samo tajwid segmenata (bez poziva Quran.com API-ja, ostala polja ostaju ista):

```text
npx tsx scripts/generate-ayahs-json.ts --tajwid-only
```

## Lekcije

Tekst pet lekcija je u `src/data/tajwid-lessons/index.ts` (pregledan 2026-11). Primjer u lekciji ne sadrži arapski tekst ni transkripciju: to je referenca na suru, ajet i raspon riječi (`LessonExampleRef` u `src/lib/quran/lessonExample.ts`), a stranica lekcije uzima tekst i tedžvid segmente iz `src/data/ayahs`. Test `src/data/tajwid-lessons/__tests__/lessons.test.ts` provjerava svaki primjer i svaku transkripciju citiranu uz oznaku ajeta, npr. "Lā eʻbudu" (109:2) u tekstu lekcije.
