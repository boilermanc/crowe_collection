-- Stakkd Room Layouts — persist AI-generated placement layouts
-- Run this in the Supabase SQL Editor

CREATE TABLE stakkd_room_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES stakkd_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Layout',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  placements JSONB NOT NULL DEFAULT '[]'::jsonb,
  listening_position JSONB NOT NULL DEFAULT '{}'::jsonb,
  stereo_triangle JSONB,
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active layout per room
CREATE UNIQUE INDEX idx_stakkd_room_layouts_active
  ON stakkd_room_layouts (room_id) WHERE is_active = TRUE;

CREATE INDEX idx_stakkd_room_layouts_room_id ON stakkd_room_layouts(room_id);
CREATE INDEX idx_stakkd_room_layouts_user_id ON stakkd_room_layouts(user_id);

ALTER TABLE stakkd_room_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own room layouts"
  ON stakkd_room_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own room layouts"
  ON stakkd_room_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own room layouts"
  ON stakkd_room_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own room layouts"
  ON stakkd_room_layouts FOR DELETE
  USING (auth.uid() = user_id);
