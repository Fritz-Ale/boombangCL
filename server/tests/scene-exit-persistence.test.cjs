'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8');
function load(name, mocks) {
  const box = {module: {exports: {}}, console: {error() {}}, require: key => {
    if (!(key in mocks)) throw new Error('Missing dependency ' + key);
    return mocks[key];
  }};
  vm.runInNewContext(read(name), box, {filename: name});
  return box.module.exports;
}
test('removing a decoration after owner leaves updates the original shared room', async () => {
  let commit;
  const pending = new Promise(resolve => {commit = resolve;});
  const roomEvents = [], ownEvents = [];
  const item = {id: 10, private_scene_id: '17', occupied_tiles:[[1,1]]};
  const scene = {id:17,user_id:'4',scene_type:1,objects:[item],
    rebuildObjectNavigationMap() {this.rebuilt = true;},
    emit(event,data) {roomEvents.push([event,data]);}
  };
  const user = {id:'4',currentArea:scene, inventory:[]};
  const socket = {id:'abc',emit(event,data) {ownEvents.push([event,data]);}};
  const controller = load('src/controllers/game/private-scenes/RemoveItemPrivateSceneController.js', {
    '../../../utils/Log':{error() {}},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>user},
    '../../../enums/SceneTypesEnum':{PRIVATE_SCENE:1},
    '../../../enums/ResponseSocketsEnum':{SCENE_REMOVE_ITEM:'remove',ADD_ITEM_TO_INVENTORY:'add'},
    '../../../services-api/PrivateSceneApiService':{removeItem:()=>pending}
  });
  const op = controller.main(socket, {}, {user_catalog_item_id:10});
  assert.equal(scene.objects.length, 1);
  user.currentArea = {id:99};
  commit({success:true});
  await op;
  assert.equal(scene.objects.length, 0);
  assert.equal(scene.rebuilt, true);
  assert.equal(user.inventory.length, 1);
  assert.equal(roomEvents.filter(([event])=>event==='remove').length, 1);
  assert.equal(ownEvents.filter(([event])=>event==='add').length, 0);
  assert.equal(scene._catalogMutationPending, false);
});
test('placing and moving a decoration keeps old room as target after leaving', () => {
  const src=read('src/controllers/game/private-scenes/PutItemPrivateSceneController.js');
  assert.match(src,/scene\.objects\.push\(userCatalogItem\)/);
  assert.match(src,/scene\.emit\(ResponseSocketsEnum\.SCENE_PUT_ITEM/);
  assert.doesNotMatch(src,/if \(user\.currentArea !== scene\) return/);
  assert.match(src,/if \(user\.currentArea === scene\)/);
});
