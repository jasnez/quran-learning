# Quran Learning – testiranje i poznati problemi

Pregled stanja nakon testiranja [https://quran-learning-sigma.vercel.app/](https://quran-learning-sigma.vercel.app/).

---

## Popravljeno u kodu

### 1. **Audio se nije čuo (Play bez zvuka)** — RIJEŠENO
- **Uzrok:** Audio URL-i u podacima su relativne putanje (`/audio/mishary-alafasy/001001.mp3`). Na Vercelu ne postoji folder `public/audio/`, pa zahtjevi vraćaju **404** i audio se nikad ne učitava.
- **Rješenje:** Uvedena je funkcija `getResolvedAudioUrl()` koja relativne putanje mapira na javni CDN [EveryAyah](https://everyayah.com/data/Alafasy_128kbps/) (npr. `001001.mp3` → `https://everyayah.com/data/Alafasy_128kbps/001001.mp3`). Player sada učitava tu URL i reprodukcija bi trebala raditi nakon novog deploya.
- **Dodatno:** Na grešku pri `play()` (npr. mreža, CORS) poziva se `pause()` da se UI ne zaglavi u stanju "pušta".

---

## Što još ne radi / ograničenja

### 2. **Samo 4 sure imaju pun sadržaj (tekst + audio)** — RIJEŠENO
- **Sve 114 sura** sada imaju pun sadržaj: za sure **1, 112, 113, 114** koriste se lokalni JSON fajlovi; za **sure 2–111** ajati se učitavaju s **Quran.com API-ja** (arabski tekst, transliteracija, bosanski prijevod Besim Korkut), a audio URL se gradi u istom formatu i preslikava na EveryAyah CDN.
- Stranice `/surah/[surahId]` i `/learn/[surahId]` pri prvoj posjeti sure bez lokalnog fajla pozivaju `fetchVersesByChapter(surahNumber)`; odgovor se cacheira 24 h (`revalidate: 86400`).

### 3. **Izbor recitera u Postavkama ne mijenja audio**
- U Postavkama postoji izbor recitera (Mishary Alafasy, Abdul Basit Abdus Samad).
- Audio URL-i u podacima i u `getResolvedAudioUrl` fiksirani su na **Mishary Alafasy** (EveryAyah Alafasy). Odabir drugog recitera trenutno ne utječe na koji se audio pušta.
- Za podršku više recitera treba: ili više CDN base URL-ova po reciteru, ili API koji vraća URL po reciteru i ajetu.

### 4. **Bookmark dugme nema funkcionalnost**
- Na svakom ajetu (kartica) postoji dugme "Bookmark" (ikona bookmarka). Trenutno nema `onClick` logike ni spremanja bookmarka (npr. u `localStorage` ili store). Dugme je samo vizualno.

### 5. **Learn mode samo za sure s podacima**
- `/learn/[surahId]` radi samo ako sura ima učitane ajate (tj. za sure 1, 112, 113, 114). Za ostale sure stranica može biti prazna ili bez smislenog sadržaja, ovisno o implementaciji.

### 6. **Mogući CORS / blokada zvuka**
- Ako EveryAyah promijeni CORS zaglavlja ili blokira zahtjeve s drugih domena, audio na produkciji opet neće raditi. Tada bi trebalo: ili hostati MP3 u vlastitom `public/audio/`, ili koristiti proxy (npr. Next.js rewrite) prema CDN-u.

---

## Sažetak brojeva

| # | Problem | Status |
|---|--------|--------|
| 1 | Audio se nije čuo (Play) | Riješeno (CDN + error handling) |
| 2 | Samo 4 sure s punim sadržajem | Riješeno (API za sure 2–111, svi ajati + audio) |
| 3 | Reciter u postavkama ne mijenja audio | Nije implementirano |
| 4 | Bookmark bez funkcionalnosti | Nije implementirano |
| 5 | Learn mode samo za sure s podacima | Očekivano ponašanje |
| 6 | CORS / dostupnost CDN-a | Mogući rizik u budućnosti |

---

## Što ručno provjeriti nakon deploya

1. **Audio:** Otvori [Surah 1](https://quran-learning-sigma.vercel.app/surah/1), klikni "Pusti audio" na bilo kojem ajetu – trebao bi se čuti zvuk.
2. **Postavke:** Promjena teme (svijetla/tamna/sepia), veličine fonta i ostalih opcija – provjeri da se vrijednosti zadrže nakon osvježavanja stranice (localStorage).
3. **Rute:** `/`, `/surahs`, `/surah/1`, `/learn/1` – sve bi trebale učitati bez crasha; za sure bez podataka očekivana je poruka o nedostupnim podacima.
