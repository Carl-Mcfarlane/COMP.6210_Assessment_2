-- Run once in the Supabase SQL editor (after auth_schema.sql).
-- Records who created each subject so non-admin users can edit/delete only
-- their own entries. Existing rows get NULL, which means "admin only".
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS subjects_created_by_idx ON subjects (created_by);
