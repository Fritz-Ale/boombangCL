const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const UserResource = require('../src/resources/UserResource');

test('los perfiles públicos no exponen JWT ni herramientas administrativas', () => {
  const user = {
    id: 101,
    socket: { id: 'socket-101' },
    username: 'Keko',
    avatarId: 12,
    authJwt: 'sensitive-session-token',
    adminTools: { power: 'secret' },
    lobbyTutorial: { preference: 'private' },
    currentAreaPosition: { x: 1, y: 2, z: 3 },
  };
  const resource = new UserResource(user);
  const privateProfile = resource.toObject();
  const publicProfile = resource.toPublicObject();
  assert.equal(privateProfile.authJwt, 'sensitive-session-token');
  for (const key of ['authJwt', 'admin_tools', 'lobby_tutorial']) {
    assert.equal(Object.hasOwn(publicProfile, key), false, 'fuga de ' + key);
  }
  assert.equal(publicProfile.username, 'Keko');
  assert.equal(publicProfile.avatar_id, 12);
  assert.equal(publicProfile.x, 1);
});

test('todos los eventos compartidos de sala usan perfil público', () => {
  const paths = [
    'controllers/game/scenes/UserJoinPublicSceneController.js',
    'controllers/game/scenes/SendUserToSceneController.js',
    'controllers/game/scenes/UserForcedJoinSceneController.js',
    'controllers/game/scenes/GetPublicSceneUsersController.js',
    'controllers/game/scenes/UserSyncController.js',
  ];
  for (const part of paths) {
    const contents = fs.readFileSync(path.join(__dirname, '../src/', part), 'utf8');
    assert.match(contents, /toPublicObject\(\)/, 'falta perfil público: ' + part);
  }
});

test('mensajes directos requieren usuario autenticado y texto válido', () => {
  const filename = path.resolve(__dirname, '../src/sockets/connectionSockets.js');
  const source = fs.readFileSync(filename, 'utf8');
  const handlers = {};
  const emits = [], sends = [];
  let sender = null;
  const fakeSocket = {
    id: 'origin',
    on: (event, handler) => { handlers[event] = handler; },
    emit: (event, data) => emits.push({ event, data }),
  };
  const collection = {
    getBySocketId: () => sender,
    getAll: () => [],
    getSocketIdByUserId: () => 'target',
  };
  const enumValues = { DISCONNECT: 'disconnect', GET_CONNECTED_USERS: 'list', USER_SEND_MESSAGE: 'message' };
  const context = {
    module: { exports: {} },
    require: name => {
      if (name.endsWith('ConnectedUsersCollection')) return collection;
      if (name.endsWith('RequestSocketsEnum')) return enumValues;
      if (name.endsWith('DisconnectUserController')) return { main: () => {} };
      if (name.endsWith('UserResource')) return UserResource;
      throw new Error('Unexpected dependency ' + name);
    },
  };
  vm.runInNewContext(source, context, { filename });
  context.module.exports(fakeSocket, {
    to: () => ({ emit: (event, data) => sends.push({ event, data }) }),
  });
  handlers.message({ recipientId: 101, message: 'hola' });
  assert.equal(sends.length, 0, 'una sesión sin login no envía mensajes');
  sender = { id: 9, username: 'Emisor' };
  handlers.message({ recipientId: 101, message: 'x'.repeat(501) });
  assert.equal(sends.length, 0, 'límite de tamaño');
  handlers.message({ recipientId: 101, message: ' hola ' });
  assert.equal(sends.length, 1);
  assert.equal(sends[0].data.message, 'hola');
  assert.equal(sends[0].data.senderName, 'Emisor');
});
