const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIdParam, validateSubjectBody } = require('../middleware/validate');

// minimal stand-ins for Express req/res/next
function run(middleware, req) {
  const result = { nextCalled: false, status: null, body: null };
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
  };
  middleware(req, res, () => { result.nextCalled = true; });
  return result;
}

test('validateIdParam accepts positive integers', () => {
  assert.ok(run(validateIdParam, { params: { id: '42' } }).nextCalled);
});

test('validateIdParam rejects non-numeric and zero ids', () => {
  for (const id of ['abc', '0', '-1', '1; drop table', '1.5']) {
    assert.equal(run(validateIdParam, { params: { id } }).status, 400, id);
  }
});

const valid = { item: 'SCP-173', class: 'Euclid', description: 'A statue.' };

test('create accepts a valid body, with or without containment', () => {
  const create = validateSubjectBody({ partial: false });
  assert.ok(run(create, { body: valid }).nextCalled);
  assert.ok(run(create, { body: { ...valid, containment: 'Keep it watched.' } }).nextCalled);
});

test('create rejects missing or invalid fields', () => {
  const create = validateSubjectBody({ partial: false });
  assert.equal(run(create, { body: undefined }).status, 400);
  assert.equal(run(create, { body: { ...valid, item: '../etc/passwd' } }).status, 400);
  assert.equal(run(create, { body: { ...valid, class: 'Thaumiel' } }).status, 400);
  assert.equal(run(create, { body: { ...valid, description: '   ' } }).status, 400);
  assert.equal(run(create, { body: { ...valid, containment: 5 } }).status, 400);
});

test('update allows partial bodies but still validates what is present', () => {
  const update = validateSubjectBody({ partial: true });
  assert.ok(run(update, { body: { description: 'New text' } }).nextCalled);
  assert.ok(run(update, { body: {} }).nextCalled);
  assert.equal(run(update, { body: { class: 'Nope' } }).status, 400);
});
