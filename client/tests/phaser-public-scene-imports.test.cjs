const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clientRoot = path.resolve(__dirname, '..');
const controllerPath = path.join(clientRoot, 'src/phaser/controllers/scene/CreateSceneController.js');
const darkeningPath = path.join(clientRoot, 'src/utils/DarkeningUtils.js');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const darkeningSource = fs.readFileSync(darkeningPath, 'utf8');

function evaluate(source, classname, injected) {
    const text = source
        .replace(/^import .*;.*$/gm, '')
        .replaceAll('import.meta.env.VITE_ANIMATION_AVATAR_EDITOR', "'false'")
        .replaceAll('import.meta.env.VITE_MAP_MAKER', "'false'")
        .replaceAll('import.meta.env.VITE_SHOW_ISOMAP', "'false'")
        .replaceAll('import.meta.env.VITE_APP_ENV', "'production'")
        .replace(new RegExp('export default ' + classname + ';?'), '')
        + '\n' + classname + ';';
    return vm.runInNewContext(text, injected);
}

test('each standalone ES module imports the Phaser namespace it uses', () => {
    for (const [name, source] of [
        ['CreateSceneController', controllerSource],
        ['DarkeningUtils', darkeningSource]
    ]) {
        assert.match(
            source,
            /^import\s+Phaser\s+from\s+["']phaser["'];/m,
            name + ' must not depend on an undeclared browser global Phaser'
        );
    }
});

test('public room creates clickable isometric floor with real module dependencies', () => {
    let polygonsCreated = 0;
    let hitZoneCreated = false;
    const Phaser = {
        Geom: {
            Polygon: class {
                constructor(vertices) {
                    polygonsCreated++;
                    assert.equal(vertices.length, 4);
                }
                static Contains() { return true; }
            }
        }
    };
    const gameConfig = { DPI: 2 };
    const noopSprite = { alpha: 0 };
    const zone = {
        setOrigin() { return this; },
        setInteractive() { hitZoneCreated = true; return this; },
        on() { return this; }
    };
    const scene = {
        scale: { width: 1012, height: 657 },
        add: {
            blitter() { return { setDepth() { return this; }, create() { return noopSprite; } }; },
            zone() { return zone; }
        },
        sceneData: { authUser: { admin_tools: { show_isomap: false } } },
        input: { hitTestPointer: () => [] }
    };
    const CreateSceneController = evaluate(controllerSource, 'CreateSceneController', {
        Phaser, gameConfig, EventLimiter: { canClick: () => true },
        socket: { emit: () => {} }, RequestSocketsEnum: {},
        FloorPulseAnimation: { main: () => {} },
        CatalogItemTypeOfBehaviorEnum: {}
    });
    assert.doesNotThrow(() => CreateSceneController.createTile(scene, [[0]], 1, 1));
    assert.equal(polygonsCreated, 1);
    assert.equal(hitZoneCreated, true);
    assert.equal(scene.tiles.length, 1);
});

test('day-night overlay uses Phaser MULTIPLY and survives a second update', () => {
    let appliedBlend;
    let fillCount = 0;
    const gfx = {
        destroyed: false,
        setScrollFactor() { return this; },
        setDepth() { return this; },
        setBlendMode(value) { appliedBlend = value; return this; },
        clear() { return this; },
        fillStyle() { return this; },
        fillRect() { fillCount++; return this; },
        destroy() { this.destroyed = true; }
    };
    const scene = {
        add: { graphics: () => gfx },
        scale: { width: 1012, height: 657, on: () => {} },
        sys: { events: { once: () => {} } }
    };
    const DarkeningUtils = evaluate(darkeningSource, 'DarkeningUtils', {
        Phaser: { BlendModes: { MULTIPLY: 2 } }
    });
    assert.doesNotThrow(() => DarkeningUtils.applySceneDarkening(scene, '02:00'));
    assert.doesNotThrow(() => DarkeningUtils.applySceneDarkening(scene, '14:00'));
    assert.equal(appliedBlend, 2);
    assert.equal(fillCount, 2);
});
