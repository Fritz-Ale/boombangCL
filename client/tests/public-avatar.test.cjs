const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const src = (name) => fs.readFileSync(path.join(__dirname, '..', 'src', 'phaser', name), 'utf8')
    .replace(/^import[^\n]*$/gm, '')
    .replace(/import\.meta\.env/g, '({VITE_ANIMATION_AVATAR_EDITOR:"false"})')
    .replace(/^export default [^\n]+$/gm, '');

const avatars = {
    BOOMER: 1, BRUJITA: 2, CHOLO: 3, EMPOLLON: 4, GATA: 5,
    GHOST: 6, INDIA: 7, LILIAN: 8, MARSU: 9, MODERN: 10,
    NINJA: 11, RASTA: 12, SKELETON: 13, WEREWOLF: 14,
    WRAITH: 15, YAYO: 16, ZOMBIE: 17
};
const names = { 1: 'boomer', 3: 'cholo', 5: 'gata', 12: 'rasta' };
const avatarManager = {
    getAvatarName(id) { return names[id] || 'unknown'; },
    createAvatarAnimations() {}
};

function loadAddUser(smart, idle = () => {}) {
    return new Function(
        'MoveUserToTileController', 'AnimationEditorController',
        'UserIdleAnimation', 'UserModel', 'socket', 'RequestSocketsEnum',
        'ShadowColorsEnum', 'NameColorsEnum', 'smartAvatarSystem',
        'AvatarEnum', 'gameConfig', 'avatarManager',
        src('controllers/scene/AddUserController.js') + '\nreturn AddUserController;'
    )(
        { main() {} }, { create() {} }, { main: idle }, class {},
        { emit() {} }, {}, {}, {}, smart, avatars, { DPI: 2 }, avatarManager
    );
}

function fakeScene(available = new Set()) {
    const makeSprite = (x, y, key) => ({
        x, y, texture: { key }, visible: true, active: true,
        scaleY: 1, width: 64, height: 64, frame: { height: 64 },
        setScale(n) { this.scaleY = n; return this; },
        setDepth(n) { this.depth = n; return this; },
        setVisible(n) { this.visible = n; return this; },
        destroy() { this.active = false; }
    });
    return {
        users: {},
        sceneScaleFactor: 1,
        textures: { exists: key => available.has(key) },
        add: { sprite: makeSprite }
    };
}

test('un atlas ausente no deja al jugador invisible', () => {
    const Controller = loadAddUser(new EventEmitter());
    const sprite = Controller.createAvatarSprite(fakeScene(), { avatar_id: 12, z: 2 });
    assert.equal(sprite.visible, true);
    assert.equal(sprite.texture.key, '__MISSING');
});

test('atlas existente crea las animaciones y el sprite verdadero', () => {
    let created = false;
    const original = avatarManager.createAvatarAnimations;
    avatarManager.createAvatarAnimations = () => { created = true; };
    try {
        const Controller = loadAddUser(new EventEmitter());
        const sprite = Controller.createAvatarSprite(fakeScene(new Set(['rasta_atlas'])), {
            avatar_id: 12, z: 2
        });
        assert.equal(sprite.texture.key, 'rasta_atlas');
        assert.equal(created, true);
    } finally {
        avatarManager.createAvatarAnimations = original;
    }
});

test('la carga tardía usa socket ID y se ignora tras la salida', () => {
    const smart = new EventEmitter();
    smart.updateUserAvatar = (id, avatarId) => { smart.lastUpdate = [id, avatarId]; };
    const Controller = loadAddUser(smart);
    const scene = fakeScene(new Set(['cholo_atlas', 'rasta_atlas']));
    const user = {
        socketId: 'socket-123',
        username: 'otro-nombre',
        originalAvatarId: 3,
        currentAvatarId: 12,
        spriteAvatar: { texture: { key: '__MISSING' } }
    };
    scene.users[user.socketId] = user;
    const upgraded = [];
    Controller.updateUserAvatarSmart = (_scene, _user, avatarId) => {
        upgraded.push(avatarId);
        return true;
    };
    Controller.setupSmartAvatarUpdateListener(scene, user);
    smart.emit('userAvatarReady', { userId: 'socket-123', avatarId: 3 });
    assert.deepEqual(upgraded, [3]);
    assert.deepEqual(smart.lastUpdate, ['socket-123', 3]);
    user.cleanupCallbacks.forEach(fn => fn());
    smart.emit('avatarBecameAvailable', { avatarId: 3 });
    assert.deepEqual(upgraded, [3]);
});

