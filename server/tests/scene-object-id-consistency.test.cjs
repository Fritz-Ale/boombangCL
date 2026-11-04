'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('placing item with string inventory ID accepts numeric socket ID and reserves tiles', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/controllers/game/private-scenes/PutItemPrivateSceneController.js'), 'utf8');
  const sceneEvents = [], socketEvents = [];
  const item = { id:'44', map_size:[[0,0]], occupied_tiles:[], type_of_behavior:0 };
  const scene = { id:8, user_id:'3', scene_type:'private', objects:[], max_objects:20,
    game_map:[[0,0],[0,0]], map_rows:2, map_cols:2, rebuildObjectNavigationMap() {},
    emit(event, payload) {sceneEvents.push([event,payload]);} };
  const user = { id:'3', currentArea:scene, inventory:[item] };
  const socket = { id:'test', emit(event,payload) {socketEvents.push([event,payload]);} };
  const sandbox = {module:{exports:{}}, console:{error() {}}, require(name) {
    const deps = {
      '../../../utils/Log':{error() {}},
      '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>user},
      '../../../enums/SceneTypesEnum':{PRIVATE_SCENE:'private'},
      '../../../enums/ResponseSocketsEnum':{SCENE_PUT_ITEM:'put', REMOVE_ITEM_FROM_INVENTORY:'remove'},
      '../../../services-api/PrivateSceneApiService':{async putItem() {return {success:true};}},
      '../../../enums/CatalogItemTypeOfBehaviorEnum':{WALKABLE:1,WALKABLE_OVERLAY:2}
    };
    if (!(name in deps)) throw new Error(name);
    return deps[name];
  }};
  vm.runInNewContext(source,sandbox);
  await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:44,occupied_tiles:[[1,1]],is_move:false});
  assert.equal(user.inventory.length,0);
  assert.equal(scene.objects.length,1);
  assert.equal(sceneEvents.filter(([event])=>event==='put').length,1);
  assert.equal(socketEvents.filter(([event])=>event==='remove').length,1);
  assert.equal(scene._catalogMutationPending,false);
});
test('moving existing object excludes itself from collision when serialized ID is a string', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/controllers/game/private-scenes/PutItemPrivateSceneController.js'), 'utf8');
  let persisted=0;
  const item = {id:'44',private_scene_id:8,map_size:[[0,0]],occupied_tiles:[[0,0]],type_of_behavior:0};
  const scene = {id:8,user_id:'3',scene_type:'private',objects:[item],max_objects:20,game_map:[[0,0],[0,0]],map_rows:2,map_cols:2,
    rebuildObjectNavigationMap(){},emit(){}};
  const user={id:'3',currentArea:scene,inventory:[]};
  const socket={id:'test',emit(){}};
  const dependencies={
    '../../../utils/Log':{error(){}},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>user},
    '../../../enums/SceneTypesEnum':{PRIVATE_SCENE:'private'},
    '../../../enums/ResponseSocketsEnum':{SCENE_PUT_ITEM:'put'},
    '../../../services-api/PrivateSceneApiService':{async updateItemPosition(){persisted++;return {success:true};}},
    '../../../enums/CatalogItemTypeOfBehaviorEnum':{WALKABLE:1,WALKABLE_OVERLAY:2}
  };
  const sandbox={module:{exports:{}},console:{error(){}},require(key){return dependencies[key];}};
  vm.runInNewContext(source,sandbox);
  await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:44,occupied_tiles:[[0,0]],is_move:true});
  assert.equal(persisted,1);
  assert.equal(item.occupied_tiles[0][0],0);
});

test('retirar muebles valida ids antes de consultar API y acepta cadenas decimales validas', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/controllers/game/private-scenes/RemoveItemPrivateSceneController.js'), 'utf8');
  const item = {id:'44',private_scene_id:8,occupied_tiles:[[0,0]]};
  const notifications=[];
  let persisted=0;
  const scene = {id:8,user_id:'3',scene_type:'private',objects:[item],rebuildObjectNavigationMap(){},
    emit(event,payload){notifications.push([event,payload]);}};
  const user={id:'3',currentArea:scene,inventory:[]};
  const deps={
    '../../../utils/Log':{error(){}},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>user},
    '../../../enums/SceneTypesEnum':{PRIVATE_SCENE:'private'},
    '../../../enums/ResponseSocketsEnum':{SCENE_REMOVE_ITEM:'scene_remove',ADD_ITEM_TO_INVENTORY:'add'},
    '../../../services-api/PrivateSceneApiService':{async removeItem(){persisted++;return {success:true};}}
  };
  const sandbox={module:{exports:{}},console:{error(){}},require(key){return deps[key];}};
  vm.runInNewContext(source,sandbox);
  const outbound=[];
  const socket={id:'test',emit(event,payload){outbound.push([event,payload]);}};
  for(const invalid of [null,undefined,-1,0,'0','44x','1e3',{},[],1.2,Number.MAX_SAFE_INTEGER+1]){
    await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:invalid});
  }
  assert.equal(persisted,0);
  assert.equal(scene.objects.length,1);
  assert.equal(user.inventory.length,0);
  assert.equal(scene._catalogMutationPending,undefined);
  await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:'44'});
  assert.equal(persisted,1);
  assert.equal(scene.objects.length,0);
  assert.equal(user.inventory.length,1);
  assert.equal(scene._catalogMutationPending,false);
  assert.equal(notifications.length,1);
  assert.equal(outbound.filter(([event])=>event==='add').length,1);
});

