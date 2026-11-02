'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load(relative, deps) {
  const sandbox = { module: { exports: {} }, console, require(name) {
    if (!(name in deps)) throw new Error('Missing mock ' + name);
    return deps[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8'), sandbox);
  return sandbox.module.exports;
}
const purchaseEvents = {
  SHOP_PURCHASE:'purchase', REFRESH_USER_CREDITS:'credits',
  ADD_ITEM_TO_INVENTORY:'add', PUBLIC_INVENTORY_DATA:'inventory'
};
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
test('overlapping purchases of same account do not charge twice or interleave snapshots', async () => {
  const payment = deferred();
  let charges = 0;
  const user = { inventory: [], setInventory(items) { this.inventory = items; } };
  const emitted = [];
  const socket = { id:'s', emit: (event, payload) => emitted.push([event,payload]) };
  const handler = load('src/controllers/game/shop/PurchaseShopItemController.js', {
    '../../../collections/ConnectedUsersCollection': { getBySocketId: () => user },
    '../../../enums/ResponseSocketsEnum': purchaseEvents,
    '../../../services-api/ShopApiService': { purchaseItem() { charges++; return payment.promise; } },
    '../../../services-api/InventoryApiService': { async getUserInventory() { return { inventory: [{ id: 3 }] }; } }
  });
  const first = handler.main(socket, {}, { catalog_item_id: 3, quantity: 1 });
  await handler.main(socket, {}, { catalog_item_id: 3, quantity: 1 });
  assert.equal(charges, 1);
  assert.equal(emitted.find(([e, p]) => e === 'purchase' && !p.success)[1].success, false);
  payment.resolve({success:true, user:{gold:5,silver:10}});
  await first;
  assert.equal(user._purchasePending, false);
  assert.equal(emitted.filter(([event]) => event === 'add').length, 1);
  assert.equal(emitted.filter(([event,payload]) => event === 'purchase' && payload.success).length, 1);
});
test('failed inventory API response never clears backpack with an empty successful snapshot', async () => {
  const events = [];
  const user = { inventory: [{ id: 99 }] };
  const socket = { id:'s', emit: (event, payload) => events.push([event,payload]) };
  const handler = load('src/controllers/game/inventory/GetPublicInventoryController.js', {
    '../../../collections/ConnectedUsersCollection': { getBySocketId: () => user },
    '../../../enums/ResponseSocketsEnum': purchaseEvents,
    '../../../services-api/InventoryApiService': { getUserInventory: async () => ({
      success: false, statusCode: 500, inventory: []
    }) }
  });
  await handler.main(socket, {});
  assert.equal(events.length, 1);
  assert.equal(events[0][1].success, false);
  assert.equal(user.inventory.length, 1);
});
