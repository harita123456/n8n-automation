-- Update existing timestamp columns to use timestamptz (UTC with timezone)
-- This ensures all timestamps are stored in UTC

-- Note: If your database already has data, this migration will convert existing timestamps
-- PostgreSQL will interpret existing timestamps as UTC when converting to timestamptz

ALTER TABLE IF EXISTS "users" 
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE IF EXISTS "workflows" 
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE timestamptz USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE IF EXISTS "cards_log" 
  ALTER COLUMN "created_at" TYPE timestamptz USING "created_at" AT TIME ZONE 'UTC';

-- Set timezone to UTC for the session (optional, but recommended)
SET timezone = 'UTC';

