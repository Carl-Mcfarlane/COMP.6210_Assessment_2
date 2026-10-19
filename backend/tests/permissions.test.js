const test = require('node:test');
const assert = require('node:assert/strict');

// auth.js builds a Supabase client on import, so give it dummy credentials
process.env.SUPABASE_URL ??= 'http://localhost';
process.env.SUPABASE_KEY ??= 'test';
const { canModify } = require('../middleware/auth');

const owner = { id: 'user-1', role: 'user' };
const stranger = { id: 'user-2', role: 'user' };
const admin = { id: 'admin-1', role: 'admin' };

test('owners can modify their own subjects', () => {
  assert.equal(canModify(owner, { created_by: 'user-1' }), true);
});

test('other users cannot modify someone else\'s subject', () => {
  assert.equal(canModify(stranger, { created_by: 'user-1' }), false);
});

test('admins can modify anything, including subjects with no owner', () => {
  assert.equal(canModify(admin, { created_by: 'user-1' }), true);
  assert.equal(canModify(admin, { created_by: null }), true);
});

test('ownerless subjects are admin-only', () => {
  assert.equal(canModify(owner, { created_by: null }), false);
});

test('anonymous visitors can modify nothing', () => {
  assert.equal(canModify(null, { created_by: 'user-1' }), false);
});
