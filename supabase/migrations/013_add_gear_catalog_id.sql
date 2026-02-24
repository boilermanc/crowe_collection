-- Add catalog_id column to link user gear back to the gear_catalog reference entry
ALTER TABLE gear ADD COLUMN catalog_id UUID;
