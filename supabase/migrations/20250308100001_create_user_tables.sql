-- User tables (reference auth.users from Supabase Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_settings (
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

CREATE TABLE user_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ayah_id INTEGER REFERENCES ayahs(id),
  note TEXT,
  collection_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ayah_id)
);

CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ayah_id INTEGER REFERENCES ayahs(id),
  listened BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  listen_count INTEGER DEFAULT 0,
  last_listened_at TIMESTAMPTZ,
  UNIQUE(user_id, ayah_id)
);
