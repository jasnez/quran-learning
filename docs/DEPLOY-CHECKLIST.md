# Checklist za deploy – sve korake u redu

Prije nego kreneš: u terminalu u folderu `quran-learning` pokreni **`npm run deploy:check`** (test + build). Ako nešto padne, popravi prije deploya.

---

## Već imaš repo na GitHubu i projekt na Vercelu?

**Ne dodaješ ništa novo.** Koristiš postojeći repo `quran-learning` i postojeći Vercel projekt (npr. production: `quran-learning-sigma.vercel.app`).

- **Korak 1** – samo ako imaš lokalne promjene koje još nisu na GitHubu: `git add` / `commit` / `push`.
- **Korak 2** – **preskoči** (projekt na Vercelu već postoji i već je povezan na repo).
- **Korak 3** – u **postojećem** Vercel projektu: **Settings** → **Environment Variables** → dodaj tri varijable (ili provjeri jesu li već tamo).
- **Korak 4** – u istom projektu: **Redeploy** (da se build napravi s novim env varijablama).
- **Korak 5** – u Supabaseu u CORS dodaj **tvoju production URL** (npr. `https://quran-learning-sigma.vercel.app`).
- **Korak 6** – provjeri na toj URL da sve radi (uključujući audio).

---

## Korak 1: Git – push na GitHub

```bash
cd c:\Users\Jasne\Quran-learning\quran-learning
git add .
git status
git commit -m "chore: prepare for production deploy"
git push origin main
```

(Ako koristiš drugi remote ili branch, prilagodi.)

---

## Korak 2: Vercel – novi projekt

1. Otvori **[vercel.com](https://vercel.com)** → ulogiraj se.
2. **Add New** → **Project**.
3. **Import** repozitorij (npr. `Quran-learning`).
4. **Root Directory:** ako je cijeli repo samo ovaj app, ostavi **prazno**. Ako je app u podfolderu `quran-learning`, klikni **Edit** i stavi **`quran-learning`**.
5. **Build Command** i **Output Directory** ostavi default (Vercel koristi `vercel.json`).
6. **Ne klikaj Deploy** – prvo dodaj env varijable (Korak 3).

---

## Korak 3: Vercel – Environment Variables

U projektu: **Settings** → **Environment Variables**. Za **Production** (i po želji **Preview**) dodaj tri varijable:

**1. NEXT_PUBLIC_SUPABASE_URL**  
Key: `NEXT_PUBLIC_SUPABASE_URL`  
Value (kopiraj):
```
https://xivwzevkvpjwtgjvujyr.supabase.co
```

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**  
Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
Value: otvori [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/xivwzevkvpjwtgjvujyr/settings/api) i kopiraj **anon public** key (počinje s `eyJ...`).

**3. NEXT_PUBLIC_AUDIO_CDN_URL**  
Key: `NEXT_PUBLIC_AUDIO_CDN_URL`  
Value (kopiraj, bez razmaka na kraju):
```
https://xivwzevkvpjwtgjvujyr.supabase.co/storage/v1/object/public/audio
```

Klikni **Save**.

---

## Korak 4: Vercel – Deploy

1. **Deployments** → **Redeploy** (ili prvi put **Deploy**).
2. Sačekaj da se build završi.
3. Otvori **Production URL** (npr. `https://quran-learning-xxx.vercel.app`) i zapiši je – trebat će za CORS u sljedećem koraku.

---

## Korak 5: Supabase – CORS (za audio s produkcije)

**Ako u Supabase dashboardu nema CORS / Allowed origins** (što je ustanovljeno):

1. **Prvo probaj bez ikakvih promjena**  
   Na **https://quran-learning-sigma.vercel.app** otvori Suru 1 i klikni Play. Ako se zvuk čuje, gotovo – CORS ti ne treba.

2. **Ako u konzoli (F12) vidiš CORS grešku**  
   U Vercelu u **Environment Variables** dodaj:
   - Key: `NEXT_PUBLIC_AUDIO_VIA_PROXY`
   - Value: `1`  
   Zatim **Redeploy**. Audio će ići preko naše API rute (`/api/audio`), ista domena – CORS u Supabaseu nije potreban. Detalji: **docs/CORS-AUDIO.md**.

**Ako ipak vidiš CORS u Supabaseu** (Settings → API):

1. Otvori **[Supabase Dashboard](https://supabase.com/dashboard)** → svoj projekt **Quran-learning**.
2. **Settings** (zupčanik) → **API** (ili **Configuration**).
3. Pronađi **CORS** / **Allowed origins**.
4. Dodaj (ili dopuni):
   - `http://localhost:3000`
   - **Produkcijsku URL** – tvoja Vercel domena, npr. **`https://quran-learning-sigma.vercel.app`** (bez trailing slash).
5. **Save**.

Ako ne vidiš CORS polje, probaj pustiti audio na produkciji; ako radi, ne moraš ništa mijenjati. Ako u browseru (F12 → Console) vidiš CORS grešku, vrati se ovdje i provjeri da je točna production URL upisana.

---

## Korak 6: Provjera na produkciji

Na production URL-u:

- [ ] Početna stranica se učitava, navigacija radi.
- [ ] **Sura 1** (Al-Fatiha) → **Pusti cijelu suru** ili **Play** na ajetu – čuje se zvuk, na dnu se vidi audio player (play/pause, prethodni/sljedeći, traka).
- [ ] Ako nema zvuka: F12 → **Console** – provjeri CORS/404 i ponovno Korak 5 (CORS) i da su sve tri env varijable točno u Vercelu (Korak 3).

---

## Sažetak – što trebaš ručno

| Gdje | Što |
|------|-----|
| Git | Samo ako imaš nove promjene: `git add` / `commit` / `push` (Korak 1). |
| Vercel | **Postojeći** projekt: dodaj 3 env varijable (Korak 3), pa **Redeploy** (Korak 4). |
| Supabase | CORS – dopusti origin `https://quran-learning-sigma.vercel.app` (Korak 5). |

Novi repo ili novi Vercel projekt **ne trebaju** – sve radi u onome što već imaš.
