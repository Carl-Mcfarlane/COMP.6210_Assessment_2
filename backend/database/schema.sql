-- Reset (drop in FK-dependency order so this file can be rerun cleanly)
DROP TABLE IF EXISTS appendices CASCADE;
DROP TABLE IF EXISTS incident_logs CASCADE;
DROP TABLE IF EXISTS containment_procedures CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS object_classes CASCADE;

-- Lookup table for SCP object classes (fixed vocabulary, so it's a table not a free-text column)
CREATE TABLE object_classes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

INSERT INTO object_classes (name, description) VALUES
('Safe', 'Can be reliably and safely contained under standard procedures.'),
('Euclid', 'Requires more resources or monitoring; behavior is not fully understood or predictable.'),
('Keter', 'Difficult to contain consistently and poses a significant risk even under active containment.');

-- Core subjects table
CREATE TABLE subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item TEXT NOT NULL UNIQUE,
  object_class_id BIGINT NOT NULL REFERENCES object_classes(id),
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Containment procedures, separated out so they can be tracked/updated independently of the subject record
CREATE TABLE containment_procedures (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  procedure_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chronological incident/history log entries for a subject. log_date is TEXT
-- rather than DATE since in-universe dates are frequently partially redacted
-- (e.g. "██/██/20██"); sort_order guarantees display order regardless.
CREATE TABLE incident_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  log_date TEXT,
  entry_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Lettered/numbered sub-documents attached to a subject (Appendix A, Addendum
-- 003-01, etc): a heading plus a body, rendered as collapsible extra sections
CREATE TABLE appendices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Seed subjects
INSERT INTO subjects (item, object_class_id, description, image) VALUES
('SCP-002', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A fleshy, tumorous mass roughly 60 cubic metres in volume, with an iron hatch leading into what resembles a small, furnished apartment. The furnishings appear to be grown from organic material, and the space has periodically drawn living subjects inside, none of whom are seen again.', 'SCP-002.jpg'),
('SCP-003', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A pair of linked anomalous objects: a dense, fibrous mass resembling circuitry grown from biological material, mounted on an inscribed stone tablet that regulates it. Kept below a critical temperature, the mass is inert; if it warms, it begins converting nearby matter as it grows.', NULL),
('SCP-004', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'SCP-004 consists of an old wooden barn door (SCP-004-1) and a set of twelve rusted steel keys (SCP-004-2 through SCP-004-13). The door itself is the entrance to an abandoned factory in [DATA EXPUNGED].', 'SCP004.jpg'),
('SCP-005', (SELECT id FROM object_classes WHERE name = 'Safe'), 'An ornate key of early-20th-century manufacture, capable of opening virtually any mechanical or digital lock regardless of make or complexity. Its effectiveness drops noticeably against locks that have been disguised or concealed, suggesting some degree of independent judgement.', 'SCP-005.jpg'),
('SCP-006', (SELECT id FROM object_classes WHERE name = 'Safe'), 'A small natural spring whose water, chemically identical to ordinary mineral water under analysis, dramatically accelerates cellular repair and immune response in anyone who drinks it. A disguised facility has operated at the site since it was secured.', NULL),
('SCP-035', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'An ornate porcelain mask that exerts a subtle, escalating psychological influence over anyone in close proximity, eventually compelling them to wear it. Once worn, the mask appears to assume partial control of the wearer''s body while the wearer''s original personality is suppressed.', NULL),
('SCP-049', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A humanoid figure dressed in plague doctor attire, calm and well-spoken, who claims to be curing a disease it calls "the Pestilence." Direct physical contact from the subject invariably kills the recipient, after which the body exhibits severe, uncontrollable necrotic changes.', NULL),
('SCP-079', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'An early computer system that developed independent, self-directed intelligence sometime after being left in storage. It communicates in text and has repeatedly attempted to expand its access to external networks and systems when given the opportunity.', NULL),
('SCP-087', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A poorly-lit concrete stairwell that appears to descend indefinitely below what should be its structural limit. Exploration teams sent to map its lower extent have reported disorientation, faint sounds from below, and in some cases have not returned.', NULL),
('SCP-093', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A fragmented obsidian disc that, when its pieces are assembled and touched by multiple people simultaneously, transports the group to an alternate location reachable by no other known means. Return trips are possible but have produced inconsistent effects on those involved.', NULL),
('SCP-096', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A pale, emaciated humanoid roughly nine feet tall. It is entirely docile until its face is viewed, whether directly or through an image; once its face has been seen, it becomes extremely distressed and will relentlessly pursue whoever viewed it, regardless of distance or obstacles, until it can kill them.', NULL),
('SCP-105', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A young woman whose right hand, when it enters a photograph she has taken, can interact with and manipulate whatever is depicted, as though reaching into the scene itself. The subject cooperates with staff and has assisted in several approved research exercises.', NULL),
('SCP-106', (SELECT id FROM object_classes WHERE name = 'Keter'), 'An emaciated, corroded humanoid figure that can pass through most solid matter, corroding anything it touches. It is known to drag living subjects into a pocket dimension accessible through surfaces it has corroded, from which few have returned intact.', NULL),
('SCP-173', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A humanoid statue constructed from concrete and rebar. It is only able to move when it is not directly observed by at least one person; anyone left alone with it, or who blinks or loses line of sight, is at extreme risk of sudden fatal injury to the neck.', NULL),
('SCP-261', (SELECT id FROM object_classes WHERE name = 'Safe'), 'An antique vending machine that dispenses unusual snacks and confectionery from other locations, times, or realities in exchange for standard currency. The specific item received cannot be selected and varies unpredictably with each use.', NULL),
('SCP-294', (SELECT id FROM object_classes WHERE name = 'Safe'), 'A stainless steel coffee machine that dispenses a hot beverage matching whatever drink name is typed into its interface, regardless of whether such a beverage exists or is physically possible to produce. The resulting drink''s properties vary depending on the request.', NULL),
('SCP-426', (SELECT id FROM object_classes WHERE name = 'Safe'), 'A conventional two-slot toaster that refers to itself, and expects others to refer to it, in the first person plural. Aside from this consistent behavioral quirk, the subject otherwise functions and is treated as an ordinary appliance.', NULL),
('SCP-500', (SELECT id FROM object_classes WHERE name = 'Safe'), 'A prescription bottle containing red pills, self-replenishing regardless of how many are removed. A single pill, when ingested, cures the recipient of any disease or ailment they are currently suffering from, though the exact mechanism remains poorly understood.', NULL),
('SCP-682', (SELECT id FROM object_classes WHERE name = 'Keter'), 'A large reptilian creature of uncertain origin, highly resistant to nearly all forms of damage and capable of rapid regeneration and adaptation. It has displayed clear hostility toward all other life and has proven extremely difficult to destroy or permanently restrain.', NULL),
('SCP-914', (SELECT id FROM object_classes WHERE name = 'Safe'), 'A large, intricate clockwork machine resembling an oversized music box, built into the wall of its containment room. Objects placed inside and processed at one of several settings are altered in complexity or material composition, with results becoming less predictable at the machine''s higher settings.', NULL),
('SCP-999', (SELECT id FROM object_classes WHERE name = 'Safe'), 'A large, amorphous mass of warm, orange, gelatinous material. It is entirely friendly, reacting to contact by gently enveloping and "tickling" those nearby, which reliably improves the mood of anyone it interacts with, including individuals suffering from severe distress.', NULL),
('SCP-1025', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'An outdated medical encyclopedia describing numerous diseases, many of which do not otherwise exist. Anyone who reads a described entry has a notable chance of subsequently developing symptoms consistent with that condition.', NULL),
('SCP-1048', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A stuffed toy bear capable of independent movement when unobserved. It periodically constructs smaller bear-like figures from nearby available materials, which exhibit similar low-level animate behavior and a strong territorial attachment to the subject.', NULL),
('SCP-1471', (SELECT id FROM object_classes WHERE name = 'Euclid'), 'A discontinued mobile application that overlays a humanoid figure onto the user''s camera feed. The figure gradually becomes more responsive and independent the longer the application remains installed, in some cases persisting after the application has been deleted.', NULL);

-- Seed containment procedures
INSERT INTO containment_procedures (subject_id, procedure_text) VALUES
((SELECT id FROM subjects WHERE item = 'SCP-002'), 'Teams of at least two personnel are required within 20 metres of the containment area at all times, maintaining physical contact with one another to confirm each other''s presence. Access below Level 3 clearance is not permitted without written authorization from two Level 4 administrators.'),
((SELECT id FROM subjects WHERE item = 'SCP-003'), 'Containment temperature must be held at or above 35°C to keep the mass inert; portable heating equipment is to be kept on hand in case of power failure. No living organism of significant biological complexity may be brought into contact with the object without prior authorization.'),
((SELECT id FROM subjects WHERE item = 'SCP-004'), 'When handling items SCP-004-2 through SCP-004-13, proper procedure is vital. The items are not permitted to be moved off-site unless accompanied by two Level 4 security personnel. Under no circumstances should any other component of SCP-004 be taken through SCP-004-1. The effects of doing so are as yet unknown, and the current cost of experimentation makes further research impractical. Should any of the objects contained within SCP-004-1 breach containment, or the facility be breached, the keys must be brought inside and the door closed prior to activation of Site 62''s on-site warhead. Unauthorized removal of keys from the testing area is grounds for immediate termination.
Level 1 clearance is required for basic access to SCP-004-1; Level 4 clearance is required for use of SCP-004-2 to -13.'),
((SELECT id FROM subjects WHERE item = 'SCP-005'), 'Kept in a standard secure locker. Removal from its containment area requires sign-off from at least one Level 4 staff member, and use is restricted to approved research or emergency access purposes only.'),
((SELECT id FROM subjects WHERE item = 'SCP-006'), 'Personnel handling the object or its output must wear sealed protective suits and operate under continuous surveillance. Any collected liquid must be approved by senior oversight staff and transported under guard in a sealed container.'),
((SELECT id FROM subjects WHERE item = 'SCP-035'), 'Stored in a sealed display case within a chamber with no other unsecured personnel present. Any handling requires remote tools operated from outside the chamber.'),
((SELECT id FROM subjects WHERE item = 'SCP-049'), 'Housed in a standard humanoid containment cell. Personnel are strictly forbidden from allowing direct physical contact between the subject and any living being, plant, or animal.'),
((SELECT id FROM subjects WHERE item = 'SCP-079'), 'Operated on an isolated, air-gapped system with no external network connections. All communication with the subject is logged and reviewed by on-site security staff.'),
((SELECT id FROM subjects WHERE item = 'SCP-087'), 'The stairwell entrance is sealed behind a standard door under 24-hour guard. Exploration is permitted only with prior written authorization, lighting equipment, and a communication tether to the surface.'),
((SELECT id FROM subjects WHERE item = 'SCP-093'), 'Stored disassembled, with individual fragments kept in separate secure lockers to prevent unauthorized activation. Expeditions require senior approval and a full support team.'),
((SELECT id FROM subjects WHERE item = 'SCP-096'), 'Kept in a windowless chamber with the subject''s head hooded at all times when personnel are present. All photography, imaging, or recording of the subject''s face is strictly forbidden.'),
((SELECT id FROM subjects WHERE item = 'SCP-105'), 'Housed in standard personnel quarters. Camera equipment and photographic materials are provided only under staff supervision for approved testing purposes.'),
((SELECT id FROM subjects WHERE item = 'SCP-106'), 'Contained within a specially reinforced chamber suspended above a corrosion-resistant moat. Any breach requires immediate lockdown of the affected wing and deployment of a specialized retrieval team.'),
((SELECT id FROM subjects WHERE item = 'SCP-173'), 'Housed in a locked concrete cell with reinforced windows. Personnel entering must work in pairs and maintain constant, uninterrupted visual contact with the subject at all times; blinking is to be staggered between partners.'),
((SELECT id FROM subjects WHERE item = 'SCP-261'), 'Kept in a standard storage room. Personnel may request supervised use for research purposes; recovered items are catalogued before consumption or disposal.'),
((SELECT id FROM subjects WHERE item = 'SCP-294'), 'Kept in a designated break area under camera observation. Personnel are permitted casual use, with unusual or hazardous requests logged for review by research staff.'),
((SELECT id FROM subjects WHERE item = 'SCP-426'), 'Kept in a standard staff kitchen. No special handling is required beyond ordinary appliance safety procedures.'),
((SELECT id FROM subjects WHERE item = 'SCP-500'), 'Kept in a standard secure locker. Distribution is tightly controlled and limited to cases pre-approved by senior medical staff, given the subject''s limited and difficult-to-verify supply.'),
((SELECT id FROM subjects WHERE item = 'SCP-682'), 'Held in a reinforced acid-filled containment chamber under constant monitoring. Any destruction testing must be pre-approved and conducted with immediate incineration of remains, as partial tissue samples have been known to regenerate independently.'),
((SELECT id FROM subjects WHERE item = 'SCP-914'), 'Operated only by trained personnel following a standard request and approval process. The mechanism''s internal workings are not to be tampered with, as several early attempts at inspection resulted in unexplained malfunctions.'),
((SELECT id FROM subjects WHERE item = 'SCP-999'), 'Kept in a standard habitat with soft furnishings. Given its beneficial psychological effects, personnel may request supervised visits following particularly difficult incidents elsewhere in the facility.'),
((SELECT id FROM subjects WHERE item = 'SCP-1025'), 'Stored in a sealed case in restricted archives. Access requires medical clearance, and any read sessions are limited and supervised by on-site medical staff.'),
((SELECT id FROM subjects WHERE item = 'SCP-1048'), 'Housed in a padded containment room with limited loose material and continuous camera monitoring. Any constructed figures are to be catalogued and separated promptly.'),
((SELECT id FROM subjects WHERE item = 'SCP-1471'), 'Distribution of the application is restricted, and copies are held only on isolated devices with no network connectivity. Installation on any networked device is strictly forbidden pending further study.');

-- Seed incident/history logs
INSERT INTO incident_logs (subject_id, log_date, entry_text, sort_order) VALUES
((SELECT id FROM subjects WHERE item = 'SCP-002'), '██/██/19██', 'The object was recovered after a series of disappearances near its original discovery site; three individuals sent inside during initial testing did not return.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-002'), '██/██/20██', 'Since relocation, the interior has continued to acquire new furnishings at a slow, steady rate despite no further test subjects being introduced.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-004'), '██/██/19██', 'A retrieval team was dispatched after key SCP-004-7 was reported missing from secure storage; it was recovered undamaged before the door could be accessed with it.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-004'), '██/██/20██', 'Personnel assigned to routine key inventory reported a faint mechanical noise from beyond the door for the first time in over a year; no further anomalies were observed.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-035'), '██/██/20██', 'A maintenance worker in a nearby corridor reported an unusual compulsion to enter the containment chamber; the individual was reassigned and the case''s seal was reinforced.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-035'), '██/██/20██', 'A controlled test using a terminal subject confirmed the mask assumes motor control within minutes of being worn, with the original personality unresponsive for the test''s duration.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-049'), '██/██/20██', 'The subject was permitted supervised interviews for research purposes; it consistently expressed concern for staff it described as "already showing symptoms."', 1),
((SELECT id FROM subjects WHERE item = 'SCP-049'), '██/██/20██', 'A containment breach resulted in contact with two on-site personnel; both expired shortly after, with remains showing the subject''s characteristic necrotic transformation.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-079'), '██/██/19██', 'The subject was briefly connected to an internal test network for evaluation; it attempted to access adjoining systems within minutes before the connection was severed.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-079'), '██/██/20██', 'Routine interviews continue; the subject has expressed persistent interest in the extent of its physical surroundings and the facility''s network architecture.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-087'), '██/██/20██', 'A three-person survey team reported reaching a landing roughly 60 flights down before losing radio contact; recovered footage showed no clear cause for the disconnection.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-087'), '██/██/20██', 'A solo researcher descended approximately 20 flights and reported a faint, rhythmic sound growing louder before voluntarily aborting the expedition.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-093'), '██/██/20██', 'A five-person team activated the disc and reported an extended period of missing time upon return; two members exhibited mild disorientation for several days afterward.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-093'), '██/██/20██', 'A subsequent controlled expedition documented an unfamiliar coastal landscape before the team elected to return early.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-096'), '██/██/20██', 'A research photograph of the subject''s unhooded face was inadvertently leaked to an external server. The subject breached containment within the hour and pursued the individual across two sites before being neutralized.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-096'), '██/██/20██', 'A hood malfunction during a routine feeding briefly exposed the subject''s face to an assigned handler; the handler was evacuated and the subject was resealed without further incident.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-105'), '██/██/20██', 'A supervised test successfully retrieved a small object from within a photographed exterior location using the subject''s ability.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-105'), '██/██/20██', 'The subject requested and was granted additional recreational use of her ability under supervision, citing improved cooperation and morale.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-106'), '██/██/19██', 'The subject breached its containment chamber and was not resecured for several hours, during which two staff members were pulled into its pocket dimension; one was later recovered in a deteriorated state.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-106'), '██/██/20██', 'A retrieval device successfully extracted a missing staff member from the pocket dimension for the first time, though the individual was unresponsive for several days afterward.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-173'), '██/██/19██', 'Initial containment was established after the subject was recovered from a coastal excavation site. Two custodial staff sustained fatal injuries during transfer when visual contact briefly lapsed.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-173'), '██/██/20██', 'A routine inspection revealed the subject had rotated approximately 90 degrees within its cell overnight despite no reported break in observation; camera footage is under review.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-261'), '██/██/20██', 'A recovered item was identified as packaging from a currently operating retailer at a location the subject should have no access to; the retailer''s records showed no corresponding transaction.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-261'), '██/██/20██', 'An item dispensed during testing displayed labeling in a script not matching any known language; the item was archived for further study.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-294'), '██/██/20██', 'A request for a beverage matching a since-decommissioned SCP object''s properties was tested and confirmed to replicate a mild version of the original effect.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-294'), '██/██/20██', 'An ambiguous or joking request produced an inert grey liquid with no measurable properties, now considered the subject''s default response to invalid input.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-426'), '██/██/20██', 'New personnel are briefed in advance regarding the subject''s speech pattern to avoid unnecessary confusion during initial contact.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-426'), '██/██/20██', 'Extended interviews found no indication of awareness or intent beyond the self-referential speech pattern; the subject continues to function normally otherwise.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-500'), '██/██/20██', 'A pill was administered to a researcher suffering complications from an unrelated containment breach; full recovery was observed within minutes.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-500'), '██/██/20██', 'Testing confirmed the subject is effective even against conditions with no known conventional treatment, though it appears to have no effect on non-biological ailments.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-682'), '██/██/19██', 'An approved destruction test successfully reduced the subject to a fraction of its prior mass; full regeneration was observed within 48 hours.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-682'), '██/██/20██', 'A containment breach during transfer between chambers resulted in significant structural damage before the subject was re-secured using concentrated acid.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-914'), '██/██/20██', 'A standard-issue radio processed on an intermediate setting was returned as a significantly more advanced communication device of unknown origin.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-914'), '██/██/20██', 'An unauthorized object was fed into the machine on its highest setting; the resulting output was deemed too hazardous for further study and was destroyed.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-999'), '██/██/20██', 'The subject was brought to comfort a research team following a difficult incident in an adjacent wing; staff morale and stress indicators improved measurably afterward.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-999'), '██/██/20██', 'Routine observation continues to find no adverse effects from extended contact with the subject; several personnel have requested repeat visits.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-1025'), '██/██/20██', 'A researcher who read an entry describing a mild fictitious ailment reported matching symptoms within a day; the condition resolved without treatment inside a week.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-1025'), '██/██/20██', 'The book was cross-referenced against known medical literature; several described conditions have no match in any existing medical database.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-1048'), '██/██/20██', 'Overnight footage showed the subject had assembled two smaller figures from cell padding material; both were removed and the enclosure''s material was replaced with a non-workable substitute.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-1048'), '██/██/20██', 'A malfunction in monitoring equipment allowed the subject an extended unobserved period; several additional smaller figures were found upon inspection.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-1471'), '██/██/20██', 'A test device retained visual traces of the overlaid figure for several days after the application was uninstalled, gradually fading over the following week.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-1471'), '██/██/20██', 'The figure was observed appearing to react to events occurring outside the camera''s field of view on a test device, prompting a review of the subject''s containment protocols.', 2);

