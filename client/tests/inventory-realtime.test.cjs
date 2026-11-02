'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const helperSource = read('src/phaser/utils/sceneSocketSubscriptions.js');
const sceneSocketSubscriptions = vm.runInNewContext(
    helperSource.replace('export default function', 'function') + '\nsceneSocketSubscriptions;',
    {}
);

const socketEvents = {
    ADD_ITEM_TO_INVENTORY: 'response:add_item_to_inventory',
    SCENE_REMOVE_ITEM: 'response:scene_remove_item',
    SCENE_PUT_ITEM: 'response:scene_put_item',
    REMOVE_ITEM_FROM_INVENTORY: 'response:remove_item_from_inventory',
    ROTATE_OBJECT: 'response:rotate_object',
    PRIVATE_SCENE_COLORS_UPDATED: 'response:private_scene_colors_updated'
};

function makeSceneClass(socket) {
    const source = read('src/phaser/PrivateScene.js')
        .replace(/^import [^\r\n]+\r?\n/gm, '')
        .replace('export default class PrivateScene', 'class PrivateScene')
        .replaceAll('import.meta.env', '({ VITE_APP_ENV: "production" })')
        + '\nPrivateScene;';
    return vm.runInNewContext(source, {
        Phaser: { Scene: class { constructor() { this.events = new EventEmitter(); } } },
        sceneSocketSubscriptions,
        socket,
        ResponseSocketsEnum: socketEvents,
        PrivateSceneUpdateColorsService: { main() {} },
        console
    });
}

function makeScene(socket) {
    const PrivateScene = makeSceneClass(socket);
    const scene = new PrivateScene();
    scene.sceneItems = [];
    scene.inventoryItemsList = [];
    scene.sceneData = { scenery: { id: 99 } };
    scene.markOccupiedTiles = () => {};
    scene.renderSceneObjects = () => {};
    scene.inventoryUpdates = 0;
    scene.updateHTMLInventoryUI = () => scene.inventoryUpdates++;
    scene.handleSockets();
    return scene;
}

test('removing an island object updates backpack immediately, without leaving room', () => {
    const socket = new EventEmitter();
    const scene = makeScene(socket);
    let destroyed = 0;
    scene.sceneItems = [{ id: 42, sprite: { destroy() { destroyed++; } } }];
    socket.emit(socketEvents.SCENE_REMOVE_ITEM, { user_catalog_item_id: '42' });
    assert.equal(scene.sceneItems.length, 0, 'numeric/string ID must remove sprite');
    assert.equal(destroyed, 1);

    const removedItem = { id: 42, sprite_name: 'chile_tree', image_url: '/test.png', private_scene_id: 99 };
    socket.emit(socketEvents.ADD_ITEM_TO_INVENTORY, { item: removedItem });
    assert.equal(scene.inventoryItemsList.length, 1, 'item visible in current inventory');
    assert.equal(scene.inventoryItemsList[0].private_scene_id, null);
    assert.equal(scene.inventoryUpdates, 1, 'HTML inventory must refresh');
    socket.emit(socketEvents.ADD_ITEM_TO_INVENTORY, { item: { ...removedItem, id: '42' } });
    assert.equal(scene.inventoryItemsList.length, 1, 'replayed event cannot duplicate item');
    assert.equal(scene.inventoryUpdates, 1, 'replayed event should not rerender');

    socket.emit(socketEvents.REMOVE_ITEM_FROM_INVENTORY, { user_catalog_item_id: '42' });
    assert.equal(scene.inventoryItemsList.length, 0, 'putting item back removes it from inventory');
    assert.equal(scene.inventoryUpdates, 2);
    scene.events.emit('shutdown');
});

test('moving to a new room removes stale inventory listeners but keeps new room active', () => {
    const socket = new EventEmitter();
    const oldScene = makeScene(socket);
    const currentScene = makeScene(socket);
    oldScene.events.emit('shutdown');
    socket.emit(socketEvents.ADD_ITEM_TO_INVENTORY, {
        item: { id: '901', sprite_name: 'new_chair' }
    });
    assert.equal(oldScene.inventoryItemsList.length, 0);
    assert.equal(currentScene.inventoryItemsList.length, 1);
    assert.equal(socket.listenerCount(socketEvents.ADD_ITEM_TO_INVENTORY), 1);
    currentScene.events.emit('destroy');
    assert.equal(socket.listenerCount(socketEvents.ADD_ITEM_TO_INVENTORY), 0);
});

function loadInventoryHtml() {
    const source = read('src/phaser/html/private-scene/InventoryPrivateSceneHtml.js')
        .replace(/^import [^\r\n]+\r?\n/gm, '')
        .replaceAll('import.meta.env', '({ VITE_APP_ENV: "production" })')
        .replace('export default InventoryPrivateSceneHtml;', '')
        + '\nInventoryPrivateSceneHtml;';
    // No global Phaser is injected: updating plain HTML must not depend on it.
    return vm.runInNewContext(source, { console });
}

function makeSlot() {
    const icon = { style: {}, src: '' };
    const count = { style: {}, textContent: '' };
    return {
        style: {},
        icon,
        count,
        querySelector: selector => selector === '.slot-icon' ? icon : count
    };
}

test('HTML backpack immediately shows new item, count, and valid page without Phaser global', () => {
    const InventoryHtml = loadInventoryHtml();
    const scene = {
        inventoryPage: 12,
        inventoryItemsList: [{ id: 1, sprite_name: 'chile_tree', image_url: '/tree.png', width: null, height: null }]
    };
    const inventory = new InventoryHtml(scene);
    const page = { textContent: '' };
    const total = { textContent: '' };
    const slots = Array.from({ length: 9 }, makeSlot);
    inventory.htmlInventoryElement = {
        querySelector: selector => selector === '#inventory-page' ? page : total,
        querySelectorAll: () => slots
    };
    inventory.updateInventoryUI();
    assert.equal(scene.inventoryPage, 0, 'out-of-range page must be corrected');
    assert.equal(page.textContent, '1 / 1');
    assert.equal(total.textContent, 'Total: 1');
    assert.equal(slots[0].icon.style.display, 'block');
    assert.equal(slots[0].icon.src, '/tree.png');
    scene.inventoryItemsList.push({
        id: 2, sprite_name: 'chile_tree', image_url: '/tree.png', width: null, height: null
    });
    inventory.updateInventoryUI();
    assert.equal(total.textContent, 'Total: 2');
    assert.equal(slots[0].count.textContent, 2);
    assert.equal(slots[0].count.style.display, 'block');
});
