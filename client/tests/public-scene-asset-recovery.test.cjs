const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sceneUtilsSource = fs.readFileSync(path.join(root, 'src/utils/SceneUtils.js'), 'utf8');
const loaderSource = fs.readFileSync(path.join(root, 'src/phaser/loaders/PublicSceneLoader.js'), 'utf8');

function loadModules() {
    const start = sceneUtilsSource.indexOf('    static isVideoFile(src) {');
    const end = sceneUtilsSource.indexOf('    static moveItem(', start);
    assert.ok(start >= 0 && end > start, 'La detección de vídeos sigue disponible');
    const SceneUtils = new Function(
        'class TestSceneUtils { ' + sceneUtilsSource.slice(start, end) + '} return TestSceneUtils;'
    )();
    const loaderCode = loaderSource
        .replace(/^import .+;\s*$/gm, '')
        .replace(/export default PublicSceneLoader;\s*$/, '')
        .replaceAll('import.meta.env.VITE_APP_ENV', JSON.stringify('production'));
    const PublicSceneLoader = new Function(
        'SceneUtils', 'DarkeningUtils', loaderCode + '\nreturn PublicSceneLoader;'
    )(SceneUtils, { shouldShowItem: () => true });
    return { SceneUtils, PublicSceneLoader };
}

function makeScene(assets, options = {}) {
    const calls = [];
    const textures = new Set(options.textures || []);
    const videos = new Set(options.videos || []);
    const sprite = () => {
        const s = {};
        for (const key of ['setOrigin', 'setDisplaySize', 'setDepth', 'setScale',
            'setName', 'setLoop', 'play', 'setScrollFactor', 'setInteractive', 'on']) {
            s[key] = (...args) => { calls.push([key, ...args]); return s; };
        }
        return s;
    };

    return {
        calls,
        sceneData: {
            scenery: {
                id: 1,
                base_api_url: 'https://api.example.test',
                game_time: '12:00',
                assets_data: { assets_data_repeatable: assets },
                npc: options.npc || null,
                arrows: [],
                items: [],
            },
        },
        load: {
            image: (...args) => calls.push(['load.image', ...args]),
            video: (...args) => calls.push(['load.video', ...args]),
        },
        textures: { exists: key => textures.has(key) },
        cache: { video: { has: key => videos.has(key) } },
        cameras: {
            main: { setBackgroundColor: color => calls.push(['camera.color', color]) }
        },
        add: {
            image: (...args) => { calls.push(['add.image', ...args]); return sprite(); },
            video: (...args) => { calls.push(['add.video', ...args]); return sprite(); },
            text: (...args) => { calls.push(['add.text', ...args]); return sprite(); },
        },
        scale: { width: 1024, height: 768 },
        sceneScaleFactor: 1
    };
}

test('los fondos de vídeo con querystring siguen siendo vídeo', () => {
    const { SceneUtils } = loadModules();
    assert.equal(SceneUtils.isVideoFile('/fondos/ufo.WEBM?v=3'), true);
    assert.equal(SceneUtils.isVideoFile('https://example.test/fondo.mp4#section'), true);
    assert.equal(SceneUtils.isVideoFile('scenes/1.png?ref=.webm'), false);
    assert.equal(SceneUtils.isVideoFile('/fondos/picture.png'), false);
    assert.equal(SceneUtils.isVideoFile(null), false);
});

test('la precarga distingue vídeo y PNG sin pedir archivos vacíos', () => {
    const { PublicSceneLoader } = loadModules();
    const scene = makeScene([
        null,
        { image: '' },
        { image: '/uploads/ufo.webm?v=2', is_background: 1 },
        { image: '/uploads/suelo.png?ref=.mp4', position_x: 20, position_y: 20 },
    ], { npc: { active: true, sprite_name: 'npc1', image: '' } });
    PublicSceneLoader.main(scene, true);
    assert.deepEqual(scene.calls.filter(c => c[0] === 'load.video'), [
        ['load.video', 'public_scene_1_item_2', 'https://api.example.test/uploads/ufo.webm?v=2']
    ]);
    assert.deepEqual(scene.calls.filter(c => c[0] === 'load.image'), [
        ['load.image', 'public_scene_1_item_3', 'https://api.example.test/uploads/suelo.png?ref=.mp4']
    ]);
});

test('UFO sin recursos muestra un estado visible y no crea texturas inexistentes', () => {
    const { PublicSceneLoader } = loadModules();
    const scene = makeScene([{ is_background: 1, image: '/uploads/missing.png' },
        { image: '/uploads/missing-decoration.png', position_x: 10, position_y: 12 }]);
    PublicSceneLoader.main(scene, false);
    assert.equal(scene.calls.filter(c => c[0] === 'add.image').length, 0);
    assert.equal(scene.calls.filter(c => c[0] === 'add.video').length, 0);
    assert.equal(scene.calls.filter(c => c[0] === 'add.text').length, 1);
    assert.equal(scene.calls.filter(c => c[0] === 'camera.color').length, 1);
});

test('con fondo correcto se mantiene la carga original sin indicador de error', () => {
    const { PublicSceneLoader } = loadModules();
    const scene = makeScene([{ is_background: 1, image: '/uploads/ufo.webm' }],
        { videos: ['public_scene_1_item_0'] });
    PublicSceneLoader.main(scene, false);
    assert.equal(scene.calls.filter(c => c[0] === 'add.video').length, 1);
    assert.equal(scene.calls.filter(c => c[0] === 'play').length, 1);
    assert.equal(scene.calls.filter(c => c[0] === 'add.text').length, 0);
    assert.equal(scene.calls.filter(c => c[0] === 'camera.color').length, 0);
});

test('un assets_data corrupto no provoca excepción ni pantalla negra sin diagnóstico', () => {
    const { PublicSceneLoader } = loadModules();
    const scene = makeScene('datos no válidos');
    PublicSceneLoader.main(scene, true);
    PublicSceneLoader.main(scene, false);
    assert.equal(scene.calls.filter(c => c[0] === 'load.image').length, 0);
    assert.equal(scene.calls.filter(c => c[0] === 'add.text').length, 1);
});
