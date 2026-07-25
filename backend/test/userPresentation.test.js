const test = require('node:test');
const assert = require('node:assert/strict');

const { presentUser } = require('../utils/userPresentation');

test('presents one consistent user shape to the frontend', () => {
  assert.deepEqual(presentUser({
    _id: 'user-1',
    email: 'owner@example.com',
    name: 'Owner Name',
    role: 'admin',
    createdAt: '2026-07-16T08:00:00.000Z',
    password: 'never-return-this',
  }), {
    _id: 'user-1',
    id: 'user-1',
    email: 'owner@example.com',
    name: 'Owner Name',
    fullName: 'Owner Name',
    role: 'admin',
    createdAt: '2026-07-16T08:00:00.000Z',
  });
});

test('supports legacy fullName records and missing creation dates', () => {
  assert.deepEqual(presentUser({
    _id: 'legacy-1',
    email: 'legacy@example.com',
    fullName: 'Legacy User',
    role: 'user',
  }), {
    _id: 'legacy-1',
    id: 'legacy-1',
    email: 'legacy@example.com',
    name: 'Legacy User',
    fullName: 'Legacy User',
    role: 'user',
    createdAt: null,
  });
});
