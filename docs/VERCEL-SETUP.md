# Vercel – točne postavke za Quran Learning

Kad deployment ostane na **„Initializing”** ili ne krene, provjeri redom sljedeće. Sve je provjereno za repo **jasnez/quran-learning** (package.json je u rootu repa).

---

## 1. Root Directory

1. Otvori **https://vercel.com** → ulogiraj se.
2. Odaberi projekt **quran-learning** (ili kako god se zove).
3. Gore desno: **Settings**.
4. U lijevom meniju: **General**.
5. Skrolaj do **Root Directory**.
6. **Mora biti prazno** (ili **.**).  
   Ako piše npr. `quran-learning-main`, obriši to i ostavi prazno, pa **Save**.

---

## 2. Framework i Build

1. Isti **Settings** → **General**.
2. **Framework Preset:** treba biti **Next.js** (ako nije, odaberi Next.js).
3. **Build Command:** može ostati prazno (koristi se `vercel.json` / `package.json`: `npm run build`).
4. **Output Directory:** prazno (Next.js default).
5. **Install Command:** prazno (koristi se `npm install`).
6. Ako si nešto promijenio, **Save**.

---

## 3. Node verzija

U repou je u `package.json` postavljeno `"engines": { "node": ">=18" }`.  
Vercel to čita automatski – ne trebaš ništa ručno mijenjati u Vercelu.

---

## 4. Environment Variables (za Auth i Supabase)

1. **Settings** → **Environment Variables**.
2. Za **Production** (i po želji **Preview**) moraju postojati:

   | Name | Value | Gdje uzeti |
   |------|--------|------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xivwzevkvpjwtgjvujyr.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon **public** ključ) | Supabase Dashboard → Settings → API → **anon public** (ne service_role) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role) | Isti API → **service_role** (opcionalno, za server) |
   | `NEXT_PUBLIC_AUDIO_CDN_URL` | `https://xivwzevkvpjwtgjvujyr.supabase.co/storage/v1/object/public/audio` | Bez `/` na kraju |

3. Ako nešto fali, **Add** → odaberi **Key** i **Value**, za **Environment** odaberi **Production** (i **Preview** ako želiš).
4. **Save**.

---

## 5. Novi deployment (Redeploy) s čistim cacheom

1. **Deployments** (gornji meni).
2. Nađi **zadnji** deployment (bilo koji status).
3. Desno od njega: **⋮** (tri točkice).
4. Klikni **Redeploy**.
5. Ako vidiš **„Redeploy with existing build?”** – odaberi **Redeploy** (novi build), **ne** „Use existing build”.
6. Ako postoji opcija **„Clear build cache”** ili **„Clear cache and redeploy”** – uključi je.
7. Potvrdi **Redeploy**.

Sačekaj 1–2 minute. Status bi trebao prijeći s **Initializing** na **Building**, pa **Ready**.

---

## 6. Ako i dalje stoji na Initializing

- **Deployments** → klikni na taj deployment → otvori **Building** / **Logs**.  
  Na dnu loga vidiš zadnju radnju; ako piše greška, pošalji mi tu poruku.
- Probaj **odspojiti repo i ponovo ga spojiti:**  
  **Settings** → **Git** → **Disconnect** → zatim **Connect Git Repository** → odaberi **jasnez/quran-learning** (branch **main**), spremi. Zatim **Deployments** → **Redeploy**.
- Kao zadnja opcija: **novi projekt** – **Add New** → **Project** → Import **jasnez/quran-learning** → postavi **Root Directory** prazno, **Framework** Next.js, dodaj sve env varijable iz tablice gore → **Deploy**.

---

## Sažetak – što mora biti

| Što | Vrijednost |
|-----|------------|
| Root Directory | **prazno** |
| Framework Preset | **Next.js** |
| Branch | **main** |
| Env: NEXT_PUBLIC_SUPABASE_URL | `https://xivwzevkvpjwtgjvujyr.supabase.co` |
| Env: NEXT_PUBLIC_SUPABASE_ANON_KEY | anon **public** ključ iz Supabase |
| Redeploy | Novi build (ne „existing build”), po želji s „Clear cache” |
