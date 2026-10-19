const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./fakeSupabase');

// swap the real Supabase client for the in-memory fake before the app loads
const fake = createFakeSupabase();
const clientPath = require.resolve('../supabaseClient');
require.cache[clientPath] = { id: clientPath, filename: clientPath, loaded: true, exports: fake };
process.env.CORS_ORIGIN = '';

const app = require('../server');

let server;
let base;
const aliceToken = fake.addUser({ id: 'alice', email: 'alice@test.dev' });
const bobToken = fake.addUser({ id: 'bob', email: 'bob@test.dev' });
const adminToken = fake.addUser({ id: 'root', email: 'root@test.dev', role: 'admin' });

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());

function api(path, { token, method = 'GET', json, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers['Content-Type'] = 'application/json';
  return fetch(`${base}/api${path}`, { method, headers, body: json ? JSON.stringify(json) : body });
}

const newSubject = (item) => ({ item, class: 'Euclid', description: 'A test subject.' });

test('anonymous visitors can list and read subjects', async () => {
  const subject = fake.addSubject({ item: 'SCP-001', created_by: 'alice' });
  const list = await api('/subjects');
  assert.equal(list.status, 200);
  assert.ok((await list.json()).some((s) => s.item === 'SCP-001'));

  const one = await api(`/subjects/${subject.id}`);
  assert.equal(one.status, 200);
  const body = await one.json();
  assert.equal(body.can_edit, false);
  assert.equal('created_by' in body, false, 'owner id must not be exposed');
});

test('creating requires a signed-in user', async () => {
  const response = await api('/subjects', { method: 'POST', json: newSubject('SCP-100') });
  assert.equal(response.status, 401);
});

test('an invalid token is rejected on writes but ignored on reads', async () => {
  const write = await api('/subjects', { method: 'POST', token: 'nope', json: newSubject('SCP-101') });
  assert.equal(write.status, 401);
  assert.equal((await api('/subjects', { token: 'nope' })).status, 200);
});

test('a signed-in user can create a subject and owns it', async () => {
  const response = await api('/subjects', {
    method: 'POST',
    token: aliceToken,
    json: { ...newSubject('SCP-200'), containment: 'Lock it.' },
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.item, 'SCP-200');
  assert.equal(body.object_classes.name, 'Euclid');
  assert.equal(body.can_edit, true);
  assert.equal(fake.tables.subjects.find((s) => s.item === 'SCP-200').created_by, 'alice');
});

test('create rejects invalid input with 400', async () => {
  const badBodies = [
    { ...newSubject('SCP-201'), class: 'Thaumiel' },
    newSubject('../evil'),
    { item: 'SCP-202', class: 'Safe' },
  ];
  for (const bad of badBodies) {
    const response = await api('/subjects', { method: 'POST', token: aliceToken, json: bad });
    assert.equal(response.status, 400, JSON.stringify(bad));
  }
});

test('a duplicate item number returns 409', async () => {
  await api('/subjects', { method: 'POST', token: aliceToken, json: newSubject('SCP-300') });
  const again = await api('/subjects', { method: 'POST', token: bobToken, json: newSubject('SCP-300') });
  assert.equal(again.status, 409);
});

test('owners can update and delete their own subject', async () => {
  const subject = fake.addSubject({ item: 'SCP-400', created_by: 'alice' });
  const update = await api(`/subjects/${subject.id}`, {
    method: 'PUT',
    token: aliceToken,
    json: { description: 'Updated.' },
  });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).description, 'Updated.');

  const removed = await api(`/subjects/${subject.id}`, { method: 'DELETE', token: aliceToken });
  assert.equal(removed.status, 204);
  assert.equal((await api(`/subjects/${subject.id}`)).status, 404);
});

test('other users cannot update or delete a subject they do not own', async () => {
  const subject = fake.addSubject({ item: 'SCP-500', created_by: 'alice' });
  const update = await api(`/subjects/${subject.id}`, {
    method: 'PUT',
    token: bobToken,
    json: { description: 'Hacked.' },
  });
  assert.equal(update.status, 403);
  const removed = await api(`/subjects/${subject.id}`, { method: 'DELETE', token: bobToken });
  assert.equal(removed.status, 403);
  assert.equal(fake.tables.subjects.find((s) => s.id === subject.id).description, 'desc');
});

test('anonymous visitors cannot update or delete', async () => {
  const subject = fake.addSubject({ item: 'SCP-501', created_by: 'alice' });
  const update = await api(`/subjects/${subject.id}`, { method: 'PUT', json: { description: 'x' } });
  assert.equal(update.status, 401);
  assert.equal((await api(`/subjects/${subject.id}`, { method: 'DELETE' })).status, 401);
});

test('admins can change any subject, including ones with no owner', async () => {
  const owned = fake.addSubject({ item: 'SCP-600', created_by: 'alice' });
  const orphan = fake.addSubject({ item: 'SCP-601', created_by: null });
  const update = await api(`/subjects/${owned.id}`, {
    method: 'PUT',
    token: adminToken,
    json: { description: 'Admin edit.' },
  });
  assert.equal(update.status, 200);
  const removed = await api(`/subjects/${orphan.id}`, { method: 'DELETE', token: adminToken });
  assert.equal(removed.status, 204);
});

test('ownerless subjects are admin-only for ordinary users', async () => {
  const orphan = fake.addSubject({ item: 'SCP-602', created_by: null });
  const removed = await api(`/subjects/${orphan.id}`, { method: 'DELETE', token: aliceToken });
  assert.equal(removed.status, 403);
});

test('unknown and malformed ids', async () => {
  const missing = await api('/subjects/99999', { method: 'PUT', token: adminToken, json: { description: 'x' } });
  assert.equal(missing.status, 404);
  assert.equal((await api('/subjects/abc')).status, 400);
});

function imageForm(type, name) {
  const form = new FormData();
  form.append('image', new Blob([new Uint8Array([1, 2, 3])], { type }), name);
  return form;
}

test('image upload derives a safe filename and extension from the item and MIME type', async () => {
  const subject = fake.addSubject({ item: 'SCP 700/x', created_by: 'alice' });
  const response = await api(`/subjects/${subject.id}/image`, {
    method: 'POST',
    token: aliceToken,
    body: imageForm('image/png', 'whatever.exe'),
  });
  assert.equal(response.status, 200);
  assert.equal(fake.uploads.at(-1).name, 'SCP_700_x.png');
  assert.equal((await response.json()).image, 'https://storage.test/SCP_700_x.png');
});

test('image upload rejects non-image files', async () => {
  const subject = fake.addSubject({ item: 'SCP-701', created_by: 'alice' });
  const response = await api(`/subjects/${subject.id}/image`, {
    method: 'POST',
    token: aliceToken,
    body: imageForm('text/html', 'x.html'),
  });
  assert.equal(response.status, 400);
});

test('image upload is refused for a subject the user does not own', async () => {
  const subject = fake.addSubject({ item: 'SCP-702', created_by: 'alice' });
  const response = await api(`/subjects/${subject.id}/image`, {
    method: 'POST',
    token: bobToken,
    body: imageForm('image/png', 'a.png'),
  });
  assert.equal(response.status, 403);
});
