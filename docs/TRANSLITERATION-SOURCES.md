# Izvori za transliteraciju s dijakriticima (HQ)

Pregled dostupnih izvora na internetu za transliteraciju Kur'ana s dijakritičkim znakovima (ā, ī, ū, ḥ, ṣ, ṭ, ṭ, ẓ, itd.) u formatu tipa **"Bismillāhi r-raḥmāni r-raḥīm"**.

---

## Što je provjereno

### 1. **Quran.com API (resource_id 57)**  
- **URL**: `https://api.quran.com/api/v4/verses/by_chapter/{surah}?translations=57`  
- **Rezultat**: Vraća **pojednostavljenu** transliteraciju (npr. "Bismi Allahi arrahmani arraheem"), **bez** makrona i underdot znakova.  
- Isti format koristi i tvoja trenutna baza u koloni `text`.

### 2. **Tanzil.net** (en.transliteration)  
- **URL**: https://tanzil.net/trans/en.transliteration  
- **Format**: Tekst s razmacima između slogova i oznakama tipa " a " za dugačke samoglasnike – **nije** čisti "ā ī ū" format.  
- **risan/quran-json** koristi ovaj izvor: `cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_transliteration.json` – također pojednostavljena verzija ("Bismi Allahi alrrahmani alrraheemi").

### 3. **fawazahmed0/quran-api**  
- **URL**: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/`  
- **Rezultat**: Izdanja s nastavkom `-lad` (Latin with diacritics) postoje za **prijevode** u drugim jezicima (amh, ben, asm, bul, itd.), **ne** za englesku latiničnu transliteraciju.  
- Nema posebnog "edition" tipa za englesku transliteraciju s makronima.

### 4. **aliftype/quran-data**  
- Samo **arapski** tekst u Unicodeu (UTF-8), bez latinične transliteracije.

### 5. **Sacred-texts.com – Unicode Qur'an**  
- Koristi **modificirani IPA** (International Phonetic Alphabet) za transliteraciju, s znakovima poput ḥ.  
- Nije u obliku jednostavnog JSON/API-ja, već HTML stranice po surama.

### 6. **Quran Finder API / ostali API-ji**  
- Nudi "diacritized" **arapski** tekst (harakat), ne latiničnu transliteraciju s ā, ḥ, itd.

---

## Zaključak

**Nema besplatnog, gotovog JSON ili REST API-ja** koji za sve ajete vraća latiničnu transliteraciju u akademijskom stilu (Bismillāhi r-raḥmāni r-raḥīm) spremnu za učitavanje u bazu.

Dostupni besplatni izvori (Quran.com 57, Tanzil, quran-json) koriste **pojednostavljenu** transliteraciju bez makrona i underdot znakova.

---

## Preporučene opcije

### A) Ručno / polu-automatski unos za ključne sure  
- U Supabaseu ručno popuniti `text_hq` za sure koje ti najviše trebaju (npr. Al-Fatiha, Al-Ikhlas, kratke sure).  
- Izvor teksta: bilo koja knjiga ili web stranica koja koristi dijakritičku transliteraciju (npr. neki PDF-ovi ili stranice poput transliteration.org).

### B) Pravila pretvorbe (simplified → HQ)  
- Napraviti mapu zamjena ili skriptu koja iz poznatih uzoraka (npr. "Bismi Allahi" → "Bismillāhi", "arrahmani" → "r-raḥmāni") generira `text_hq` iz postojećeg `text`.  
- Zahtijeva definiranje pravila za sve uobičajene oblike; moguće je raditi postepeno (najčešći izrazi prvo).

### C) Novi izvor ako se pojavi  
- Ako nađeš dataset ili API (npr. GitHub repo, CSV, drugi API) koji ima cijeli Kur'an u željenom formatu, moguće je napisati skriptu koja ga učitava i puni `transliterations.text_hq` u Supabaseu.

---

## Quran411.com – skripta za skrejpiranje

Koristi se skripta **`scripts/fetch-transliteration-quran411.ts`** koja:

1. Skrejpira transliteraciju s quran411.com za sve 114 sura
2. Ažurira `transliterations.text_hq` u Supabaseu
3. Opcionalno pretvara u akademski Unicode s flagom `--unicode`

**Pokretanje:**

```bash
# Bez pretvorbe (Quran411 format: aa, ee, ii, oo)
npx tsx scripts/fetch-transliteration-quran411.ts

# S pretvorbom u akademski Unicode (ā, ī, ū, ḥ, ʿ)
npx tsx scripts/fetch-transliteration-quran411.ts --unicode
```

**Preduvjeti:** migracija `add_transliteration_hq.sql` pokrenuta, `.env.local` s Supabase URL i SUPABASE_SERVICE_ROLE_KEY.

---

## Korak dalje

- Za **brzi rezultat**: ostavi ručno upisanu HQ transliteraciju za ayah 1:1 (i eventualno još nekoliko ajeta), makni "(TEST)" iz teksta u bazi.
- Za **sistematsko rješenje**: pokreni `npx tsx scripts/fetch-transliteration-quran411.ts` (s ili bez `--unicode`).
