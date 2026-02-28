-- Stakkd Room Planner — rooms and room features
-- Run this in the Supabase SQL Editor

-- ── Rooms ───────────────────────────────────────────────────────────

CREATE TABLE stakkd_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width_ft NUMERIC(5,1) NOT NULL,
  length_ft NUMERIC(5,1) NOT NULL,
  height_ft NUMERIC(4,1) DEFAULT 8.0,
  shape TEXT DEFAULT 'rectangular',
  floor_type TEXT DEFAULT 'hardwood',
  listening_position TEXT DEFAULT 'centered',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT stakkd_rooms_shape_check CHECK (
    shape IN ('rectangular', 'l_shaped', 'open_concept')
  ),
  CONSTRAINT stakkd_rooms_floor_type_check CHECK (
    floor_type IN ('hardwood', 'carpet', 'tile', 'concrete', 'mixed')
  ),
  CONSTRAINT stakkd_rooms_listening_position_check CHECK (
    listening_position IN ('centered', 'desk', 'couch', 'near_wall')
  )
);

CREATE INDEX idx_stakkd_rooms_user_id ON stakkd_rooms(user_id);

ALTER TABLE stakkd_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rooms"
  ON stakkd_rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rooms"
  ON stakkd_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rooms"
  ON stakkd_rooms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rooms"
  ON stakkd_rooms FOR DELETE
  USING (auth.uid() = user_id);

-- ── Room Features ───────────────────────────────────────────────────

CREATE TABLE stakkd_room_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES stakkd_rooms(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  wall TEXT NOT NULL,
  position_pct NUMERIC(5,2) NOT NULL,
  width_ft NUMERIC(4,1) DEFAULT 3.0,
  notes TEXT,

  CONSTRAINT stakkd_room_features_type_check CHECK (
    feature_type IN ('door', 'window', 'closet', 'fireplace', 'stairs', 'opening')
  ),
  CONSTRAINT stakkd_room_features_wall_check CHECK (
    wall IN ('north', 'south', 'east', 'west')
  ),
  CONSTRAINT stakkd_room_features_position_check CHECK (
    position_pct >= 0 AND position_pct <= 100
  )
);

CREATE INDEX idx_stakkd_room_features_room_id ON stakkd_room_features(room_id);

ALTER TABLE stakkd_room_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own room features"
  ON stakkd_room_features FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM stakkd_rooms WHERE id = room_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own room features"
  ON stakkd_room_features FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM stakkd_rooms WHERE id = room_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own room features"
  ON stakkd_room_features FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM stakkd_rooms WHERE id = room_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own room features"
  ON stakkd_room_features FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM stakkd_rooms WHERE id = room_id AND user_id = auth.uid())
  );
