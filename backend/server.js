require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const supabase = require('./supabaseClient');
const { authenticate, requireAdmin } = require('./middleware/auth');
const { validateIdParam, validateSubjectBody } = require('./middleware/validate');

const app = express();
// behind a hosting proxy (Vercel, Render, etc.) set TRUST_PROXY=1 so the rate
// limiter sees each visitor's real IP instead of the proxy's; leave unset when
// the server is exposed directly, otherwise clients could spoof their IP
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
app.use(helmet());
// comma-separated list of allowed frontend origins; unset means allow any (local dev)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim());
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

// only real image types are accepted, and the extension is derived from the
// MIME type rather than trusting the client-supplied filename
const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_EXTENSIONS[file.mimetype]) return cb(null, true);
    cb(Object.assign(new Error('Image must be a JPEG, PNG, WebP or GIF'), { status: 400 }));
  },
});

const SUBJECT_SELECT = 'id, item, description, image, created_at, object_classes(id, name, description), containment_procedures(id, procedure_text, updated_at), incident_logs(id, log_date, entry_text, sort_order), appendices(id, heading, body, sort_order)';

const IMAGE_BUCKET = 'SCP_IMGS';

// DB stores just the filename within the bucket; expand it to a public URL for the frontend
function withImageUrl(subject) {
  if (!subject?.image) return subject;
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(subject.image);
  return { ...subject, image: data.publicUrl };
}

// log the real database error server-side but only send the client a generic
// message, so table/column details never leak out
function sendDbError(res, error) {
  console.error(error);
  if (error.code === '23505') return res.status(409).json({ error: 'A subject with that item number already exists' });
  res.status(500).json({ error: 'Database error' });
}

function fetchFullSubject(id) {
  return supabase.from('subjects').select(SUBJECT_SELECT).eq('id', id).single();
}

async function getObjectClassId(className) {
  const { data, error } = await supabase
    .from('object_classes')
    .select('id')
    .eq('name', className)
    .single();
  if (error) return { error: `Unknown object class: ${className}` };
  return { id: data.id };
}

// GET all subjects
app.get('/api/subjects', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('subjects').select(SUBJECT_SELECT).order('item');
  if (error) return sendDbError(res, error);
  res.json(data.map(withImageUrl));
});

// GET one subject
app.get('/api/subjects/:id', authenticate, validateIdParam, async (req, res) => {
  const { data, error } = await fetchFullSubject(req.params.id);
  if (error) return res.status(404).json({ error: 'Subject not found' });
  res.json(withImageUrl(data));
});

// POST create subject
app.post('/api/subjects', authenticate, requireAdmin, validateSubjectBody({ partial: false }), async (req, res) => {
  const { item, class: scpClass, description, containment } = req.body;

  const { id: object_class_id, error: classError } = await getObjectClassId(scpClass);
  if (classError) return res.status(400).json({ error: classError });

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .insert([{ item, object_class_id, description }])
    .select('id')
    .single();
  if (subjectError) return sendDbError(res, subjectError);

  if (containment) {
    const { error: containmentError } = await supabase
      .from('containment_procedures')
      .insert([{ subject_id: subject.id, procedure_text: containment }]);
    if (containmentError) {
      // no transaction across the two tables, so undo the subject rather than leave it half-created
      await supabase.from('subjects').delete().eq('id', subject.id);
      return sendDbError(res, containmentError);
    }
  }

  const { data: fullSubject, error: fetchError } = await fetchFullSubject(subject.id);
  if (fetchError) return sendDbError(res, fetchError);

  res.status(201).json(withImageUrl(fullSubject));
});

// PUT update subject
app.put('/api/subjects/:id', authenticate, requireAdmin, validateIdParam, validateSubjectBody({ partial: true }), async (req, res) => {
  const { item, class: scpClass, description, containment } = req.body;
  const subjectUpdate = {};

  if (item !== undefined) subjectUpdate.item = item;
  if (description !== undefined) subjectUpdate.description = description;
  if (scpClass !== undefined) {
    const { id: object_class_id, error: classError } = await getObjectClassId(scpClass);
    if (classError) return res.status(400).json({ error: classError });
    subjectUpdate.object_class_id = object_class_id;
  }

  if (Object.keys(subjectUpdate).length > 0) {
    const { data: updated, error: subjectError } = await supabase
      .from('subjects')
      .update(subjectUpdate)
      .eq('id', req.params.id)
      .select('id');
    if (subjectError) return sendDbError(res, subjectError);
    if (updated.length === 0) return res.status(404).json({ error: 'Subject not found' });
  }

  if (containment !== undefined) {
    // not an upsert: containment_procedures has no unique constraint on subject_id
    const { data: existing, error: existingError } = await supabase
      .from('containment_procedures')
      .select('id')
      .eq('subject_id', req.params.id)
      .maybeSingle();
    if (existingError) return sendDbError(res, existingError);

    const { error: containmentError } = existing
      ? await supabase
        .from('containment_procedures')
        .update({ procedure_text: containment, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      : await supabase
        .from('containment_procedures')
        .insert([{ subject_id: req.params.id, procedure_text: containment }]);
    if (containmentError) return sendDbError(res, containmentError);
  }

  const { data: fullSubject, error: fetchError } = await fetchFullSubject(req.params.id);
  if (fetchError) return res.status(404).json({ error: 'Subject not found' });

  res.json(withImageUrl(fullSubject));
});

// POST upload/replace a subject's image
app.post('/api/subjects/:id/image', authenticate, requireAdmin, validateIdParam, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('item')
    .eq('id', req.params.id)
    .single();
  if (subjectError) return res.status(404).json({ error: 'Subject not found' });

  const safeName = subject.item.replace(/[^A-Za-z0-9._-]/g, '_');
  const filename = `${safeName}.${IMAGE_EXTENSIONS[req.file.mimetype]}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return sendDbError(res, uploadError);

  const { error: updateError } = await supabase
    .from('subjects')
    .update({ image: filename })
    .eq('id', req.params.id);
  if (updateError) return sendDbError(res, updateError);

  const { data: fullSubject, error: fetchError } = await fetchFullSubject(req.params.id);
  if (fetchError) return sendDbError(res, fetchError);

  res.json(withImageUrl(fullSubject));
});

// DELETE subject
app.delete('/api/subjects/:id', authenticate, requireAdmin, validateIdParam, async (req, res) => {
  const { error } = await supabase.from('subjects').delete().eq('id', req.params.id);
  if (error) return sendDbError(res, error);
  res.status(204).send();
});

// central error handler (Express 5 forwards async errors here too); multer
// errors such as a bad file type or oversize upload become 400s
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// exported so tests can drive the app without binding a port
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
