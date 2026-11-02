const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/phaser/utils/sceneSocketSubscriptions.js'), 'utf8');
const sceneSocketSubscriptions = vm.runInNewContext(
    source.replace('export default function', 'function') + '\nsceneSocketSubscriptions;',
    {}
);

function createScene() {
    return { events: new EventEmitter() };
}

test('removes avatar/interactions callbacks of closed scene but preserves global subscriber', () => {
    const socket = new EventEmitter();
    const oldScene = createScene();
    const called = [];
    socket.on('USER_CHANGE_AVATAR', () => called.push('lobby-global'));
    const subscriptions = sceneSocketSubscriptions(oldScene, socket);
    subscriptions.listen('USER_CHANGE_AVATAR', () => called.push('old-scene'));
    subscriptions.listen('USER_RECEIVE_INTERACTION', () => called.push('old-interaction'));

    socket.emit('USER_CHANGE_AVATAR');
    assert.deepEqual(called, ['lobby-global', 'old-scene']);
    oldScene.events.emit('shutdown');
    socket.emit('USER_CHANGE_AVATAR');
    socket.emit('USER_RECEIVE_INTERACTION');
    assert.deepEqual(called, ['lobby-global', 'old-scene', 'lobby-global']);
    assert.equal(socket.listenerCount('USER_CHANGE_AVATAR'), 1);
    assert.equal(socket.listenerCount('USER_RECEIVE_INTERACTION'), 0);
});

test('switching rooms does not delete listeners belonging to the next scene', () => {
    const socket = new EventEmitter();
    const sceneA = createScene();
    const sceneB = createScene();
    const a = sceneSocketSubscriptions(sceneA, socket);
    const b = sceneSocketSubscriptions(sceneB, socket);
    const seen = [];
    a.listen('USER_MOVE', () => seen.push('A'));
    b.listen('USER_MOVE', () => seen.push('B'));

    sceneA.events.emit('shutdown');
    socket.emit('USER_MOVE');
    assert.deepEqual(seen, ['B']);
    sceneB.events.emit('shutdown');
    socket.emit('USER_MOVE');
    assert.deepEqual(seen, ['B']);
});

test('destroy cleans listeners even without a separate shutdown', () => {
    const socket = new EventEmitter();
    const scene = createScene();
    const subscription = sceneSocketSubscriptions(scene, socket);
    let seen = 0;
    subscription.listen('SCENE_OBJECT_SPAWNED', () => seen++);
    scene.events.emit('destroy');
    socket.emit('SCENE_OBJECT_SPAWNED');
    assert.equal(seen, 0);
    assert.equal(socket.listenerCount('SCENE_OBJECT_SPAWNED'), 0);
});

test('unsubscribe is idempotent and registration after cleanup is ignored', () => {
    const socket = new EventEmitter();
    const scene = createScene();
    const subscription = sceneSocketSubscriptions(scene, socket);
    subscription.listen('SEND_CHAT', () => {});
    subscription.dispose();
    subscription.dispose();
    subscription.listen('SEND_CHAT', () => {});
    assert.equal(socket.listenerCount('SEND_CHAT'), 0);
    assert.equal(scene.events.listenerCount('shutdown'), 0);
    assert.equal(scene.events.listenerCount('destroy'), 0);
});

test('both scene socket controllers use scoped subscription helper', () => {
    for (const name of ['SceneResponseSockets.js', 'PublicSceneResponse.js']) {
        const code = fs.readFileSync(path.join(root, 'src/phaser/sockets', name), 'utf8');
        assert.match(code, /sceneSocketSubscriptions\(gameScene, socket\)/);
        assert.doesNotMatch(code, /socket\.on\(/);
    }
});

test('private room listeners are individually cleaned without disrupting the next room', () => {
    const socket = new EventEmitter();
    const previous = createScene();
    const current = createScene();
    const oldListeners = sceneSocketSubscriptions(previous, socket);
    const newListeners = sceneSocketSubscriptions(current, socket);
    const inventoryUpdates = [];
    const itemEvents = [
        'ADD_ITEM_TO_INVENTORY', 'SCENE_REMOVE_ITEM', 'SCENE_PUT_ITEM',
        'REMOVE_ITEM_FROM_INVENTORY', 'ROTATE_OBJECT', 'PRIVATE_SCENE_COLORS_UPDATED'
    ];
    for (const event of itemEvents) {
        oldListeners.listen(event, () => inventoryUpdates.push('old'));
        newListeners.listen(event, () => inventoryUpdates.push('current'));
    }
    previous.events.emit('shutdown');
    for (const event of itemEvents) {
        socket.emit(event);
        assert.equal(socket.listenerCount(event), 1);
    }
    assert.deepEqual(inventoryUpdates, Array(6).fill('current'));
    current.events.emit('destroy');
    for (const event of itemEvents) {
        assert.equal(socket.listenerCount(event), 0);
    }
});

test('every Phaser scene uses scoped cleanup, including six private inventory handlers', () => {
    const scenes = ['PublicScene.js', 'PrivateScene.js', 'MinigameScene.js'];
    for (const name of scenes) {
        const code = fs.readFileSync(path.join(root, 'src/phaser', name), 'utf8');
        assert.doesNotMatch(code, /RemovePhaserSocketsUtil/);
        assert.doesNotMatch(code, /socket\.off\([^,)]*\)/);
    }
    const privateScene = fs.readFileSync(path.join(root, 'src/phaser/PrivateScene.js'), 'utf8');
    assert.match(privateScene, /sceneSocketSubscriptions\(this, socket\)/);
    assert.doesNotMatch(privateScene, /socket\.on\(/);
    const inventoryEvents = [
        'ADD_ITEM_TO_INVENTORY', 'SCENE_REMOVE_ITEM', 'SCENE_PUT_ITEM',
        'REMOVE_ITEM_FROM_INVENTORY', 'ROTATE_OBJECT', 'PRIVATE_SCENE_COLORS_UPDATED'
    ];
    for (const name of inventoryEvents) {
        assert.match(privateScene, new RegExp('listen\\(ResponseSocketsEnum\\.' + name + ','));
    }
});