test('colocar y mover aceptan IDs decimales seguros sin persistir entradas invalidas', async () => {
  const source=fs.readFileSync(path.join(__dirname,'../src/controllers/game/private-scenes/PutItemPrivateSceneController.js'),'utf8');
  const item={id:'44',private_scene_id:null,map_size:[[0,0]],occupied_tiles:[],type_of_behavior:0};
  const emitted=[];
  let placed=0,moved=0;
  const scene={id:8,user_id:'3',scene_type:'private',objects:[],max_objects:20,
    game_map:[[0,0],[0,0]],map_rows:2,map_cols:2,rebuildObjectNavigationMap(){},
    emit(name,payload){emitted.push([name,payload]);}};
  const user={id:'3',currentArea:scene,inventory:[item]};
  const socket={id:'test',emit(name,payload){emitted.push([name,payload]);}};
  const deps={
    '../../../utils/Log':{error(){}},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>user},
    '../../../enums/SceneTypesEnum':{PRIVATE_SCENE:'private'},
    '../../../enums/ResponseSocketsEnum':{SCENE_PUT_ITEM:'put',REMOVE_ITEM_FROM_INVENTORY:'remove'},
    '../../../services-api/PrivateSceneApiService':{
      async putItem(){placed++;return {success:true};},
      async updateItemPosition(){moved++;return {success:true};}
    },
    '../../../enums/CatalogItemTypeOfBehaviorEnum':{WALKABLE:1,WALKABLE_OVERLAY:2}
  };
  const sandbox={module:{exports:{}},console:{error(){}},require(name){return deps[name];}};
  vm.runInNewContext(source,sandbox);
  for(const invalid of [null,undefined,0,-1,'0','44x','1e3',{},[],1.5,Number.MAX_SAFE_INTEGER+1]){
    await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:invalid,occupied_tiles:[[0,0]],is_move:false});
  }
  assert.equal(placed,0);
  assert.equal(scene.objects.length,0);
  assert.equal(user.inventory.length,1);
  assert.equal(scene._catalogMutationPending,undefined);
  await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:'44',occupied_tiles:[[0,0]],is_move:false});
  assert.equal(placed,1);
  assert.equal(scene.objects.length,1);
  assert.equal(user.inventory.length,0);
  await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:'44',occupied_tiles:[[1,0]],is_move:true});
  assert.equal(moved,1);
  assert.equal(item.occupied_tiles[0][0],1);
  assert.equal(scene._catalogMutationPending,false);
  assert.equal(emitted.filter(([event])=>event==='put').length,2);
});

test('rechaza mover un mueble que declara pertenecer a otra isla', async () => {
  const source=fs.readFileSync(path.join(__dirname,'../src/controllers/game/private-scenes/PutItemPrivateSceneController.js'),'utf8');
  let persisted=0;
  const item={id:'44',private_scene_id:99,map_size:[[0,0]],occupied_tiles:[[0,0]],type_of_behavior:0};
  const scene={id:8,user_id:'3',scene_type:'private',objects:[item],max_objects:20,
    game_map:[[0,0],[0,0]],map_rows:2,map_cols:2,rebuildObjectNavigationMap(){},
    emit(){throw Error('No se debe notificar un movimiento rechazado');}};
  const user={id:'3',currentArea:scene,inventory:[]};
  const emitted=[];
  const socket={id:'test',emit(event){emitted.push(event);}};
  const deps={
    '../../../utils/Log':{error(){}},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>user},
    '../../../enums/SceneTypesEnum':{PRIVATE_SCENE:'private'},
    '../../../enums/ResponseSocketsEnum':{SCENE_PUT_ITEM:'put'},
    '../../../services-api/PrivateSceneApiService':{async updateItemPosition(){persisted++;}},
    '../../../enums/CatalogItemTypeOfBehaviorEnum':{WALKABLE:1,WALKABLE_OVERLAY:2}
  };
  const sandbox={module:{exports:{}},console:{error(){}},require(key){return deps[key];}};
  vm.runInNewContext(source,sandbox);
  await sandbox.module.exports.main(socket,{}, {user_catalog_item_id:'44',occupied_tiles:[[1,0]],is_move:true});
  assert.equal(persisted,0);
  assert.equal(item.occupied_tiles[0][0],0);
  assert.equal(scene._catalogMutationPending,false);
  assert.deepEqual(emitted,['scene_item_error']);
});
