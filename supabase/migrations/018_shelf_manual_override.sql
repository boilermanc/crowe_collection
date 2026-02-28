-- Shelf Manual Override Flag
-- Run this in the Supabase SQL Editor
-- Marks albums that were manually placed via drag-and-drop so auto-rebalance respects them.

ALTER TABLE albums ADD COLUMN shelf_manual_override BOOLEAN DEFAULT false;

-- Notify PostgREST to pick up the schema change
NOTIFY pgrst, 'reload schema';
