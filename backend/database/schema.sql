-- Create the subjects table
CREATE TABLE subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item TEXT NOT NULL,
  class TEXT NOT NULL,
  description TEXT,
  containment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with 20 SCP subjects
INSERT INTO subjects (item, class, description, containment) VALUES
('SCP-001', 'Safe', 'A wooden desk that never accumulates dust or debris regardless of environment.', 'Stored in a standard office at Site-12; no special measures required.'),
('SCP-002', 'Euclid', 'A humanoid entity that mimics the last person it made eye contact with.', 'Kept in a mirrored isolation chamber; guards use one-way glass only.'),
('SCP-003', 'Keter', 'A swarm of metallic insects that consume electronic devices within 10 meters.', 'Housed in a Faraday cage with no electronic equipment inside.'),
('SCP-004', 'Safe', 'A ceramic mug that keeps any liquid poured into it at a constant 60°C.', 'Stored on a standard shelf; no containment procedures beyond inventory logging.'),
('SCP-005', 'Euclid', 'A skeleton key that opens any lock but transports the user to a random location.', 'Kept in a sealed lockbox; access requires Level 3 clearance and written approval.'),
('SCP-006', 'Keter', 'A fountain that produces water capable of instantly aging biological tissue.', 'Contained in a sealed concrete bunker; water samples destroyed after testing.'),
('SCP-007', 'Safe', 'A small cactus that grows one inch every time it is not observed.', 'Kept in a standard containment cell; measured weekly by on-duty researcher.'),
('SCP-008', 'Euclid', 'An airborne pathogen that causes shared hallucinations among infected individuals.', 'Contained in a Level-4 biohazard facility; personnel wear positive-pressure suits.'),
('SCP-009', 'Safe', 'A block of ice that never fully melts, regardless of ambient temperature.', 'Stored in a standard freezer unit; no special handling required.'),
('SCP-010', 'Keter', 'A humanoid figure constructed entirely of shifting shadow, immune to physical restraint.', 'Contained in a chamber with constant, even lighting from all angles.'),
('SCP-011', 'Euclid', 'A rotary telephone that rings periodically; answering causes vivid memory loss.', 'Kept unplugged in a soundproofed storage locker.'),
('SCP-012', 'Safe', 'A canvas painting that shows the viewer their childhood home, regardless of accuracy.', 'Displayed in a standard secure gallery room; viewing logged for research.'),
('SCP-013', 'Keter', 'A parasitic organism that duplicates itself upon contact with any host organism.', 'Contained in an isolated biological wing; containment breach protocols in place.'),
('SCP-014', 'Safe', 'A pocket watch that runs backwards but keeps otherwise accurate time.', 'Stored in a standard secure box; handled with gloves during inspection.'),
('SCP-015', 'Euclid', 'A humanoid entity that can only be perceived by children under the age of ten.', 'Housed in a family-style containment suite; only juvenile-cleared staff may interact.'),
('SCP-016', 'Safe', 'A chalkboard that erases itself exactly one hour after anything is written on it.', 'Kept in a standard classroom-style containment room.'),
('SCP-017', 'Keter', 'A living fog that dissolves organic material on prolonged contact.', 'Contained behind airtight double-door seals with independent ventilation.'),
('SCP-018', 'Euclid', 'A rubber ball that increases the force of any impact tenfold with each bounce.', 'Stored in a padded chamber with remote-operated retrieval arm.'),
('SCP-019', 'Safe', 'A ceramic vase that repairs itself if broken, appearing undamaged within 24 hours.', 'Displayed in a low-security containment locker.'),
('SCP-020', 'Keter', 'A species of mold that spreads exponentially across any organic surface it touches.', 'Contained in a sealed, sterile chamber under constant UV exposure.');