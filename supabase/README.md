# Supabase setup

## Korak 1: Anon key u `.env.local`

1. **Fajl `.env.local`** je već kreiran u rootu projekta (ako nije: kopiraj `.env.local.example` u `.env.local`).
2. Otvori [Supabase Dashboard](https://supabase.com/dashboard) → svoj projekat (URL: `https://xivwzevkvpjwtgjvujyr.supabase.co`).
3. **Settings** (lijevo) → **API**.
4. U sekciji **Project API keys** kopiraj **anon public** ključ.
5. U `.env.local` zamijeni `your-anon-key-here` tim ključem:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...  # tvoj pravi ključ
   ```
6. Spremi fajl. URL (`NEXT_PUBLIC_SUPABASE_URL`) je već upisan.

---

## Korak 2: Pokretanje migracija u SQL Editoru

1. U Supabase Dashboardu otvori **SQL Editor** (lijevo u meniju).
2. Klikni **New query**.
3. Otvori fajl **`supabase/RUN_ME_IN_SQL_EDITOR.sql`** iz ovog projekta (u editoru ili Exploreru).
4. **Kopiraj cijeli sadržaj** tog fajla i **zalijepi** u SQL Editor.
5. Klikni **Run** (ili Ctrl+Enter).
6. Na dnu bi trebalo pisati da je upit uspješno izvršen; u **Table Editor** se pojavljuju tabele: `surahs`, `ayahs`, `translations`, itd.

Ako već imaš neke od tabela, skripta koristi `IF NOT EXISTS` / `DROP POLICY IF EXISTS`, pa je sigurno pokrenuti i drugi put.

---

## Korak 3: Korištenje u kodu

```ts
import { getSupabaseClient } from "@/lib/supabase";

const supabase = getSupabaseClient();
const { data, error } = await supabase.from("surahs").select("*");
```

Server komponenta (npr. u App Routeru):

```ts
import { getSupabaseClient } from "@/lib/supabase";

export default async function Page() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("surahs").select("*");
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

---

## Audio storage (CDN)

Audio files are served from Supabase Storage so the app does not need to host MP3s.

1. **Create bucket and upload** (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`):
   ```bash
   npm run upload:audio
   ```
   With local files in `public/audio/<reciterId>/*.mp3`, they are uploaded to the `audio` bucket. `audio_tracks.file_url` is set to the full public URL. To delete local files after upload, run:
   ```bash
   npx tsx scripts/upload-audio-to-storage.ts --remove-local
   ```

2. **CORS**: So the browser can play audio from the Storage domain, allow your app origin in Supabase:
   - Dashboard → **Settings** (gear) → **API** → **CORS** (or **Config** tab): add allowed origins, e.g. `http://localhost:3000` and your **production URL** (e.g. `https://your-app.vercel.app`).
   - If your project has **Storage** → **Configuration** for the bucket, add the same origins there.
   - Full production deploy steps: see **docs/DEPLOY-PRODUCTION.md**.

3. **Env**: In `.env.local` set:
   ```env
   NEXT_PUBLIC_AUDIO_CDN_URL=https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/audio
   ```
   (Replace `YOUR_PROJECT_REF` with your project ref; no trailing slash.)

---

## Opciono: Supabase CLI

Ako koristiš [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npx supabase link --project-ref xivwzevkvpjwtgjvujyr
npx supabase db push
```

Migracije iz `supabase/migrations/` (pojedinačni fajlovi) će se primijeniti. Za jedan brzi potez koristi gore opisan **RUN_ME_IN_SQL_EDITOR.sql**.
