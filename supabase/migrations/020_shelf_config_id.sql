-- Add shelf_config_id to albums so each album knows which shelf it belongs to
ALTER TABLE albums ADD COLUMN shelf_config_id UUID REFERENCES shelf_config(id) ON DELETE SET NULL;

-- Index for efficient filtering by shelf
CREATE INDEX idx_albums_shelf_config_id ON albums(shelf_config_id);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
