-- Word-level data for advanced audio synchronization
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

CREATE INDEX IF NOT EXISTS idx_words_ayah_id ON words(ayah_id);

ALTER TABLE words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "words_select_public" ON words;
CREATE POLICY "words_select_public" ON words FOR SELECT USING (true);
