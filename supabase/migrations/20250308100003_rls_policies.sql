-- Enable RLS on all tables
ALTER TABLE surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transliterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tajwid_markup ENABLE ROW LEVEL SECURITY;
ALTER TABLE reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Quran content: readable by everyone (anonymous + authenticated)
CREATE POLICY "surahs_select_public" ON surahs FOR SELECT USING (true);
CREATE POLICY "ayahs_select_public" ON ayahs FOR SELECT USING (true);
CREATE POLICY "translations_select_public" ON translations FOR SELECT USING (true);
CREATE POLICY "transliterations_select_public" ON transliterations FOR SELECT USING (true);
CREATE POLICY "tajwid_markup_select_public" ON tajwid_markup FOR SELECT USING (true);
CREATE POLICY "reciters_select_public" ON reciters FOR SELECT USING (true);
CREATE POLICY "audio_tracks_select_public" ON audio_tracks FOR SELECT USING (true);

-- user_profiles: user can read/update own row (insert via trigger or app when user signs up)
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- user_settings: user can read/insert/update own row
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE USING (auth.uid() = id);

-- user_bookmarks: user can CRUD own rows
CREATE POLICY "user_bookmarks_select_own" ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_bookmarks_insert_own" ON user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_bookmarks_update_own" ON user_bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_bookmarks_delete_own" ON user_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- user_progress: user can CRUD own rows
CREATE POLICY "user_progress_select_own" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert_own" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_update_own" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_progress_delete_own" ON user_progress FOR DELETE USING (auth.uid() = user_id);
