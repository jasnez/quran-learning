# Supabase Auth – postavljanje od nule

Ako vidiš **"Invalid API key"** na produkciji (Vercel), slijedi ove korake. Ključno je da **URL i ključ dolaze iz istog Supabase projekta** i da su točno zalijepljeni u Vercel.

---

## 1. Otvori Supabase projekt

1. Idi na [Supabase Dashboard](https://supabase.com/dashboard) i odaberi svoj projekt (ili kreiraj novi).
2. Otvori **Connect** (ikona plugina u sidebaru) ili **Settings** → **API**.

---

## 2. Kopiraj URL i ključeve iz istog projekta

**Project URL** (npr. `https://xxxxx.supabase.co`):

- **Connect** → **URI** ili **Settings** → **API** → **Project URL**
- Kopiraj cijeli URL **bez** `/` na kraju.

**Ključ za Auth (jedan od ovih):**

- **Preporučeno za server (registracija na Vercelu):** **Settings** → **API** → **Project API keys** → **service_role** (označen kao "secret") → Copy.  
  U Vercelu postavi kao **SUPABASE_SERVICE_ROLE_KEY**. Ovaj ključ ne koristi u browseru.

- **Za klijent / legacy:** **anon** (public) key (JWT koji počinje s `eyJ...`).  
  U Vercelu: **NEXT_PUBLIC_SUPABASE_ANON_KEY**.

- **Novi format (ako ga vidiš):** **Publishable** key (počinje s `sb_publishable_...`).  
  U Vercelu: **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**.

Važno: **URL i ključ moraju biti iz istog projekta.** Ako kopiraš URL iz projekta A, a ključ iz projekta B, dobit ćeš "Invalid API key".

---

## 2b. URL konfiguracija (redirect nakon potvrde emaila)

Da bi korisnik nakon klika na link „Confirm your mail” u emailu završio na **stranici za prijavu** (a ne na početnoj):

1. U Supabase Dashboardu otvori **Authentication** → **URL Configuration**.
2. **Site URL** može ostati npr. `https://tvoja-domena.com` (početna aplikacije).
3. U **Redirect URLs** dodaj točan URL callback rute (mora biti u listi dozvoljenih):
   - Lokalno: `http://localhost:3000/auth/callback`
   - Produkcija: `https://tvoja-domena.com/auth/callback` (zamijeni s pravim Vercel URL‑om, npr. `https://quran-learning.vercel.app/auth/callback`).

Aplikacija pri registraciji šalje Supabaseu `emailRedirectTo: .../auth/callback`. Kad korisnik potvrdi email, Supabase ga preusmjeri na tu adresu; aplikacija tamo postavi sesiju i preusmjeri ga na **Prijava** s porukom „Email je potvrđen. Možeš se prijaviti.”

---

## 2c. Prijava putem Google naloga

Da bi gumb **„Prijava putem Google naloga”** na stranici za prijavu radio, treba uključiti Google provider u Supabaseu i kreirati OAuth klijenta u Google Cloudu.

### Korak 1: Google Cloud – OAuth klijent

1. Otvori [Google Cloud Console](https://console.cloud.google.com/) i odaberi projekt (ili kreiraj novi).
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
3. Ako te pita, konfiguriraj **OAuth consent screen** (External, npr. naziv aplikacije, email za podršku). Za test možeš koristiti „Testing” i dodati svoj email kao test korisnika.
4. Kad kreiraš OAuth client ID:
   - Application type: **Web application**.
   - **Authorized redirect URIs** – dodaj **točan** Supabase callback (zamijeni `TVOJ_PROJECT_REF` s referencom tvog Supabase projekta iz URL‑a u Dashboardu):
     - `https://TVOJ_PROJECT_REF.supabase.co/auth/v1/callback`
5. Spremi i kopiraj **Client ID** i **Client Secret**.

### Korak 2: Supabase – uključi Google provider

1. U [Supabase Dashboard](https://supabase.com/dashboard) otvori **Authentication** → **Providers**.
2. Pronađi **Google** i uključi ga (Enable).
3. U polja **Client ID** i **Client Secret** zalijepi vrijednosti iz Google Cloud Consolea.
4. Spremi (Save).

### Korak 3: Redirect URLs u Supabaseu

Nakon Google prijave Supabase preusmjeri korisnika natrag u tvoju aplikaciju. U **Authentication** → **URL Configuration** → **Redirect URLs** moraju biti npr.:

- `http://localhost:3000` (lokalno)
- `https://tvoja-domena.com` ili `https://tvoj-projekt.vercel.app` (produkcija)

Aplikacija trenutno šalje `redirectTo: origin + "/"`, pa korisnik završi na početnoj stranici. Ako želiš da nakon Google prijave ide na `/auth/callback` (kao kod email potvrde), to se može promijeniti u kodu.

### Sažetak

| Gdje | Što |
|------|-----|
| Google Cloud Console | OAuth 2.0 Web client, redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback` |
| Supabase → Auth → Providers → Google | Enable, Client ID, Client Secret |
| Supabase → Auth → URL Configuration | Redirect URLs = tvoj Site URL (npr. localhost i Vercel URL) |

Kad je to postavljeno, gumb „Prijava putem Google naloga” na stranici Prijava radi bez dodatnih env varijabli.

---

## 3. Lokalno (.env.local)

U rootu projekta u `.env.local` stavi (zamijeni vrijednosti):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TVOJ_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon public iz istog projekta
# Za server-side (registracija, baza) – preporučeno:
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # service_role iz istog projekta
```

Ako u Dashboardu vidiš **Publishable** key umjesto anon, možeš koristiti:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Spremi datoteku i restartaj `npm run dev`.

---

## 4. Na Vercelu (produkcija)

1. **Vercel** → tvoj projekt → **Settings** → **Environment Variables**.
2. Za **Production** (i po želji Preview) dodaj ili provjeri:

   | Ime | Vrijednost |
   |-----|------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL (bez `/` na kraju) |
   | `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key iz istog projekta (najpouzdanije za "Kreiraj račun") |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon** public key iz istog projekta (ili koristi Publishable ispod) |
   | ili `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable** key ako ga projekt nudi |

3. **Save**.
4. **Deployments** → **Redeploy** (novi build, ne "Use existing build").  
   Bez Redeploya nove varijable neće biti aktivne.

---

## 5. Ako i dalje vidiš "Invalid API key"

- **Provjeri par URL + ključ:** Otvori Supabase **Settings** → **API**. U jednom prozoru imaš Project URL i sve ključeve. Kopiraj **URL** i **jedan** ključ (npr. **service_role**) iz te iste stranice u Vercel. Nemoj miješati projekte.
- **Novi anon/publishable key:** Ako koristiš anon ili publishable, u **Settings** → **API** provjeri možeš li generirati novi key ili koristiti **Publishable** ako ga imaš.
- **Service role za signup:** Aplikacija za "Kreiraj račun" na serveru koristi **SUPABASE_SERVICE_ROLE_KEY** ako je postavljen. Taj ključ uvijek prolazi za Auth na serveru. Dodaj ga na Vercelu ako ga nema, pa **Redeploy**.

---

## 6. Kako aplikacija koristi ključeve

- **Registracija (Kreiraj račun):** Server poziva Supabase Auth preko **POST /api/auth/signup**. Koristi redom: `SUPABASE_SERVICE_ROLE_KEY`, pa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, pa `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Zato je **SUPABASE_SERVICE_ROLE_KEY** najpouzdaniji za produkciju.
- **Prijava, session, ostalo:** Koristi se browser klijent s anon/publishable keyom (iz env ili preko `/api/auth-config` na produkciji).

Ako sve postaviš iz istog Supabase projekta i napraviš Redeploy, "Invalid API key" bi trebao nestati. Ako i dalje ostane, pošalji poruku koju točno vidiš (i je li na login, signup ili drugdje).
