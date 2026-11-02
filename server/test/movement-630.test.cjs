const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function loadClientController(walk, idle) {
    // Aislar el controlador ESM de Phaser sin cargar el navegador.
    const source = read('client/src/phaser/controllers/scene/MoveUserController.js')
        .replace(/^import .*;\s*$/gm, '')
        .replace('export default MoveUserController;', 'return MoveUserController;');
    return new Function('UserWalkAnimation', 'AnimationsTimerEnum',
        'UserMoveDeniedController', 'gameConfig', source)(
        { playWalk: walk }, { WALK: 630 }, { main: idle }, { DPI: 1 }
    );
}

function makeClientScene() {
    const calls = [];
    const tweens = [];
    const user = {
        position: { x: 0, y: 0, z: 1 },
        currentAreaPosition: { x: 0, y: 0 },
        avatarId: 'boomer',
        spriteAvatar: { stop() { calls.push('stop'); } },
        spriteShadow: {},
        containerUser: {
            x: 0, y: 0,
            setPosition(x, y) { this.x = x; this.y = y; },
            setDepth(y) { this.depth = y; }
        }
    };
    const scene = {
        users: { s1: user },
        scale: { width: 1000 },
        sceneScaleFactor: 1,
        updateWalkableOverlayDepths() {},
        tweens: {
            killTweensOf() {},
            add(options) {
                const tween = {
                    options,
                    stopped: false,
                    stop() { this.stopped = true; },
                    complete() { options.onComplete(); }
                };
                tweens.push(tween);
                return tween;
            }
        }
    };
    const controller = loadClientController(
        () => calls.push('walk'),
        () => calls.push('idle')
    );
    return { scene, user, calls, tweens, controller };
}

function loadProcessor(timers, now) {
    // Simular las dependencias para probar la cadencia sin abrir sockets ni BD.
    class FakePathfinder {
        setGrid() {}
        setAcceptableTiles() {}
        enableDiagonals() {}
        enableCornerCutting() {}
        findPath(x, y, targetX, targetY, callback) {
            this.calculatePath = () => callback([
                { x, y }, { x: targetX, y: targetY }
            ]);
        }
        calculate() { this.calculatePath(); }
    }
    const dependencies = {
        easystarjs: { js: FakePathfinder },
        '../utils/ConsoleLogger': class { log() {} },
        '../utils/UserMovimentUtil': { getDirection: () => 1 },
        '../enums/AnimationBlockTimerEnum': { WALK: 630 },
        '../enums/AnimationEnum': { WALK: 'walk' },
        '../tasks/UserBlockActionsTask': { blockByWalk() {} },
        '../enums/ResponseSocketsEnum': { USER_MOVE: 'user_move' },
        '../services/PublicSceneService': {},
        '../controllers/game/scenes/SendUserToSceneController': {},
        '../enums/CocoEffectEnum': {}
    };
    const mod = { exports: {} };
    new Function('require', 'module', 'setTimeout', 'clearTimeout',
        'setInterval', 'clearInterval', 'Date',
        read('server/src/instances/MovementProcessorInstance.js'))(
        (name) => dependencies[name] || {},
        mod,
        (callback, delay) => {
            const id = timers.scheduled.length + 1;
            timers.scheduled.push({ callback, delay, id });
            return id;
        },
        (id) => timers.cancelled.push(id),
        () => 99,
        () => {},
        { now }
    );
    return mod.exports;
}

test('el cliente y el servidor usan 630 ms', () => {
    assert.equal(require('../src/enums/AnimationBlockTimerEnum').WALK, 630);
    assert.match(read('client/src/enums/AnimationsTimerEnum.js'), /WALK:\s*630/);
});

test('los pasos intermedios no detienen la animacion; el ultimo pasa a idle', () => {
    const { scene, user, calls, tweens, controller } = makeClientScene();
    controller.main(scene, {
        id: 's1', path: [{ x: 1, y: 0, z: 2 }], isLastStep: false
    });
    assert.equal(tweens[0].options.duration, 630);
    tweens[0].complete();
    assert.deepEqual(calls, ['walk']);
    assert.equal(user.currentTween, null);
    controller.main(scene, {
        id: 's1', path: [{ x: 2, y: 0, z: 2 }], isLastStep: true
    });
    tweens[1].complete();
    assert.deepEqual(calls, ['walk', 'walk', 'idle']);
});

