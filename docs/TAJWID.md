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

## Zašto na produkciji možda ne vidite obojena pravila

- **Lokalni JSON** (sure 1, 112, 113, 114): u njima su ručno dodani `tajwidSegments` s pravilima (Al-Fatiha i kratke sure imaju mad, ghunnah, ikhfa, qalqalah gdje je primjenjivo).
- **API** (sure 2–111): od uvođenja integracije s [cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed) anotacije se učitavaju s njihovog JSON-a (indeksi po versu) i mapiraju u `tajwidSegments` (mad, ghunnah, ikhfa, qalqalah). Prvi učitana sura 2–111 na serveru povuče taj JSON (~5,5 MB) i cacheira ga; nakon toga sve sure 2–111 imaju obojene segmente kada je „Tajwid boje” uključeno.
- Ako tekst ajeta s API-ja (Quran.com) ne odgovara 1:1 tekstu za koji su računati cpfair indeksi (Tanzil Uthmani), pojedini segmenti mogu biti pomaknuti ili prazni; u tom slučaju fallback je jedan segment „normal”.
