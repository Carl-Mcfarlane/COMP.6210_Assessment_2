-- Run once in the Supabase SQL editor, after auth_schema.sql.
-- Adds created_by so users can only edit/delete their own entries.
-- Existing rows stay NULL, so only admins can change those.
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS subjects_created_by_idx ON subjects (created_by);
