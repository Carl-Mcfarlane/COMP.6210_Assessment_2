require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET all subjects
app.get('/api/subjects', async (req, res) => {
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET one subject
app.get('/api/subjects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// POST create subject
app.post('/api/subjects', async (req, res) => {
  const { item, class: scpClass, description, containment } = req.body;
  const { data, error } = await supabase
    .from('subjects')
    .insert([{ item, class: scpClass, description, containment }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update subject
app.put('/api/subjects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('subjects')
    .update(req.body)
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE subject
app.delete('/api/subjects/:id', async (req, res) => {
  const { error } = await supabase.from('subjects').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));