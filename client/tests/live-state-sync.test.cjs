'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const root = path.resolve(__dirname, '..');
function loadComponent(file, globals = {}) {
  const contents = fs.readFileSync(path.join(root, file), 'utf8');
  const match = contents.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, file + ' must include a normal Vue script');
  const code = match[1]
    .replace(/^import .*;\s*$/gm, '')
    .replace(/export default\s*\{/, 'module.exports = {');
  const context = { module: { exports: {} }, console, ...globals };
  vm.runInNewContext(code, context, { filename: file });
  return context.module.exports;
}
function instance(options) {
  const ctx = { ...(options.data?.() || {}) };
  ctx.$emit = () => {};
  ctx.$t = name => name;
  ctx.$nextTick = callback => callback();
  for (const [key, method] of Object.entries(options.methods || {})) {
    ctx[key] = method.bind(ctx);
  }
  return ctx;
}
function mockSocket() {
  const socket = new EventEmitter();
  const sent = [];
  const originalEmit = socket.emit.bind(socket);
  socket.emit = (event, ...payload) => {
    sent.push([event, ...payload]);
    return originalEmit(event, ...payload);
  };
  return { socket, sent };
}
const events = {
  MINIGAME_JOIN: 'minigame_join', MINIGAME_CALL_NOTIFICATION: 'minigame_notice',
  JOIN_PUBLIC_SCENE: 'join_public', JOIN_ISLAND: 'join_island', JOIN_PRIVATE_SCENE: 'join_private',
  JOIN_PRIVATE_SCENE_ERROR: 'join_private_error', ERROR_ISLAND_NOT_FOUND: 'island_not_found',
  UPDATE_PUBLIC_SCENES: 'public_list', GET_MY_ISLANDS: 'my_islands',
  UPDATE_GAME_SCENES: 'games_list', UPDATE_PUBLIC_ISLANDS: 'public_islands'
};
const request = {
  GET_PUBLIC_SCENES: 'get_public', GET_MY_ISLANDS: 'get_my_islands',
  GET_GAME_SCENES: 'get_games', GET_PUBLIC_ISLANDS: 'get_public_islands',
  JOIN_PUBLIC_SCENE: 'join_public_request', JOIN_ISLAND: 'join_island_request'
};

test('router keeps independent socket listeners alive and frees only its own', () => {
  const { socket } = mockSocket();
  let globalCount = 0;
  socket.on(events.JOIN_PUBLIC_SCENE, () => globalCount++);
  const options = loadComponent('src/views/screens/game/GameScreens.vue', {
    socket, ResponseSocketsEnum: events, MenuTypeEnum: { PUBLIC_SCENE: 1 },
    GameScreensEnum: { LOBBY: 0, PUBLIC_SCENE: 1, GAME_SCENE: 2, PRIVATE_SCENE: 3 },
    earlyEventBuffer: { activate() {} }, defineAsyncComponent: () => ({})
  });
  const ctx = instance(options);
  options.mounted.call(ctx);
  socket.emit(events.JOIN_PUBLIC_SCENE, {
    success: true, data: { scenery: { type: 10, menu_type: 1 } }
  });
  assert.equal(ctx.currentScreen, 1);
  assert.equal(globalCount, 1);
  options.beforeUnmount.call(ctx);
  socket.emit(events.JOIN_PUBLIC_SCENE, {
    success: true, data: { scenery: { type: 10, menu_type: 1 } }
  });
  assert.equal(globalCount, 2, 'global subscriber must survive router unmount');
  assert.equal(socket.listenerCount(events.JOIN_PUBLIC_SCENE), 1);
  assert.equal(socket.listenerCount(events.JOIN_PRIVATE_SCENE), 0);
});

