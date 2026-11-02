const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const loadSource = fs.readFileSync(path.join(root, 'src/phaser/loaders/PublicSceneLoader.js'), 'utf8');
const sceneUtilsSource = fs.readFileSync(path.join(root, 'src/utils/SceneUtils.js'), 'utf8');

const sceneUtils = vm.runInNewContext(
    sceneUtilsSource
        .replace(/^import .*;\s*$/gm, '')
        .replace(/export default SceneUtils;?/, '') + '\nSceneUtils;',
    { gameConfig: { DPI: 1 } }
);
const loader = vm.runInNewContext(
    loadSource
        .replace(/^import .*;\s*$/gm, '')
        .replaceAll('import.meta.env.VITE_APP_ENV', "'production'")
        .replace(/export default PublicSceneLoader;?/, '') + '\nPublicSceneLoader;',
    {
        SceneUtils: sceneUtils,
        DarkeningUtils: { shouldShowItem: () => true },
        console: { warn: () => {} }
    }
);

function fakeScene(assets, { loadedImages = [], loadedVideos = [], npc = null } = {}) {
    const result = { imageLoads: [], videoLoads: [], drawnImages: [], drawnVideos: [], notices: [], warnings: [], cameraColor: null };
    const sprite = () => {
        const object = {
            setOrigin: () => object,
            setDisplaySize: () => object,
            setDepth: () => object,
            setName: () => object,
            setLoop: () => object,
            play: () => object,
            setScale: () => object,
            setScrollFactor: () => object,
            setInteractive: () => object,
            on: () => object
        };
        return object;
    };
    const gameScene = {
        sceneData: { scenery: {
            id: 1,
            assets_data: assets,
            npc,
            base_api_url: 'https://api.example.test',
            items: [],
            arrows: [],
            darkening: false
        }},
        load: {
            image: (...args) => result.imageLoads.push(args),
            video: (...args) => result.videoLoads.push(args)
        },
        cache: { video: { has: (key) => loadedVideos.includes(key) } },
        textures: { exists: (key) => loadedImages.includes(key) },
        add: {
            image: (...args) => { result.drawnImages.push(args); return sprite(); },
            video: (...args) => { result.drawnVideos.push(args); return sprite(); },
            text: (...args) => { result.notices.push(args); return sprite(); }
        },
        scale: { width: 800, height: 600 },
        cameras: { main: { setBackgroundColor: value => { result.cameraColor = value; } } },
        events: { emit: (name, detail) => result.warnings.push({ name, detail }) }
    };
    return { gameScene, result };
}

test('recognizes images vs videos with signed query strings', () => {
    assert.equal(sceneUtils.isVideoFile('/uploads/UFO.webm?signature=123'), true);
    assert.equal(sceneUtils.isVideoFile('/uploads/UFO.MP4#frame'), true);
    assert.equal(sceneUtils.isVideoFile('/uploads/fondo.png?signature=.webm'), false);
    assert.equal(sceneUtils.isVideoFile(null), false);
});

test('an empty UFO asset collection never queues blank Phaser URLs or throws', () => {
    const { gameScene, result } = fakeScene({ assets_data_repeatable: [{ is_background: 1, image: '' }] });
    loader.main(gameScene, true);
    assert.equal(result.imageLoads.length, 0);
    assert.equal(result.videoLoads.length, 0);
    loader.main(gameScene, false);
    assert.equal(result.cameraColor, '#274d65');
    assert.equal(result.notices.length, 1);
    assert.match(result.notices[0][2], /Fondo del escenario/);
    assert.equal(result.drawnImages.length, 0);
    assert.ok(result.warnings.some(w => w.detail.code === 'background_missing'));
});

test('invalid asset collection shape falls back without aborting', () => {
    const { gameScene, result } = fakeScene({ assets_data_repeatable: { image: '/uploads/invalid.png' } });
    assert.doesNotThrow(() => loader.main(gameScene, true));
    assert.doesNotThrow(() => loader.main(gameScene, false));
    assert.equal(result.cameraColor, '#274d65');
});

test('valid photo background loads from Laravel and retains its artwork', () => {
    const { gameScene, result } = fakeScene(
        { assets_data_repeatable: [{ is_background: 1, image: '/uploads/scenes/ufo.png' }] },
        { loadedImages: ['public_scene_1_item_0'] }
    );
    loader.main(gameScene, true);
    assert.equal(result.imageLoads.length, 1);
    assert.equal(result.imageLoads[0][1], 'https://api.example.test/uploads/scenes/ufo.png');
    loader.main(gameScene, false);
    assert.equal(result.drawnImages.length, 1);
    assert.equal(result.cameraColor, null);
    assert.equal(result.notices.length, 0);
    assert.equal(result.warnings.length, 0);
});

test('failed texture does not create Phaser MISSING object or block scene', () => {
    const { gameScene, result } = fakeScene({
        assets_data_repeatable: [
            { is_background: 1, image: '/uploads/scenes/unavailable.webp' },
            { is_background: 0, image: '/uploads/items/missing.png', position_x: 40, position_y: 70 }
        ]
    });
    loader.main(gameScene, true);
    loader.main(gameScene, false);
    assert.equal(result.drawnImages.length, 0);
    assert.equal(result.cameraColor, '#274d65');
    assert.ok(result.warnings.some(w => w.detail.code === 'background_texture_missing'));
    assert.ok(result.warnings.some(w => w.detail.code === 'scene_item_missing'));
});

test('signed video URL is queued and rendered as Phaser video', () => {
    const { gameScene, result } = fakeScene(
        { assets_data_repeatable: [{ is_background: 1, image: '/uploads/scenes/ufo.webm?rev=4' }] },
        { loadedVideos: ['public_scene_1_item_0'] }
    );
    loader.main(gameScene, true);
    assert.equal(result.videoLoads.length, 1);
    assert.equal(result.imageLoads.length, 0);
    loader.main(gameScene, false);
    assert.equal(result.drawnVideos.length, 1);
    assert.equal(result.cameraColor, null);
});

test('missing NPC texture is not instantiated as broken Phaser sprite', () => {
    const { gameScene, result } = fakeScene(
        { assets_data_repeatable: [] },
        { npc: { active: true, sprite_name: 'missing', image: '/uploads/npc/missing.png', positionX: 5, positionY: 6 } }
    );
    loader.main(gameScene, false);
    assert.equal(result.drawnImages.length, 0);
    assert.ok(result.warnings.some(w => w.detail.code === 'npc_missing'));
});
