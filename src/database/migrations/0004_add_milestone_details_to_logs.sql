-- Add milestone details columns to cards_log table
ALTER TABLE IF EXISTS "cards_log" 
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "members" text,
  ADD COLUMN IF NOT EXISTS "labels" text,
  ADD COLUMN IF NOT EXISTS "total_hours" varchar(50);

