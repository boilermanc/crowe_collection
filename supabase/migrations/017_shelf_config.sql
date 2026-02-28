-- Shelf Configuration & Sort Preferences
-- Run this in the Supabase SQL Editor

-- ── Shelf Config ────────────────────────────────────────────────────

CREATE TABLE shelf_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_count INTEGER NOT NULL,
  capacity_per_unit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shelf_config_user_id ON shelf_config(user_id);

ALTER TABLE shelf_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shelf configs"
  ON shelf_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shelf configs"
  ON shelf_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shelf configs"
  ON shelf_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shelf configs"
  ON shelf_config FOR DELETE
  USING (auth.uid() = user_id);

-- ── Shelf Sort Preference ───────────────────────────────────────────

CREATE TABLE shelf_sort_preference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sort_scheme TEXT NOT NULL DEFAULT 'artist_alpha',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT shelf_sort_preference_scheme_check CHECK (
    sort_scheme IN ('artist_alpha', 'genre_artist', 'year_asc', 'year_desc', 'date_added', 'custom')
  )
);

CREATE INDEX idx_shelf_sort_preference_user_id ON shelf_sort_preference(user_id);

ALTER TABLE shelf_sort_preference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sort preference"
  ON shelf_sort_preference FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sort preference"
  ON shelf_sort_preference FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sort preference"
  ON shelf_sort_preference FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sort preference"
  ON shelf_sort_preference FOR DELETE
  USING (auth.uid() = user_id);

-- ── Add shelf_unit column to albums ─────────────────────────────────

ALTER TABLE albums ADD COLUMN shelf_unit INTEGER;

-- Notify PostgREST to pick up the schema change
NOTIFY pgrst, 'reload schema';
