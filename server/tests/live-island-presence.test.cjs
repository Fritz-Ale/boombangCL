'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const file = name => fs.readFileSync(path.join(root, name), 'utf8');

function makeController(scenes, viewers, log = []) {
  const allUsers = [...viewers];
  const resources = { collection: values => values.map(island => ({ ...island })) };
  const deps = {
    '../../../utils/Log': { error: message => log.push(message) },
    '../../../collections/ConnectedUsersCollection': {
      getBySocketId: id => allUsers.find(user => user.socket.id === id),
      getAllNotInArea: () => allUsers.filter(user => !user.currentArea)
    },
    '../../../enums/ResponseSocketsEnum': { UPDATE_PUBLIC_ISLANDS: 'update_public_islands' },
    '../../../resources/IslandResource': resources,
    '../../../collections/PrivateScenesCollection': { getAll: () => scenes }
  };
  const context = {
    module: { exports: {} },
    require: name => {
      if (!deps[name]) throw Error('Unexpected dependency: ' + name);
      return deps[name];
    },
    console
  };
  vm.runInNewContext(file('src/controllers/game/islands/GetPublicIslandsController.js'), context);
  return context.module.exports;
}

function viewer(id, area = null) {
  const messages = [];
  return {
    currentArea: area,
    messages,
    socket: { id, emit: (event, data) => messages.push({ event, data }) }
  };
}

test('island visitor list is broadcast live after joins and leaves, without restarting lobby', async () => {
  const lobbyA = viewer('a');
  const lobbyB = viewer('b');
  const inRoom = viewer('c', { id: 10 });
  const island = { id: 42, name: 'Chile', userId: 11, visitors: 78 };
  const scene1 = { island, users: [inRoom] };
  const scene2 = { island, users: [viewer('d', { id: 20 }), viewer('e', { id: 20 })] };
  const controller = makeController([scene1, scene2], [lobbyA, lobbyB, inRoom]);

  controller.broadcastToLobby();
  assert.equal(lobbyA.messages.length, 1);
  assert.equal(lobbyB.messages.length, 1);
  assert.equal(inRoom.messages.length, 0, 'users in area should not receive lobby snapshots');
  assert.equal(lobbyA.messages[0].data.islands.length, 1);
  assert.equal(lobbyA.messages[0].data.islands[0].visitors, 3);
  assert.equal(lobbyA.messages[0].data.islands[0].userId, 11, 'metadata must survive snapshot');

  scene1.users.push(viewer('f', { id: 10 }));
  controller.broadcastToLobby();
  assert.equal(lobbyA.messages[1].data.islands[0].visitors, 4);
  scene2.users.length = 0;
  controller.broadcastToLobby();
  assert.equal(lobbyB.messages[2].data.islands[0].visitors, 2);
  await controller.main(lobbyA.socket);
  assert.equal(lobbyA.messages[3].data.islands[0].visitors, 2);
});

test('empty island presence produces a valid empty snapshot', () => {
  const lobby = viewer('lobby');
  const controller = makeController([], [lobby]);
  controller.broadcastToLobby();
  assert.equal(lobby.messages[0].event, 'update_public_islands');
  assert.equal(lobby.messages[0].data.islands.length, 0);
});

test('server notifies lobby when private room users join or leave', () => {
  const privateScene = file('src/models/PrivateSceneModel.js');
  const removeUser = file('src/tasks/RemoveUserFromSceneTask.js');
  assert.match(privateScene, /GetPublicIslandsController\.broadcastToLobby\(\)/);
  assert.match(removeUser, /SceneTypesEnum\.PRIVATE_SCENE[\s\S]*?GetPublicIslandsController\.broadcastToLobby\(\)/);
});
