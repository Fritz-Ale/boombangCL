'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const JoinController = require('../src/controllers/game/scenes/UserJoinPublicSceneController');
const ConnectedUsersCollection = require('../src/collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../src/enums/ResponseSocketsEnum');
const MenuTypeEnum = require('../src/enums/MenuTypeEnum');

test('invalid public scene requests are rejected without mutating the player', async () => {
  const replies = [];
  const socket = { id:'scene-request-validation-test', emit(name, payload) { replies.push({name,payload}); } };
  const user = { currentArea:null, setArea() { throw Error('Invalid request mutated player'); } };
  const original = ConnectedUsersCollection.getBySocketId;
  ConnectedUsersCollection.getBySocketId = id => id === socket.id ? user : original.call(ConnectedUsersCollection,id);
  try {
    const bad = [null, undefined, {}, {menuType:99,sceneUuid:'abc'},
      {menuType:MenuTypeEnum.PUBLIC_SCENE,sceneUuid:''},
      {menuType:MenuTypeEnum.GAME_SCENE,sceneUuid:42},
      {menuType:MenuTypeEnum.PUBLIC_SCENE,sceneUuid:'x'.repeat(129)}];
    for (const payload of bad) {
      await JoinController.main(socket, {}, payload);
    }
    assert.equal(replies.length,bad.length);
    for (const {name,payload} of replies) {
      assert.equal(name,ResponseSocketsEnum.JOIN_PUBLIC_SCENE);
      assert.equal(payload.success,false);
      assert.equal(payload.message,'Invalid scene request');
    }
  } finally {
    ConnectedUsersCollection.getBySocketId = original;
  }
});