test('cambiar de ruta descarta callbacks viejos y teleportar cancela tweens', () => {
    const { scene, user, tweens, controller } = makeClientScene();
    controller.main(scene, {
        id: 's1', path: [{ x: 1, y: 0, z: 2 }], isLastStep: false
    });
    controller.main(scene, {
        id: 's1', path: [{ x: 2, y: 0, z: 2 }], isLastStep: true
    });
    assert.equal(tweens[0].stopped, true);
    tweens[0].complete();
    assert.equal(user.currentTween, tweens[1]);
    controller.main(scene, {
        id: 's1', path: [{ x: 0, y: 0, z: 1 }], isTeleport: true
    });
    assert.equal(tweens[1].stopped, true);
    assert.equal(user.position.x, 0);
    assert.equal(user.containerUser.x, 1000);
});

test('la cadencia descuenta tiempo de computo y permite detener el loop', async () => {
    let clock = 1000;
    const timers = { scheduled: [], cancelled: [] };
    const Processor = loadProcessor(timers, () => clock);
    const scene = {
        users: [{ finalTarget: { x: 1, y: 0 } }],
        reservedTiles: {},
        emit() {}
    };
    const processor = new Processor(scene);
    processor.processUserMovement = async () => { clock += 65; };
    processor.startProcessing();
    for (let i = 0; i < 5; i++) await Promise.resolve();
    assert.equal(timers.scheduled[0].delay, 565);
    processor.stopProcessing();
    assert.ok(timers.cancelled.includes(timers.scheduled[0].id));
});

test('el servidor no permite avanzar a una casilla ocupada', async () => {
    const timers = { scheduled: [], cancelled: [] };
    const Processor = loadProcessor(timers, () => 1000);
    const user = {
        id: 'one', socket: { id: 'one' },
        currentAreaPosition: { x: 0, y: 0 },
        finalTarget: { x: 1, y: 0 },
        isActionBlocked: () => false
    };
    const other = {
        id: 'two', socket: { id: 'two' },
        currentAreaPosition: { x: 1, y: 0 },
        finalTarget: null
    };
    const packets = [];
    const scene = {
        users: [user, other],
        reservedTiles: {},
        getNavigationMapWithPlayers: () => [[0, 0]],
        emit: (...args) => packets.push(args),
        spawnedObjects: [], arrows: [], traps: []
    };
    const processor = new Processor(scene);
    await processor.processUserMovement(user);
    assert.equal(user.currentAreaPosition.x, 0);
    assert.deepEqual(packets[0][1].path, []);
    processor.stopProcessing();
});

test('la validacion de destinos rechaza ocupados y coordenadas fraccionarias', async () => {
    const emitted = [];
    const area = {
        map_width: 3, map_height: 3,
        game_map: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        getUsers: () => [{ currentAreaPosition: { x: 1, y: 1 } }],
        emit: () => emitted.push('denied')
    };
    const user = {
        currentArea: area,
        movementBlocked: false,
        isActionBlocked: () => false,
        setFinalTarget(target) { this.finalTarget = target; }
    };
    const dependencies = {
        '../../../collections/ConnectedUsersCollection': {
            getBySocketId: () => user
        },
        '../../../collections/PublicScenesCollection': {},
        '../../connection/DisconnectUserController': {
            main() { throw Error('No debe desconectar'); }
        },
        '../../../utils/Log': { error() {} },
        '../../../enums/ResponseSocketsEnum': { USER_MOVE_DENIED: 'denied' },
        '../../../enums/AnimationEnum': { WALK: 'walk' }
    };
    const mod = { exports: {} };
    new Function('require', 'module',
        read('server/src/controllers/game/scenes/UserMoveController.js'))(
        (name) => dependencies[name] || {}, mod
    );
    const socket = { id: 's1', emit() {} };
    await mod.exports.main(socket, {}, { x: 1, y: 1 });
    assert.equal(user.finalTarget, undefined);
    await mod.exports.main(socket, {}, { x: 1.5, y: 1 });
    assert.equal(user.finalTarget, null);
    await mod.exports.main(socket, {}, { x: 2, y: 0 });
    assert.deepEqual(user.finalTarget, { x: 2, y: 0 });
    assert.equal(emitted.length, 1);
});
