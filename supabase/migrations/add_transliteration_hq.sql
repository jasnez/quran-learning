-- Add high-quality transliteration (diacritical) column alongside existing text.
-- Run this in Supabase SQL Editor after RUN_ME_IN_SQL_EDITOR.sql.
-- Existing "text" column is kept unchanged.

ALTER TABLE transliterations
  ADD COLUMN IF NOT EXISTS text_hq TEXT;

COMMENT ON COLUMN transliterations.text_hq IS 'Full-ayah transliteration with diacritics (e.g. ā ī ū ḥ). Populated by scripts/fetch-hq-transliteration.ts.';
