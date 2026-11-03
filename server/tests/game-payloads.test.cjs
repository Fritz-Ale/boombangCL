'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const UserMoveController = require('../src/controllers/game/scenes/UserMoveController');
const UserSendChatController = require('../src/controllers/game/scenes/UserSendChatController');
const ConnectedUsersCollection = require('../src/collections/ConnectedUsersCollection');

test('malformed movement and chat payloads are ignored without disconnecting an authenticated player', async () => {
  const socket = { id: 'invalid-payload-test', emit() { throw Error('Unexpected emit'); } };
  const user = {
    currentArea: { movementBlocked: false, map_width: 2, map_height: 2, game_map: [[0, 0], [0, 0]] },
    movementBlocked: false,
    isActionBlocked: () => false,
    setFinalTarget() { throw Error('Invalid move was accepted'); },
  };
  const original = ConnectedUsersCollection.getBySocketId;
  ConnectedUsersCollection.getBySocketId = id => id === socket.id ? user : original.call(ConnectedUsersCollection, id);
  try {
    for (const payload of [null, undefined, {}, {x: 0.5, y: 1}, {x: '0', y: 1}, {x: Infinity, y: 1}, {x: 1, y: NaN}]) {
      await UserMoveController.main(socket, {}, payload);
    }
    for (const payload of [null, undefined, {}, {message: null}, {message: 42}, {message: '   '}]) {
      await UserSendChatController.main(socket, {}, payload);
    }
  } finally {
    ConnectedUsersCollection.getBySocketId = original;
  }
});
