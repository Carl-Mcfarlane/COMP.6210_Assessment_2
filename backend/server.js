require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const supabase = require('./supabaseClient');
const { authenticate, requireAdmin } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SUBJECT_SELECT = 'id, item, description, image, created_at, object_classes(id, name, description), containment_procedures(id, procedure_text, updated_at), incident_logs(id, log_date, entry_text, sort_order), appendices(id, heading, body, sort_order)';

const IMAGE_BUCKET = 'SCP_IMGS';

// DB stores just the filename within the bucket; expand it to a public URL for the frontend
function withImageUrl(subject) {
  if (!subject?.image) return subject;
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(subject.image);
  return { ...subject, image: data.publicUrl };
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
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(withImageUrl));
});

// GET one subject
app.get('/api/subjects/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('subjects')
    .select(SUBJECT_SELECT)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(withImageUrl(data));
});

// POST create subject
app.post('/api/subjects', authenticate, requireAdmin, async (req, res) => {
  const { item, class: scpClass, description, image, containment } = req.body;

  const { id: object_class_id, error: classError } = await getObjectClassId(scpClass);
  if (classError) return res.status(400).json({ error: classError });

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .insert([{ item, object_class_id, description, image }])
    .select(SUBJECT_SELECT)
    .single();
  if (subjectError) return res.status(500).json({ error: subjectError.message });

  if (containment) {
    const { error: containmentError } = await supabase
      .from('containment_procedures')
      .insert([{ subject_id: subject.id, procedure_text: containment }]);
    if (containmentError) return res.status(500).json({ error: containmentError.message });
  }

  const { data: fullSubject, error: fetchError } = await supabase
    .from('subjects')
    .select(SUBJECT_SELECT)
    .eq('id', subject.id)
    .single();
  if (fetchError) return res.status(500).json({ error: fetchError.message });

  res.status(201).json(withImageUrl(fullSubject));
});

// PUT update subject
app.put('/api/subjects/:id', authenticate, requireAdmin, async (req, res) => {
  const { item, class: scpClass, description, image, containment } = req.body;
  const subjectUpdate = {};

  if (item !== undefined) subjectUpdate.item = item;
  if (description !== undefined) subjectUpdate.description = description;
  if (image !== undefined) subjectUpdate.image = image;
  if (scpClass !== undefined) {
    const { id: object_class_id, error: classError } = await getObjectClassId(scpClass);
    if (classError) return res.status(400).json({ error: classError });
    subjectUpdate.object_class_id = object_class_id;
  }

  if (Object.keys(subjectUpdate).length > 0) {
    const { error: subjectError } = await supabase
      .from('subjects')
      .update(subjectUpdate)
      .eq('id', req.params.id);
    if (subjectError) return res.status(500).json({ error: subjectError.message });
  }

  if (containment !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from('containment_procedures')
      .select('id')
      .eq('subject_id', req.params.id)
      .maybeSingle();
    if (existingError) return res.status(500).json({ error: existingError.message });

    if (existing) {
      const { error: updateError } = await supabase
        .from('containment_procedures')
        .update({ procedure_text: containment, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateError) return res.status(500).json({ error: updateError.message });
    } else {
      const { error: insertError } = await supabase
        .from('containment_procedures')
        .insert([{ subject_id: req.params.id, procedure_text: containment }]);
      if (insertError) return res.status(500).json({ error: insertError.message });
    }
  }

  const { data: fullSubject, error: fetchError } = await supabase
    .from('subjects')
    .select(SUBJECT_SELECT)
    .eq('id', req.params.id)
    .single();
  if (fetchError) return res.status(500).json({ error: fetchError.message });

  res.json(withImageUrl(fullSubject));
});

// POST upload/replace a subject's image
app.post('/api/subjects/:id/image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('item')
    .eq('id', req.params.id)
    .single();
  if (subjectError) return res.status(404).json({ error: subjectError.message });

  const ext = req.file.originalname.split('.').pop();
  const filename = `${subject.item}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { error: updateError } = await supabase
    .from('subjects')
    .update({ image: filename })
    .eq('id', req.params.id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  const { data: fullSubject, error: fetchError } = await supabase
    .from('subjects')
    .select(SUBJECT_SELECT)
    .eq('id', req.params.id)
    .single();
  if (fetchError) return res.status(500).json({ error: fetchError.message });

  res.json(withImageUrl(fullSubject));
});

// DELETE subject
app.delete('/api/subjects/:id', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase.from('subjects').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
