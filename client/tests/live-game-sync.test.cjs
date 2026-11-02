'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const subscriptions = vm.runInNewContext(
    source('src/utils/createSocketSubscriptions.js')
        .replace('export default function', 'function')
        + '\ncreateSocketSubscriptions;',
    {}
);

test('screens can listen to the same event without deleting each other', () => {
    const socket = new EventEmitter();
    const lobby = subscriptions(socket);
    const game = subscriptions(socket);
    let a = 0;
    let b = 0;
    lobby.on('response:join_island', () => a++);
    game.on('response:join_island', () => b++);
    socket.emit('response:join_island');
    assert.equal(a, 1);
    assert.equal(b, 1);
    lobby.dispose();
    socket.emit('response:join_island');
    assert.equal(a, 1);
    assert.equal(b, 2);
    game.dispose();
    assert.equal(socket.listenerCount('response:join_island'), 0);
});

test('once callback does not persist after completing and scope cleanup is idempotent', () => {
    const socket = new EventEmitter();
    const owner = subscriptions(socket);
    let calls = 0;
    owner.once('response:lobby_gacha_spin', () => calls++);
    socket.emit('response:lobby_gacha_spin');
    socket.emit('response:lobby_gacha_spin');
    assert.equal(calls, 1);
    assert.equal(socket.listenerCount('response:lobby_gacha_spin'), 0);
    owner.dispose();
    owner.dispose();
    owner.on('a', () => {});
    assert.equal(socket.listenerCount('a'), 0);
});

test('Vue screen event listeners have individual lifetimes and do not remove global listeners', () => {
    const files = [
        'src/views/screens/game/GameScreens.vue',
        'src/views/screens/game/LobbyScreen.vue',
        'src/views/components/game/lobby/GamesTabComponent.vue',
        'src/views/components/game/lobby/PublicIslandsComponent.vue',
        'src/views/components/game/lobby/UiElementsComponent.vue',
        'src/views/components/auth/LoginFormComponent.vue'
    ];
    for (const file of files) {
        const code = source(file);
        assert.doesNotMatch(code, /socket\.off\(ResponseSocketsEnum\.\w+\s*\)/, file);
        assert.match(code, /Subscriptions\?\.dispose\(\)/, file);
    }
});

test('public inventory registers before requesting fresh data and cleans all events', () => {
    const code = source('src/views/components/game/scenes/public/InventoryPublicSceneComponent.vue');
    const registered = code.indexOf('socket.on(ResponseSocketsEnum.PUBLIC_INVENTORY_DATA, onInventoryData)');
    const requested = code.indexOf('  loadInventory();', registered);
    assert.ok(registered > -1 && requested > registered);
    for (const name of ['PUBLIC_INVENTORY_DATA', 'ADD_ITEM_TO_INVENTORY', 'REMOVE_ITEM_FROM_INVENTORY']) {
        assert.ok(code.includes('socket.off(ResponseSocketsEnum.' + name + ', on'));
        assert.ok(code.includes('socket.on(ResponseSocketsEnum.' + name + ', on'));
    }
    assert.match(code, /String\(existing\.id\) === String\(item\.id\)/);
});

test('socket disconnect never reloads page and authenticates the NEW connection', () => {
    const app = source('src/App.vue');
    const start = app.indexOf('    handleDisconnect() {');
    const end = app.indexOf('    onUpdateLoading(value)', start);
    const recovering = app.slice(start, end);
    assert.ok(start >= 0 && end > start);
    assert.doesNotMatch(recovering, /location\.reload|window\.location\.reload/);
    assert.match(recovering, /RequestSocketsEnum\.JWT_AUTO_LOGIN/);
    assert.match(recovering, /this\.\$refs\.gameScreens\?\.onExitLobby\(\)/);
    const login = source('src/views/components/auth/LoginFormComponent.vue');
    assert.doesNotMatch(login, /location\.reload/);
    assert.match(source('src/sockets/socket.js'), /reconnectionAttempts: Infinity/);
});

test('server broadcasts live lobby visitors for public, game and minigame scenes', () => {
    const join = fs.readFileSync(path.join(root, '../server/src/controllers/game/scenes/UserJoinPublicSceneController.js'), 'utf8');
    const leave = fs.readFileSync(path.join(root, '../server/src/tasks/RemoveUserFromSceneTask.js'), 'utf8');
    assert.match(join, /UpdateGameScenesController\.main\(io\)/);
    assert.match(join, /UpdatePublicScenesController\.main\(io\)/);
    assert.match(leave, /UpdateGameScenesController\.main\(\)/);
    assert.match(leave, /UpdatePublicScenesController\.main\(\)/);
});