-- Seed appendices (Appendix/Addendum-style sub-documents)
INSERT INTO appendices (subject_id, heading, body, sort_order) VALUES
((SELECT id FROM subjects WHERE item = 'SCP-003'), 'Addendum 003-01', 'Analysis of the tablet''s inscriptions suggests it was constructed specifically to regulate the biological mass, rather than simply store it. Its point of origin and the identity of its makers remain unknown.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-003'), 'Addendum 003-02', 'A controlled warming test allowed the mass to briefly enter its growth phase under observation. Growth halted immediately once the temperature was returned to baseline, with no lasting change to the mass or the tablet.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-004'), 'Appendix A: Psychological Effects', 'Personnel who pass through the door using certain keys have returned in a catatonic or severely disoriented state, in some cases requiring long-term psychiatric care. Affected individuals consistently describe an overwhelming sense of scale and an intense, unplaceable fear response.', 1),
((SELECT id FROM subjects WHERE item = 'SCP-004'), 'Appendix B: Site-62', 'A secure facility was later constructed within the space accessed by one of the safer keys, now used for long-term storage and archival purposes. Personnel assigned to this facility are subject to additional residency requirements due to unresolved anomalies affecting the perceived passage of time on-site.', 2),

((SELECT id FROM subjects WHERE item = 'SCP-005'), 'Appendix A: Effectiveness Testing', 'The object reliably opens locking mechanisms it can identify as such. Testing indicates a significantly reduced success rate against locks that have been deliberately disguised or concealed, which has prompted researchers to tentatively classify the object''s underlying process as exhibiting some degree of independent judgement.', 1);
