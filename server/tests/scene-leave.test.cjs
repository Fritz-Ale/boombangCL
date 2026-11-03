'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const LeaveController = require('../src/controllers/game/scenes/UserLeaveSceneController');
const ConnectedUsersCollection = require('../src/collections/ConnectedUsersCollection');

test('leaving a room twice does not disconnect the player or emit critical errors', async () => {
  const emitted = [];
  const socket = { id:'leave-room-idempotency-test', emit(event) { emitted.push(event); } };
  const original = ConnectedUsersCollection.getBySocketId;
  const user = { currentArea:null, isActionBlocked() { throw Error('Must not inspect actions without an area'); } };
  ConnectedUsersCollection.getBySocketId = id => id === socket.id ? user : original.call(ConnectedUsersCollection,id);
  try {
    await LeaveController.main(socket, {});
    await LeaveController.main(socket, {});
    assert.deepEqual(emitted,[]);
    assert.equal(user.currentArea,null);
  } finally {
    ConnectedUsersCollection.getBySocketId = original;
  }
});

test('unauthenticated sockets can request room exit without a critical error', async () => {
  const emitted = [];
  const socket = { id:'unknown-room-exit-test', emit(event) { emitted.push(event); } };
  await LeaveController.main(socket, {});
  assert.deepEqual(emitted,[]);
});
