-- Add Trello API credentials to users table
ALTER TABLE IF EXISTS "users" 
  ADD COLUMN IF NOT EXISTS "trello_api_key" text,
  ADD COLUMN IF NOT EXISTS "trello_token" text;

