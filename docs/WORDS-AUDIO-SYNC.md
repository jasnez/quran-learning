# Word-level data za naprednu audio sinkronizaciju

## Što je dodano

- **`words` tablica** u Supabase – word-level timestampi za svaki ajet
- **API** `GET /api/surahs/[surahNumber]/words` – vraća sve riječi za suru
- **Seed** `npm run seed:words` – učitava Al-Fatiha word podatke (QPC/Quran.com format)

## Koraci za omogućavanje

1. **Kreiraj `words` tablicu u Supabaseu**
   - Otvori [Supabase Dashboard](https://supabase.com/dashboard) → tvoj projekt → **SQL Editor**
   - Zalijepi sadržaj `supabase/migrations/20250308100004_create_words_table.sql` (ili samo words dio iz `supabase/RUN_ME_IN_SQL_EDITOR.sql`)
   - Klikni **Run**

2. **Pokreni seed za Al-Fatiha**
   ```bash
   npm run seed:words
   ```
   (Zahtijeva da je `npm run seed` već pokrenut – surahs i ayahs moraju postojati.)

3. **Provjeri**
   - `npm run verify:schema` – trebao bi proći s `words` tablicom
   - `GET /api/surahs/1/words` – vraća word podatke za Al-Fatihu
