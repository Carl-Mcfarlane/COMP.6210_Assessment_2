-- Run once in the Supabase SQL editor, after schema.sql and auth_schema.sql.
--
-- Express uses the secret key, which skips RLS. The publishable key is in the
-- browser though, so without RLS anyone could call Supabase's REST API directly
-- and change rows without going through the ownership checks in Express.
-- RLS on with no policies means no direct access, and Express still works.

ALTER TABLE object_classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects                ENABLE ROW LEVEL SECURITY;
ALTER TABLE containment_procedures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appendices              ENABLE ROW LEVEL SECURITY;

-- Re-running schema.sql recreates the tables and turns RLS off, so run this again after it
