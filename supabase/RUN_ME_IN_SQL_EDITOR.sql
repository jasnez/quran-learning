-- =============================================================================
-- Quran Learning – sve migracije u jednom fajlu
-- Pokreni u Supabase Dashboard: SQL Editor → New query → zalijepi cijeli fajl → Run
-- =============================================================================

-- ----- 1. Core tables -----
CREATE TABLE IF NOT EXISTS surahs (
  id SERIAL PRIMARY KEY,
  surah_number INTEGER UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_arabic VARCHAR(255) NOT NULL,
  name_latin VARCHAR(255) NOT NULL,
  name_bosnian VARCHAR(255) NOT NULL,
  revelation_type VARCHAR(20) NOT NULL CHECK (revelation_type IN ('meccan','medinan')),
  ayah_count INTEGER NOT NULL,
  order_in_mushaf INTEGER NOT NULL,
  description_short TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ayahs (
  id SERIAL PRIMARY KEY,
  surah_id INTEGER REFERENCES surahs(id),
  ayah_number_in_surah INTEGER NOT NULL,
  ayah_number_global INTEGER UNIQUE NOT NULL,
  juz_number INTEGER,
  page_number INTEGER,
  hizb_number INTEGER,
  arabic_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(surah_id, ayah_number_in_surah)
);

CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  language_code VARCHAR(10) NOT NULL,
  translator_name VARCHAR(255) NOT NULL,
  translation_text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ayah_id, language_code, translator_name)
);

CREATE TABLE IF NOT EXISTS transliterations (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  language_code VARCHAR(10) DEFAULT 'standard',
  text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(ayah_id, language_code)
);

CREATE TABLE IF NOT EXISTS tajwid_markup (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  markup_payload JSONB NOT NULL,
  rule_system VARCHAR(50) DEFAULT 'tajwid_5_mvp',
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(ayah_id, rule_system)
);

CREATE TABLE IF NOT EXISTS reciters (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  arabic_name VARCHAR(255),
  style VARCHAR(50),
  country VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  audio_base_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS audio_tracks (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  reciter_id VARCHAR(100) REFERENCES reciters(id),
  file_url VARCHAR(500) NOT NULL,
  duration_ms INTEGER,
  format VARCHAR(10) DEFAULT 'mp3',
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(ayah_id, reciter_id)
);

CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  word_order INTEGER NOT NULL,
  text_arabic VARCHAR(255) NOT NULL,
  transliteration VARCHAR(255),
  translation_short VARCHAR(500),
  start_time_ms INTEGER NOT NULL,
  end_time_ms INTEGER NOT NULL,
  tajwid_rule VARCHAR(50) DEFAULT 'normal',
  UNIQUE(ayah_id, word_order)
);

-- ----- 2. User tables -----
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  arabic_font_size INTEGER DEFAULT 28,
  show_transliteration BOOLEAN DEFAULT true,
  show_translation BOOLEAN DEFAULT true,
  show_tajwid_colors BOOLEAN DEFAULT true,
  selected_reciter_id VARCHAR(100) DEFAULT 'mishary-alafasy',
  selected_translation_lang VARCHAR(10) DEFAULT 'bs',
  playback_speed NUMERIC(3,2) DEFAULT 1.0,
  repeat_ayah BOOLEAN DEFAULT false,
  auto_play_next BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ayah_id INTEGER REFERENCES ayahs(id),
  note TEXT,
  collection_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ayah_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ayah_id INTEGER REFERENCES ayahs(id),
  listened BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  listen_count INTEGER DEFAULT 0,
  last_listened_at TIMESTAMPTZ,
  UNIQUE(user_id, ayah_id)
);

-- ----- 3. Indexes -----
CREATE INDEX IF NOT EXISTS idx_ayahs_surah_id ON ayahs(surah_id);
CREATE INDEX IF NOT EXISTS idx_translations_ayah_id_language ON translations(ayah_id, language_code);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id_ayah_id ON user_progress(user_id, ayah_id);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_ayah_reciter ON audio_tracks(ayah_id, reciter_id);
CREATE INDEX IF NOT EXISTS idx_words_ayah_id ON words(ayah_id);

-- ----- 4. RLS -----
ALTER TABLE surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transliterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tajwid_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surahs_select_public" ON surahs;
CREATE POLICY "surahs_select_public" ON surahs FOR SELECT USING (true);
DROP POLICY IF EXISTS "ayahs_select_public" ON ayahs;
CREATE POLICY "ayahs_select_public" ON ayahs FOR SELECT USING (true);
DROP POLICY IF EXISTS "translations_select_public" ON translations;
CREATE POLICY "translations_select_public" ON translations FOR SELECT USING (true);
DROP POLICY IF EXISTS "transliterations_select_public" ON transliterations;
CREATE POLICY "transliterations_select_public" ON transliterations FOR SELECT USING (true);
DROP POLICY IF EXISTS "tajwid_markup_select_public" ON tajwid_markup;
CREATE POLICY "tajwid_markup_select_public" ON tajwid_markup FOR SELECT USING (true);
DROP POLICY IF EXISTS "reciters_select_public" ON reciters;
CREATE POLICY "reciters_select_public" ON reciters FOR SELECT USING (true);
DROP POLICY IF EXISTS "audio_tracks_select_public" ON audio_tracks;
CREATE POLICY "audio_tracks_select_public" ON audio_tracks FOR SELECT USING (true);
DROP POLICY IF EXISTS "words_select_public" ON words;
CREATE POLICY "words_select_public" ON words FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "user_settings_insert_own" ON user_settings;
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "user_settings_update_own" ON user_settings;
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_bookmarks_select_own" ON user_bookmarks;
CREATE POLICY "user_bookmarks_select_own" ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_bookmarks_insert_own" ON user_bookmarks;
CREATE POLICY "user_bookmarks_insert_own" ON user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_bookmarks_update_own" ON user_bookmarks;
CREATE POLICY "user_bookmarks_update_own" ON user_bookmarks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_bookmarks_delete_own" ON user_bookmarks;
CREATE POLICY "user_bookmarks_delete_own" ON user_bookmarks FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_progress_select_own" ON user_progress;
CREATE POLICY "user_progress_select_own" ON user_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_progress_insert_own" ON user_progress;
CREATE POLICY "user_progress_insert_own" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_progress_update_own" ON user_progress;
CREATE POLICY "user_progress_update_own" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_progress_delete_own" ON user_progress;
CREATE POLICY "user_progress_delete_own" ON user_progress FOR DELETE USING (auth.uid() = user_id);

-- ----- 5. Storage: avatars bucket (za slike profila) -----
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);
