const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  normalizePagination,
} = require('../utils/pagination');

test('uses a practical default page size and exposes all pages', () => {
  assert.deepEqual(normalizePagination({}, 63), {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    skip: 0,
    pages: 3,
  });
});

test('returns the requested historical page', () => {
  assert.deepEqual(normalizePagination({ page: '3', limit: '25' }, 63), {
    page: 3,
    limit: 25,
    skip: 50,
    pages: 3,
  });
});

test('clamps invalid pages and oversized limits', () => {
  assert.deepEqual(normalizePagination({ page: '999', limit: '1000' }, 137), {
    page: 2,
    limit: MAX_PAGE_SIZE,
    skip: 100,
    pages: 2,
  });
  assert.deepEqual(normalizePagination({ page: '-4', limit: 'nope' }, 0), {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    skip: 0,
    pages: 1,
  });
});