test('lobby applies pushed area/island updates without recreating component', () => {
  const { socket, sent } = mockSocket();
  let thirdPartyEvents = 0;
  socket.on(events.UPDATE_PUBLIC_SCENES, () => thirdPartyEvents++);
  const options = loadComponent('src/views/screens/game/LobbyScreen.vue', {
    socket, RequestSocketsEnum: request, ResponseSocketsEnum: events,
    useLobbyStore: () => ({ activeTab: 'areas' }), mapActions: () => ({}), mapState: () => ({}),
    UiElementsComponent: {}, LobbyTabs: {}, AreasTab: {}, GamesTab: {}, IslandsTab: {},
    SearchTab: {}, ErrorAlertPopup: {}, LobbyTutorialComponent: {}
  });
  const ctx = instance(options);
  options.created.call(ctx);
  assert.ok(sent.some(([evt]) => evt === request.GET_PUBLIC_SCENES));
  assert.ok(sent.some(([evt]) => evt === request.GET_MY_ISLANDS));
  socket.emit(events.UPDATE_PUBLIC_SCENES, [{ uuid: 'ufo', total_users_in: 3 }]);
  socket.emit(events.GET_MY_ISLANDS, { islands: [{ id: 8, name: 'Chile' }] });
  assert.equal(ctx.publicScenes[0].total_users_in, 3);
  assert.equal(ctx.myIslands[0].id, 8);
  socket.emit(events.UPDATE_PUBLIC_SCENES, [{ uuid: 'ufo', total_users_in: 4 }]);
  assert.equal(ctx.publicScenes[0].total_users_in, 4, 'push must refresh current lobby');
  options.beforeUnmount.call(ctx);
  assert.equal(socket.listenerCount(events.UPDATE_PUBLIC_SCENES), 1);
  assert.equal(thirdPartyEvents, 2);
});

test('games and public-island panels release their own listeners', () => {
  for (const [file, responseName, requestName, key, payload] of [
    ['src/views/components/game/lobby/GamesTabComponent.vue', 'UPDATE_GAME_SCENES', 'GET_GAME_SCENES', 'gameScenes', [{ uuid: 'ring' }]],
    ['src/views/components/game/lobby/PublicIslandsComponent.vue', 'UPDATE_PUBLIC_ISLANDS', 'GET_PUBLIC_ISLANDS', 'islands', { islands: [{ id: 55 }] }]
  ]) {
    const { socket, sent } = mockSocket();
    const options = loadComponent(file, {
      socket, RequestSocketsEnum: request, ResponseSocketsEnum: events,
      MenuTypeEnum: { GAME_SCENE: 1 }, SpinnerComponent: {}
    });
    const ctx = instance(options);
    options.created.call(ctx);
    assert.ok(sent.some(([event]) => event === request[requestName]));
    socket.emit(events[responseName], payload);
    assert.equal(ctx[key].length, 1);
    options.beforeUnmount.call(ctx);
    assert.equal(socket.listenerCount(events[responseName]), 0);
  }
});

test('disconnect destroys Phaser and returns to JWT login without location.reload', () => {
  const { socket } = mockSocket();
  const removed = [];
  const storage = { removeItem: key => removed.push(key) };
  const options = loadComponent('src/App.vue', {
    socket, GameScreensEnum: { LOGIN: 0 }, localStorage: storage,
    defineAsyncComponent: () => ({}),
    Phaser: {}, ColorReplacePipelinePlugin: {}, gameConfig: {}, visibilityManager: {}
  });
  const ctx = instance(options);
  let destroyed = 0;
  ctx.gamePhaser = { destroy: () => destroyed++ };
  ctx.isAuthenticated = true;
  options.methods.handleDisconnect.call(ctx);
  assert.equal(ctx.isAuthenticated, false);
  assert.equal(ctx.gamePhaser, null);
  assert.equal(destroyed, 1);
  assert.equal(removed.length, 0, 'transient disconnect must preserve existing JWT');
  options.methods.handleCriticalError.call(ctx);
  assert.deepEqual(removed, ['app_jwt']);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8'), /location\.reload\(/);
});

