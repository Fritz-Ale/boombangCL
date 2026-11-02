'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const collection = require('../src/collections/PrivateScenesCollection');
test('island lookup matches string and numeric IDs from API/socket', () => {
  collection.collection.clear();
  const scene={id:201,island_id:'42'};
  collection.add(201,scene);
  assert.equal(collection.getByIslandId(42).length,1);
  assert.equal(collection.getById('201'),scene);
  collection.remove('201');
  assert.equal(collection.getAll().length,0);
  collection.collection.clear();
});
