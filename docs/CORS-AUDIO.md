# CORS setup for audio playback

So the browser can load audio from Supabase Storage, add your app origins to CORS **if your Supabase plan exposes CORS in the dashboard**.

---

## Ako u Supabaseu NEMA CORS u UI-u

1. **Prvo probaj bez CORS**  
   Na produkciji otvori Suru 1 i klikni Play. Često public Storage URL radi za `<audio src="...">` i bez CORS postavki. Ako se zvuk čuje, ne trebaš ništa mijenjati.

2. **Ako dobiješ CORS grešku u konzoli (F12)**  
   Uključi **audio proxy** kroz našu aplikaciju – browser tada ne radi zahtjev prema Supabaseu, nego prema našem API-ju (ista domena, nema CORS).

   U Vercelu (i u `.env.local` za lokalno) dodaj env varijablu:
   - **Key:** `NEXT_PUBLIC_AUDIO_VIA_PROXY`
   - **Value:** `1`

   Zatim **Redeploy**. Audio će ići preko `/api/audio?path=...` (naša domena), pa CORS u Supabaseu nije potreban.

---

## Steps (ako CORS postoji u dashboardu)

1. **Open API settings**  
   [Supabase → your project → Settings → API](https://supabase.com/dashboard/project/xivwzevkvpjwtgjvujyr/settings/api)

2. **Find CORS**  
   On the API page, find the **CORS** or **Allowed Origins** section (may be under a "Config" or "CORS" tab/section).

3. **Add origins** (one per line or comma-separated, depending on UI):
   - `http://localhost:3000`
   - Your production URL, e.g. `https://your-app.vercel.app`

4. **Save** the settings.

## Test playback

1. Start the app:
   ```bash
   npm run dev
   ```
2. Open http://localhost:3000
3. Go to a surah (e.g. **Al-Fatiha** / **Sura 1**)
4. Tap/click **Play** on an ayah

Audio should load from:
`https://xivwzevkvpjwtgjvujyr.supabase.co/storage/v1/object/public/audio/...`

If you see a CORS error in the browser console (F12 → Console), recheck the allowed origins and that you saved.
