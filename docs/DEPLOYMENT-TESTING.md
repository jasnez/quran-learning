# Quran Learning – testiranje i poznati problemi

Pregled stanja u odnosu na zahtjeve i testiranje [produkcije](https://quran-learning-sigma.vercel.app/).

---

## Što nije ispravno implementirano na produkciji (pregled)

| # | Što fali / ne radi | Gdje se vidi | Status |
|---|-------------------|--------------|--------|
| 1 | **Recitator u Postavkama** – izbor recitera ne mijenja audio; u UI-u se samo prikazuje „Recitator: Mishary Alafasy”, nema kontrole za promjenu (dropdown/dugmad). Čak i da postoji, `getResolvedAudioUrl` i podaci su fiksirani na Alafasy CDN. | Postavke → Zvuk | Nije implementirano |
| 2 | **Bookmark** – dugme „Bookmark” na svakom ajetu nema `onClick`; ne sprema se ništa u localStorage/store, nema lista bookmarka. | Surah reader, svaka AyahCard | Nije implementirano |
| 3 | **Tajwid boje za sure 2–111** – ajati učitani s Quran.com API-ja imaju prazan `tajwidSegments`, pa se pri uključenim „Tajwid bojama” ništa ne oboji. Samo sura 1 (Al-Fatiha) i lokalne sure 112–114 imaju anotacije. | Surah / Learn, bilo koja sura 2–111, uključi Tajwid boje | Djelomično (samo 1, 112–114) |
| 4 | **Rizik: CORS / CDN** – ako EveryAyah promijeni CORS ili dostupnost, audio opet neće raditi. Nema fallbacka (npr. vlastiti `public/audio/` ili proxy). | Play na bilo kojem ajetu | Mogući rizik |

**Već riješeno (za produkciju):**

- **Audio se nije čuo** – relativni URL-i preslikavaju se na EveryAyah CDN; greška pri `play()` gasi reprodukciju.
- **Samo 4 sure imale pun sadržaj** – sada svih 114 sura: 1, 112–114 iz lokalnih JSON-ova, 2–111 s API-ja (tekst + audio putanja).
- **Learn mode** – radi za sve sure (fallback na `fetchVersesByChapter` ako nema lokalnih ajata).

---

## Detalji po problemu

### 1. Audio se nije čuo (Play bez zvuka) — RIJEŠENO
- **Uzrok:** Audio URL-i u podacima su relativne putanje (`/audio/mishary-alafasy/001001.mp3`). Na Vercelu nema `public/audio/`, pa zahtjevi vraćaju 404.
- **Rješenje:** `getResolvedAudioUrl()` mapira putanje na [EveryAyah CDN](https://everyayah.com/data/Alafasy_128kbps/). Na grešku pri `play()` poziva se `pause()`.

### 2. Samo 4 sure imale pun sadržaj — RIJEŠENO
- Za sure **1, 112, 113, 114** koriste se lokalni JSON-ovi; za **2–111** ajati se učitavaju s Quran.com API-ja (tekst, transliteracija, bosanski prijevod), audio URL se gradi i preslikava na CDN. Learn mode i Surah reader koriste fallback na `fetchVersesByChapter` ako nema lokalnih ajata.

### 3. Recitator u Postavkama ne mijenja audio — NIJE IMPLEMENTIRANO
- U Postavkama sekcija „Zvuk” samo **prikazuje** „Recitator: Mishary Alafasy” (ili `selectedReciterId`). Nema UI elementa (select / dugmad) koji poziva `setReciter()`.
- `getResolvedAudioUrl()` i svi audio URL-i u podacima fiksirani su na Alafasy (EveryAyah). Za više recitera treba: mapiranje reciterId → CDN base URL (ili API) i korištenje tog URL-a u playeru.

### 4. Bookmark bez funkcionalnosti — NIJE IMPLEMENTIRANO
- Na `AyahCard` postoji dugme s `aria-label="Bookmark"` bez `onClick`. Nema storea ni localStorage ključa za bookmarke, nema stranice/panela s listom bookmarka.

### 5. Tajwid boje samo za dio sura — DJELOMIČNO
- **Sura 1:** puni `tajwidSegments` u `001-al-fatiha.json` → boje se prikazuju.
- **Sure 112–114:** lokalni JSON-ovi imaju `tajwidSegments` → boje rade.
- **Sure 2–111:** ajati dolaze s API-ja s `tajwidSegments: []` → pri uključenim „Tajwid bojama” tekst ostaje bez obojenih segmenata. Za punu podršku treba izvor anotacija (npr. Tanzil ili drugi API) i mapiranje u `tajwidSegments` u `fetch-verses` ili u podacima.

### 6. CORS / dostupnost CDN-a — MOGUĆI RIZIK
- Ako EveryAyah promijeni CORS ili ukloni datoteke, audio na produkciji prestaje raditi. Opcije: hostati MP3 u `public/audio/` ili Next.js rewrite prema CDN-u.

---

## Što ručno provjeriti nakon deploya

1. **Audio:** [Surah 1](https://quran-learning-sigma.vercel.app/surah/1) → „Pusti audio” na ajetu – treba se čuti zvuk.
2. **Postavke:** Tema, veličina fonta, transliteracija, prijevod, Tajwid boje, brzina, Ponavljaj/Auto sljedeći – vrijednosti se zadržavaju nakon osvježavanja (localStorage).
3. **Rute:** `/`, `/surahs`, `/surah/1`, `/surah/2`, `/learn/1`, `/learn/2` – učitavaju bez crasha; za sve sure očekivani su podaci (sura 2+ s API-ja pri prvoj posjeti).
4. **Tajwid:** Sura 1, uključi „Tajwid boje” u Postavkama – trebaju se vidjeti obojeni segmenti i „Legenda tajwida” (collapsible). Na suri 2 s uključenim Tajwid bojama tekst ostaje bez boja (očekivano dok API ne šalje anotacije).