test('login form preserves third-party authentication listeners and avoids forced reload', () => {
  const { socket, sent } = mockSocket();
  socket.connected = false;
  const old = { key: 'app_jwt', value: 'example-token' };
  let token = old.value;
  const options = loadComponent('src/views/components/auth/LoginFormComponent.vue', {
    socket,
    RequestSocketsEnum: { JWT_AUTO_LOGIN: 'jwt_auto_login' },
    ResponseSocketsEnum: {
      LOGIN_SUCCESS: 'login_success',
      LOGIN_ERROR: 'login_error',
      JWT_AUTO_LOGIN_INVALID: 'invalid_jwt'
    },
    localStorage: { getItem: () => token, removeItem: () => { token = null; }, setItem() {} },
    useLanguageStore: () => ({}),
    asset_button_image: '', asset_warning_image: '', GoogleLoginComponent: {},
  });
  const ctx = instance(options);
  ctx.languageStore = { setLocale: async () => {} };
  ctx.$refs = { username: { focus() {} } };
  let anotherListener = 0;
  socket.on('login_success', () => anotherListener++);
  options.mounted.call(ctx);
  assert.equal(sent.filter(([event]) => event === 'jwt_auto_login').length, 0, 'never emit auth on disconnected transport');
  socket.connected = true;
  socket.emit('connect');
  assert.equal(sent.filter(([event, data]) => event === 'jwt_auto_login' && data.authJwt === old.value).length, 1);
  socket.emit('connect');
  assert.equal(sent.filter(([event]) => event === 'jwt_auto_login').length, 1, 'duplicate connect must not repeat JWT request');
  socket.emit('invalid_jwt');
  assert.equal(ctx.loading, false);
  assert.equal(token, null);
  options.beforeUnmount.call(ctx);
  socket.emit('login_success', { user: { lang: 'es' } });
  assert.equal(anotherListener, 1);
  assert.equal(socket.listenerCount('login_success'), 1);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/views/components/auth/LoginFormComponent.vue'), 'utf8'), /location\.reload\(/);
});

test('public backpack reconciles snapshots and live delta events with unmount cleanup', () => {
  const code = fs.readFileSync(path.join(root, 'src/views/components/game/scenes/public/InventoryPublicSceneComponent.vue'), 'utf8');
  assert.match(code, /socket\.on\(ResponseSocketsEnum\.PUBLIC_INVENTORY_DATA, handleInventorySnapshot\)/);
  assert.match(code, /socket\.on\(ResponseSocketsEnum\.ADD_ITEM_TO_INVENTORY, handleItemAdded\)/);
  assert.match(code, /socket\.off\(ResponseSocketsEnum\.ADD_ITEM_TO_INVENTORY, handleItemAdded\)/);
  assert.match(code, /socket\.off\(ResponseSocketsEnum\.REMOVE_ITEM_FROM_INVENTORY, handleItemRemoved\)/);
  assert.match(code, /String\(item\.id\) === id/);
  assert.match(code, /watch\(totalPages/);
});

test('public backpack reconciles a late snapshot with in-flight add/remove events', () => {
  const source = fs.readFileSync(path.join(root,
    'src/views/components/game/scenes/public/InventoryPublicSceneComponent.vue'), 'utf8');
  const match = source.match(/const applyInventoryDelta = \(items, event\) => \{[\s\S]*?\n\};/);
  assert.ok(match, 'inventory reconciliation helper must exist');
  const apply = vm.runInNewContext(match[0] + '\napplyInventoryDelta;', {});
  const original = [{ id: 1, sprite_name: 'island_object' }, { id: 2 }];
  const added = { type: 'add', id: '3', item: { id: '3', sprite_name: 'another_object' } };
  const removed = { type: 'remove', id: '1' };
  const merged = [added, removed].reduce(apply, original);
  assert.deepEqual(Array.from(merged, x => String(x.id)), ['2', '3']);
  assert.equal(apply(merged, added).length, 2, 'duplicate delivery cannot duplicate item');
  assert.deepEqual(Array.from(apply(merged, { type: 'remove', id: 3 }), x => String(x.id)), ['2']);
  assert.match(source, /pendingInventoryDeltas\.reduce\(applyInventoryDelta, snapshot\)/);
  assert.match(source, /if \(!hasInitialSnapshot\) pendingInventoryDeltas\.push\(event\)/);
  assert.match(source, /pendingInventoryDeltas = \[\]/);
});
