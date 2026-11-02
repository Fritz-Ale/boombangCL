const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourceRoot = path.resolve(__dirname, '../src/phaser');

const drainSource = fs.readFileSync(path.join(sourceRoot, 'utils/drainSceneEntryEvents.js'), 'utf8');
const drainSceneEntryEvents = vm.runInNewContext(
    drainSource.replace('export default async function', 'async function') + '\ndrainSceneEntryEvents;',
    { console }
);

const publicSceneSource = fs.readFileSync(path.join(sourceRoot, 'PublicScene.js'), 'utf8');
const PublicScene = vm.runInNewContext(
    publicSceneSource
        .replace(/^import .*;\s*$/gm, '')
        .replace(/import\.meta\.env/g, '({})')
        .replace('export default class PublicScene', 'class PublicScene') +
        '\nPublicScene;',
    { Phaser: { Scene: class {} } }
);

function entry(label, callback) {
    return { type: label, callback };
}

test('initialization resets stale buffers, readiness and avatar flags on reentry', () => {
    const scene = new PublicScene();
    const payload = { sceneType: 'public', sceneData: { scenery: { id: 1 } }, vueComponent: {} };
    scene.init(payload);
    const firstGeneration = scene.sceneGeneration;
    scene.eventBuffer.push(entry('OLD', () => {}));
    scene.isSceneReady = true;
    scene.avatarsEssentialReady = true;
    scene.allAvatarsReady = true;
    scene.avatarLoadingProgress = 0.99;
    scene.darkeningData = { previous: true };
    scene._nameTagCleanupHooked = true;

    scene.init({ ...payload, sceneData: { scenery: { id: 2 } } });
    assert.equal(scene.sceneGeneration, firstGeneration + 1);
    assert.equal(scene.isSceneReady, false);
    assert.equal(scene.eventBuffer.length, 0);
    assert.equal(scene.avatarsEssentialReady, false);
    assert.equal(scene.allAvatarsReady, false);
    assert.equal(scene.avatarLoadingProgress, 0);
    assert.equal(scene.darkeningData, null);
    assert.equal(scene._nameTagCleanupHooked, false);
    assert.equal(scene.sceneData.scenery.id, 2);
});

test('queued avatars enter in arrival order with no stray timers', async () => {
    const scene = { sceneGeneration: 7, isSceneReady: true };
    const called = [];
    const events = [1, 2, 3].map(i =>
        entry('ADD_USER', async () => { called.push('start-' + i); await Promise.resolve(); called.push('done-' + i); })
    );
    const success = await drainSceneEntryEvents(scene, events, 7);
    assert.equal(success, true);
    assert.deepEqual(called, ['start-1', 'done-1', 'start-2', 'done-2', 'start-3', 'done-3']);
});

test('shutdown during async processing blocks later callbacks', async () => {
    const scene = { sceneGeneration: 8, isSceneReady: true };
    const called = [];
    const events = [
        entry('ADD_USER', async () => {
            called.push('started');
            await Promise.resolve();
            scene.isSceneReady = false;
            scene.sceneGeneration += 1;
        }),
        entry('ADD_USER', () => { called.push('should-not-run'); })
    ];
    const success = await drainSceneEntryEvents(scene, events, 8);
    assert.equal(success, false);
    assert.deepEqual(called, ['started']);
});

test('changing rooms during avatar loading drops the rest of the old list', async () => {
    const scene = { sceneGeneration: 12, isSceneReady: true };
    const called = [];
    const events = [
        entry('ADD_USER', () => { scene.sceneGeneration = 13; called.push('old-user'); }),
        entry('ADD_USER', () => { called.push('ghost-user'); })
    ];
    assert.equal(await drainSceneEntryEvents(scene, events, 12), false);
    assert.deepEqual(called, ['old-user']);
});

test('one broken avatar does not hide the other users', async () => {
    const errors = [], called = [];
    const scene = { sceneGeneration: 1, isSceneReady: true };
    const events = [
        entry('ADD_USER', () => { throw new Error('bad atlas'); }),
        entry('ADD_USER', () => { called.push('visible'); }),
        null,
        entry('UNKNOWN', null)
    ];
    assert.equal(await drainSceneEntryEvents(scene, events, 1, (...args) => errors.push(args)), true);
    assert.deepEqual(called, ['visible']);
    assert.equal(errors.length, 1);
    assert.equal(errors[0][1], 'ADD_USER');
});

test('never executes a buffered event when the scene was already closed', async () => {
    const scene = { sceneGeneration: 30, isSceneReady: false };
    let called = false;
    assert.equal(await drainSceneEntryEvents(scene, [entry('ADD_USER', () => { called = true; })], 30), false);
    assert.equal(called, false);
});
