'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
function controller(file, mocks) {
  const sandbox = { module: { exports: {} }, console,
    require: name => {
      if (!(name in mocks)) throw new Error('Unmocked dependency ' + name);
      return mocks[name];
    }
  };
  vm.runInNewContext(read(file), sandbox, { filename: file });
  return sandbox.module.exports;
}
const response = {
  SHOP_PURCHASE: 'purchase', REFRESH_USER_CREDITS: 'credits',
  ADD_ITEM_TO_INVENTORY: 'add', PUBLIC_INVENTORY_DATA: 'snapshot'
};
test('successful purchase updates active room backpack once for numeric/string equivalent ids', async () => {
  const events = [];
  const socket = { id: 's1', emit: (event, data) => events.push([event, data]) };
  const user = {
    inventory: [{ id: '12' }], gold: 100, silver: 50,
    setInventory(items) { this.inventory = items; }
  };
  const ctrl = controller('src/controllers/game/shop/PurchaseShopItemController.js', {
    '../../../collections/ConnectedUsersCollection': { getBySocketId: () => user },
    '../../../enums/ResponseSocketsEnum': response,
    '../../../services-api/ShopApiService': { purchaseItem: async () => ({
      success: true, message: 'OK', user: { gold: 90, silver: 50 }
    }) },
    '../../../services-api/InventoryApiService': { getUserInventory: async () => ({
      inventory: [{ id: 12 }, { id: '13' }]
    }) }
  });
  await ctrl.main(socket, {}, { catalog_item_id: 5, quantity: 1 });
  const added = events.filter(([event]) => event === 'add');
  assert.equal(added.length, 1);
  assert.equal(added[0][1].item.id, '13');
  assert.equal(user.gold, 90);
  assert.equal(events.filter(([event]) => event === 'snapshot').length, 1);
  assert.equal(events.filter(([event]) => event === 'purchase').length, 1);
});
test('failure of inventory snapshot after charged purchase still responds without double-charge', async () => {
  const events = [];
  const socket = { id: 's1', emit: (event, data) => events.push([event, data]) };
  const user = { inventory: [], setInventory(items) { this.inventory = items; } };
  const ctrl = controller('src/controllers/game/shop/PurchaseShopItemController.js', {
    '../../../collections/ConnectedUsersCollection': { getBySocketId: () => user },
    '../../../enums/ResponseSocketsEnum': response,
    '../../../services-api/ShopApiService': { purchaseItem: async () => ({
      success: true, user: { gold: 2, silver: 1 }
    }) },
    '../../../services-api/InventoryApiService': { getUserInventory: async () => {
      throw new Error('Inventory service offline');
    } }
  });
  const original = console.error;
  console.error = () => {};
  try { await ctrl.main(socket, {}, { catalog_item_id: 5, quantity: 1 }); }
  finally { console.error = original; }
  assert.equal(events.find(([e]) => e === 'purchase')[1].success, true);
  assert.equal(events.filter(([e]) => e === 'purchase').length, 1);
});
test('decoration endpoints reject failed DB writes and return success for confirmed ones', async () => {
  let mode = 'rejected';
  const service = controller('src/services-api/PrivateSceneApiService.js', {
    './ApiService': { post: async () => mode === 'rejected' ?
      { success: false, statusCode: 500 } : { success: true } }
  });
  await assert.rejects(() => service.removeItem({ user_catalog_item_id: 3 }, { authJwt: 'test' }));
  mode = 'accepted';
  assert.equal((await service.putItem({ user_catalog_item_id: 3 }, { authJwt: 'test' })).success, true);
});
test('room objects are updated only after awaiting storage confirmation', () => {
  const put = read('src/controllers/game/private-scenes/PutItemPrivateSceneController.js');
  const remove = read('src/controllers/game/private-scenes/RemoveItemPrivateSceneController.js');
  assert.ok(put.indexOf('await PrivateSceneApiService.putItem') < put.indexOf('user.inventory.splice'));
  assert.ok(put.indexOf('await PrivateSceneApiService.updateItemPosition') < put.indexOf('itemToMove.occupied_tiles = occupied_tiles'));
  assert.ok(remove.indexOf('await PrivateSceneApiService.removeItem') < remove.indexOf('user.inventory.push'));
  assert.match(put, /_catalogMutationPending/);
  assert.match(remove, /_catalogMutationPending/);
  const scene = read('src/models/PrivateSceneModel.js');
  assert.match(scene, /rebuildObjectNavigationMap\(\)/);
});
