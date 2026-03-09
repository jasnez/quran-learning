/**
 * Upload local audio from public/audio to Supabase Storage and update audio_tracks.file_url.
 *
 * Prerequisites:
 * - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * - Optional: public/audio/<reciterId>/*.mp3 (if missing, only creates bucket and updates DB URLs from existing relative paths)
 *
 * CORS: In Supabase Dashboard → Storage → Configuration (or bucket settings),
 * add your app origin(s), e.g. http://localhost:3000 and https://your-app.vercel.app
 *
 * Run: npm run upload:audio   (or: npx tsx scripts/upload-audio-to-storage.ts)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
config({ path: envPath });

const BUCKET = "audio";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return createClient(url, key);
}

/** Public URL for a file in the audio bucket (no trailing slash on base). */
function getPublicUrl(supabaseUrl: string, reciterId: string, filename: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${reciterId}/${filename}`;
}

async function main() {
  const supabase = getSupabase();
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const root = process.cwd();
  const audioDir = path.join(root, "public", "audio");

  // 1. Ensure bucket exists (public for CDN reads)
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasAudio = buckets?.some((b) => b.name === BUCKET);
  if (!hasAudio) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (error) {
      console.error("Failed to create bucket:", error.message);
      process.exit(1);
    }
    console.log("Created bucket:", BUCKET);
  } else {
    console.log("Bucket already exists:", BUCKET);
  }

  let uploaded = 0;
  if (fs.existsSync(audioDir) && fs.statSync(audioDir).isDirectory()) {
    const reciterDirs = fs.readdirSync(audioDir);
    for (const reciterId of reciterDirs) {
      const reciterPath = path.join(audioDir, reciterId);
      if (!fs.statSync(reciterPath).isDirectory()) continue;
      const files = fs.readdirSync(reciterPath).filter((f) => f.endsWith(".mp3"));
      for (const filename of files) {
        const filePath = path.join(reciterPath, filename);
        const buffer = fs.readFileSync(filePath);
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(`${reciterId}/${filename}`, buffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });
        if (error) {
          console.error(`Upload failed ${reciterId}/${filename}:`, error.message);
          continue;
        }
        uploaded++;
        if (uploaded % 100 === 0) console.log("Uploaded", uploaded, "files...");
      }
    }
    console.log("Total uploaded:", uploaded);
  } else {
    console.log("No public/audio folder found; skipping file upload.");
  }

  // 2. Update audio_tracks: set file_url to full CDN URL for relative paths
  const { data: tracks, error: fetchErr } = await supabase
    .from("audio_tracks")
    .select("id, file_url, reciter_id");

  if (fetchErr) {
    console.error("Failed to fetch audio_tracks:", fetchErr.message);
    process.exit(1);
  }

  const relativeMatch = /^\/?audio\/([^/]+)\/([^/]+)$/;
  let updated = 0;
  for (const row of tracks ?? []) {
    const url = (row.file_url ?? "").trim();
    const m = url.match(relativeMatch);
    if (!m) continue;
    const reciterId = m[1];
    const filename = m[2];
    const fullUrl = getPublicUrl(supabaseUrl, reciterId, filename);
    const { error } = await supabase
      .from("audio_tracks")
      .update({ file_url: fullUrl })
      .eq("id", row.id);
    if (error) {
      console.error("Update failed for track id", row.id, error.message);
      continue;
    }
    updated++;
  }
  console.log("Updated audio_tracks.file_url to CDN URL for", updated, "rows.");

  // 3. Optional: remove public/audio after upload
  const removeLocal = process.argv.includes("--remove-local");
  if (removeLocal && fs.existsSync(audioDir)) {
    fs.rmSync(audioDir, { recursive: true });
    console.log("Removed public/audio folder.");
  }

  console.log("\nNext steps:");
  console.log("1. In Supabase Dashboard → Storage → Configuration, set CORS allowed origins (e.g. http://localhost:3000).");
  console.log("2. In .env.local set: NEXT_PUBLIC_AUDIO_CDN_URL=" + supabaseUrl + "/storage/v1/object/public/audio");
  if (uploaded > 0 && !removeLocal) {
    console.log("3. Optionally remove local files: run again with --remove-local or delete the public/audio folder.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
