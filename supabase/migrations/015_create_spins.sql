-- Spins table — listening history for "Now Spinning"
-- Run this in the Supabase SQL Editor

-- Create the spins table
CREATE TABLE IF NOT EXISTS spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  spun_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_spins_user_id ON spins(user_id);

-- Index for per-album spin history
CREATE INDEX IF NOT EXISTS idx_spins_album_id ON spins(album_id);

-- RLS: users can only see/insert their own spins
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own spins"
  ON spins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own spins"
  ON spins FOR SELECT
  USING (auth.uid() = user_id);

-- Ensure play_count column exists on albums
ALTER TABLE albums ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;
