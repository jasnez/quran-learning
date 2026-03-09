# Deploy na produkciju (Vercel) + env + CORS

Koraci za deploy Quran Learning aplikacije na Vercel s ispravnim env varijablama i CORS-om za audio.

**Koristi jedan dokument:** **[docs/DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)** – redom Korak 1–6 s copy-paste vrijednostima. Ovaj dokument je detaljnija referenca.

---

## 1. Spremi projekt za deploy

Sljedeće je već urađeno u projektu:

- **Build prolazi:** `npm run build` uspješno se izvršava (Next.js 16, Turbopack za build).
- **Vercel konfiguracija:** u korijenu je `vercel.json` s `buildCommand` i `installCommand` – Vercel će ih koristiti pri deployu.
- **Env nije u repou:** `.gitignore` sadrži `.env*` (osim `.env.local.example`), pa se tajni ključevi ne committaju.
- **Root za deploy:** ako repo ima samo ovaj app, ostavi **Root Directory** prazan. Ako je app u podfolderu (npr. `quran-learning/` unutar repa), u Vercelu za **Root Directory** stavi `quran-learning`.

Prije deploya provjeri da je repozitorij na GitHubu (ili GitLab/Bitbucket) i da su promjene pushane.

---

## 2. Vercel: novi projekt

1. Otvori [vercel.com](https://vercel.com) i ulogiraj se.
2. **Add New** → **Project**.
3. Importuj repo (npr. `Quran-learning`).
4. **Root Directory:** ako je app u podfolderu, stavi `quran-learning` (ili ostavi prazno ako je root repo).
5. **Framework Preset:** Next.js (auto-detektira se).
6. **Build Command:** `npm run build` (default).
7. **Output Directory:** prazno (Next.js default).
8. Ne deployaj još – prvo dodaj env varijable.

---

## 3. Environment variables na Vercelu

U Vercel projektu: **Settings** → **Environment Variables**. Dodaj za **Production** (i po želji Preview):

| Ime | Vrijednost | Napomena |
|-----|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xivwzevkvpjwtgjvujyr.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (tvoj anon key) | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (tvoj service_role key) | **Preporučeno za produkciju:** server-side čitanje zaobilazi RLS; Dashboard → API → service_role |
| `NEXT_PUBLIC_AUDIO_CDN_URL` | `https://xivwzevkvpjwtgjvujyr.supabase.co/storage/v1/object/public/audio` | Bez trailing slash |

**Važno:** Prve tri su potrebne da na produkciji rade podaci (Supabase). Bez `SUPABASE_SERVICE_ROLE_KEY` server koristi anon key i RLS mora dozvoljavati SELECT; ako vidiš „Failed to fetch surahs”, dodaj `SUPABASE_SERVICE_ROLE_KEY` i Redeploy. Bez `NEXT_PUBLIC_AUDIO_CDN_URL` audio ide s everyayah.com fallbacka.

Nakon dodavanja varijabli, **Save** i ponovo pokreni deploy (Deployments → ... → Redeploy).

---

## 4. CORS u Supabaseu (za audio s produkcije)

Da browser s produkcijske domene može učitati audio s Supabase Storagea:

1. Otvori [Supabase Dashboard](https://supabase.com/dashboard) → svoj projekt.
2. **Settings** (zupčanik) → **API** (ili **Configuration**).
3. Pronađi **CORS** / **Allowed origins** (ako postoji u tvom planu).
4. Dodaj:
   - `http://localhost:3000` (za lokalni dev)
   - **Produkcijsku URL**, npr.:
     - `https://tvoj-projekt.vercel.app`
     - ili custom domena: `https://tvoja-domena.com`
5. Spremi.

Ako u dashboardu nema CORS polja, probaj pustiti audio na produkciji – često public Storage URL radi i bez dodatne CORS konfiguracije. Ako u konzoli (F12) vidiš CORS grešku, obrati se Supabase podršci gdje to postaviti za tvoj plan.

---

## 5. Deploy i provjera

1. U Vercelu: **Deploy** (ili **Redeploy** nakon promjene env).
2. Kad se build završi, otvori production URL (npr. `https://quran-learning-xxx.vercel.app`).
3. Provjeri:
   - [ ] Početna stranica i navigacija rade.
   - [ ] Otvori **Sura 1** (Al-Fatiha).
   - [ ] Klikni **Pusti cijelu suru** ili **Play** na ajetu – čuje se zvuk, na dnu se vidi audio player (traka s play/pause, prethodni/sljedeći, progress).
   - [ ] Ako ne čuješ zvuk: F12 → **Console** – ako piše CORS ili 403/404, provjeri CORS u Supabaseu i da je `NEXT_PUBLIC_AUDIO_CDN_URL` točno postavljen na Vercelu.
   - [ ] **Word-by-word highlight:** ako vidiš toggle „Po ajetu / Po riječi” i odabereš „Po riječi”, riječi se highlightaju uz audio. Ako toggle ne postoji, u Supabaseu pokreni SQL iz `supabase/CREATE_WORDS_TABLE.sql`, pa lokalno `npm run seed:words` (s .env.local koji pokazuje na istu Supabase bazu kao produkcija).

---

## 6. Opciono: custom domena

U Vercelu: **Settings** → **Domains** → dodaj svoju domenu i slijedi upute za DNS. Nakon toga u Supabase CORS dodaj i tu domenu (npr. `https://tvoja-domena.com`).

---

## Sažetak env za produkciju

```
NEXT_PUBLIC_SUPABASE_URL=https://xivwzevkvpjwtgjvujyr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-iz-dashboarda>
SUPABASE_SERVICE_ROLE_KEY=<service_role-key-iz-dashboarda>
NEXT_PUBLIC_AUDIO_CDN_URL=https://xivwzevkvpjwtgjvujyr.supabase.co/storage/v1/object/public/audio
```

CORS u Supabaseu: dopusti origin `https://tvoja-vercel-app.vercel.app` (i eventualno custom domenu).
