-- Core Quran content tables
CREATE TABLE surahs (
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

CREATE TABLE ayahs (
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

CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  language_code VARCHAR(10) NOT NULL,
  translator_name VARCHAR(255) NOT NULL,
  translation_text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ayah_id, language_code, translator_name)
);

CREATE TABLE transliterations (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  language_code VARCHAR(10) DEFAULT 'standard',
  text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(ayah_id, language_code)
);

CREATE TABLE tajwid_markup (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  markup_payload JSONB NOT NULL,
  rule_system VARCHAR(50) DEFAULT 'tajwid_5_mvp',
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(ayah_id, rule_system)
);

CREATE TABLE reciters (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  arabic_name VARCHAR(255),
  style VARCHAR(50),
  country VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  audio_base_url VARCHAR(500)
);

CREATE TABLE audio_tracks (
  id SERIAL PRIMARY KEY,
  ayah_id INTEGER REFERENCES ayahs(id),
  reciter_id VARCHAR(100) REFERENCES reciters(id),
  file_url VARCHAR(500) NOT NULL,
  duration_ms INTEGER,
  format VARCHAR(10) DEFAULT 'mp3',
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(ayah_id, reciter_id)
);