test('cuando carga el atlas fallback se restaura el sprite provisional', () => {
    const smart = new EventEmitter();
    smart.updateUserAvatar = () => {};
    const Controller = loadAddUser(smart);
    const available = new Set();
    const scene = fakeScene(available);
    const user = {
        socketId: 'socket-456', username: 'nombre',
        originalAvatarId: 3, currentAvatarId: 12,
        spriteAvatar: { texture: { key: '__MISSING' } }
    };
    scene.users[user.socketId] = user;
    const upgrades = [];
    Controller.updateUserAvatarSmart = (_scene, _user, avatarId) => {
        upgrades.push(avatarId);
        return true;
    };
    Controller.setupSmartAvatarUpdateListener(scene, user);
    available.add('rasta_atlas');
    smart.emit('avatarBecameAvailable', { avatarId: 12 });
    assert.deepEqual(upgrades, [12]);
    user.cleanupCallbacks.forEach(fn => fn());
});

test('los jugadores iniciales no esperan a que la escena active el buffer', async () => {
    const created = [];
    const AddUserController = {
        async processUser(scene, data) {
            created.push(data.id);
            scene.users[data.id] = data;
        }
    };
    const CreateSceneController = new Function(
        'AddUserController', 'SetUserCardController', 'socket',
        'RequestSocketsEnum', 'gameConfig', 'FloorPulseAnimation',
        'DarkeningUtils',
        src('controllers/scene/CreateSceneController.js') + '\nreturn CreateSceneController;'
    )(AddUserController, { main() {} }, {}, {}, {}, {}, {});
    const scene = { users: {}, isSceneReady: false, eventBuffer: [] };
    await CreateSceneController.createUsers(scene, [{ id: 'u1' }, { id: 'u2' }], {});
    assert.deepEqual(created, ['u1', 'u2']);
    assert.equal(scene.users.u1.id, 'u1');
    assert.equal(scene.eventBuffer.length, 0);
});

test('un fallback marcado en memoria no está listo si falta su textura', () => {
    const background = new EventEmitter();
    background.requestPriorityLoad = () => {};
    const Smart = new Function('AvatarEnum', 'backgroundAvatarLoader', 'avatarManager',
        'EventEmitter', src('managers/SmartAvatarSystem.js') + '\nreturn smartAvatarSystem;'
    )(avatars, background, avatarManager, EventEmitter);
    const available = new Set();
    Smart.currentScene = fakeScene(available);
    Smart.availableAvatars.add(12);
    assert.equal(Smart.isAvatarAvailable(12), false);
    available.add('rasta_atlas');
    assert.equal(Smart.isAvatarAvailable(12), true);
});

test('cargador esencial emite el evento sólo después de que el atlas existe', async () => {
    const Background = new Function('socket', 'AvatarEnum', 'avatarManager',
        'EventEmitter', src('managers/BackgroundAvatarLoader.js') +
        '\nreturn backgroundAvatarLoader;'
    )({ user: null }, avatars, avatarManager, EventEmitter);
    Background.essentialAvatars = [12];
    const available = new Set();
    Background.currentScene = fakeScene(available);
    Background.loadAvatarSync = async () => { available.add('rasta_atlas'); };
    const events = [];
    Background.on('avatarLoaded', value => events.push(value.avatarId));
    await Background.loadEssentialAvatars();
    assert.deepEqual(events, [12]);
    assert.equal(Background.loadedAvatars.has(12), true);
});

test('direccion inicial vacia o cero conserva una animacion idle visible', () => {
    const Idle = new Function('DirectionEnum', 'AvatarAnimationsEnum',
        'AnimationUtils', src('animations/UserIdleAnimation.js') +
        '\nreturn UserIdleAnimation;'
    )({
        DOWN_LEFT: 1, DOWN: 2, DOWN_RIGHT: 3, RIGHT: 4,
        UP_RIGHT: 5, UP: 6, UP_LEFT: 7, LEFT: 8
    }, { DOWN_IDLE: 'down_idle', LEFT_IDLE: 'left_idle' }, {});
    assert.equal(Idle.getTextureKey(0), 'down_idle');
    assert.equal(Idle.getTextureKey(undefined), 'down_idle');
});

test('el cargador se reanuda al entrar a otra sala tras cleanup', async () => {
    const Background = new Function('socket', 'AvatarEnum', 'avatarManager',
        'EventEmitter', src('managers/BackgroundAvatarLoader.js') +
        '\nreturn backgroundAvatarLoader;'
    )({ user: null }, avatars, avatarManager, EventEmitter);
    Background.isPaused = true;
    let started = false;
    Background.loadEssentialAvatars = async () => {};
    Background.startBackgroundLoading = () => { started = true; };
    await Background.init(fakeScene());
    assert.equal(Background.isPaused, false);
    assert.equal(started, true);
});
