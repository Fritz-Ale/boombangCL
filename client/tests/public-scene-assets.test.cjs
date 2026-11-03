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

function fakeScene(assets, { loadedImages = [], loadedVideos = [], npc = null, arrows = [], items = [] } = {}) {
    const result = { imageLoads: [], videoLoads: [], drawnImages: [], drawnVideos: [], warnings: [], cameraColor: null };
    const sprite = () => {
        const object = {
            setOrigin: () => object,
            setDisplaySize: () => object,
            setDepth: () => object,
            setName: () => object,
            setLoop: () => object,
            play: () => object,
            setScale: () => object,
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
            items,
            arrows,
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
            video: (...args) => { result.drawnVideos.push(args); return sprite(); }
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

test('nginx client build loads relative UFO and NPC URLs from public Laravel host', () => {
    const { gameScene, result } = fakeScene(
        { assets_data_repeatable: [{ is_background: 1, image: 'uploads/public-scene/ufo/assets/fondo.webp' }] },
        { npc: {
            active: true,
            sprite_name: 'npc_1',
            image: '/uploads/public-scene/ufo/assets/npc.webp',
            positionX: 30,
            positionY: 50
        }}
    );
    loader.main(gameScene, true);
    assert.equal(result.imageLoads.length, 2);
    assert.equal(result.imageLoads[0][1], 'https://api.example.test/uploads/public-scene/ufo/assets/fondo.webp');
    assert.equal(result.imageLoads[1][1], 'https://api.example.test/uploads/public-scene/ufo/assets/npc.webp');
    assert.equal(result.imageLoads.some(([, url]) => url.startsWith('uploads/')), false);
});

test('scene arrows and collectible sprites use API URL even when frontend is on different domain', () => {
    const { gameScene, result } = fakeScene(
        { assets_data_repeatable: [] },
        {
            arrows: [
                { sprite_name: 'exit', image: 'uploads/arrow.png', image_url: 'https://api.example.test/uploads/arrow.png' },
                { sprite_name: 'other', image: 'uploads/arrow2.png' }
            ],
            items: [
                {
                    file_name: 'apple',
                    sprite_file: 'uploads/apple.png',
                    catch_file_name: 'apple-catch',
                    catch_sprite_file: '/uploads/apple-catch.png'
                },
                {
                    file_name: 'coin',
                    sprite_file: 'uploads/coin.png',
                    sprite_file_url: 'https://cdn.example.test/coin.png'
                }
            ]
        }
    );
    loader.main(gameScene, true);
    const urls = result.imageLoads.map(([, url]) => url);
    assert.ok(urls.includes('https://api.example.test/uploads/arrow.png'));
    assert.ok(urls.includes('https://api.example.test/uploads/arrow2.png'));
    assert.ok(urls.includes('https://api.example.test/uploads/apple.png'));
    assert.ok(urls.includes('https://api.example.test/uploads/apple-catch.png'));
    assert.ok(urls.includes('https://cdn.example.test/coin.png'));
    assert.equal(urls.some(url => !/^https:\/\//.test(url)), false);
});
