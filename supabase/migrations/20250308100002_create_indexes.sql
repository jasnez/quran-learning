-- Indexes for performance
CREATE INDEX idx_ayahs_surah_id ON ayahs(surah_id);

CREATE INDEX idx_translations_ayah_id_language ON translations(ayah_id, language_code);

CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);

CREATE INDEX idx_user_progress_user_id_ayah_id ON user_progress(user_id, ayah_id);

CREATE INDEX idx_audio_tracks_ayah_reciter ON audio_tracks(ayah_id, reciter_id);
