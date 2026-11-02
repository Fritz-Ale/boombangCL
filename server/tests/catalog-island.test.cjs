const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const UserCatalogItemModel = require('../src/models/UserCatalogItemModel');

test('inventario acepta datos antiguos y conserva dimensiones', () => {
  const o = new UserCatalogItemModel({map_size:null,occupied_tiles:'invalid',width:86,height:122,rarity_code:'ltd'});
  assert.deepEqual(o.map_size,[[0,0]]);
  assert.deepEqual(o.occupied_tiles,[]);
  assert.equal(o.width,86);
  assert.equal(o.height,122);
  assert.equal(o.rarity_code,'ltd');
});

function fixture(persist=async()=>({success:true}), operation='PutItemPrivateSceneController') {
  const calls=[], notified=[], sent=[];
  const scene={id:10,user_id:7,scene_type:'private',objects:[],max_objects:20,
    game_map:[[0,0]],map_rows:1,map_cols:2,navigationMapBase:[[0,0]],
    rebuildObjectNavigationMap() {
      this.navigationMapBase = this.game_map.map(row => [...row]);
      this.objects.forEach(object => (object.occupied_tiles || []).forEach(([x,y]) => {
        if (object.type_of_behavior !== 'walkable' && object.type_of_behavior !== 'overlay') {
          this.navigationMapBase[y][x] = 1;
        }
      }));
    },
    emit:(name,data)=>notified.push({name,data})};
  const item={id:35,private_scene_id:null,occupied_tiles:[],type_of_behavior:'BLOCKING'};
  const user={id:7,currentArea:scene,inventory:[item]};
  const socket={id:'socket7',emit:(name,data)=>sent.push({name,data})};
  const api={
    putItem:async data=>{calls.push('put');return persist(data)},
    updateItemPosition:async data=>{calls.push('move');return persist(data)},
    removeItem:async data=>{calls.push('remove');return persist(data)},
  };
  const filename=path.join(__dirname,'../src/controllers/game/private-scenes',operation+'.js');
  const context={
    module:{exports:{}},console:{error(){}},
    require:name=>{
      if(name.includes('ConnectedUsersCollection'))return {getBySocketId:()=>user};
      if(name.includes('SceneTypesEnum'))return {PRIVATE_SCENE:'private'};
      if(name.includes('ResponseSocketsEnum'))return {SCENE_PUT_ITEM:'put',SCENE_REMOVE_ITEM:'remove',REMOVE_ITEM_FROM_INVENTORY:'take',ADD_ITEM_TO_INVENTORY:'give'};
      if(name.includes('PrivateSceneApiService'))return api;
      if(name.includes('CatalogItemTypeOfBehaviorEnum'))return {WALKABLE:'walkable',WALKABLE_OVERLAY:'overlay'};
      if(name.includes('Log'))return {error(){}};
      if(name.includes('DisconnectUserController'))return {main(){}};
      throw Error('Unmocked '+name);
    },
  };
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),context,{filename});
  return {Controller:context.module.exports,scene,item,user,socket,calls,notified,sent};
}

test('fallo de API no quita objeto del inventario', async()=>{
  const o=fixture(async()=>{throw Error('HTTP 403')});
  await o.Controller.main(o.socket,{}, {user_catalog_item_id:35,occupied_tiles:[[0,0]]});
  assert.equal(o.scene.objects.length,0);
  assert.equal(o.user.inventory.length,1);
  assert.equal(o.notified.length,0);
  assert.ok(o.sent.find(x=>x.name==='scene_item_error'));
  assert.equal(o.scene._catalogMutationPending,false);
});

test('colocación solo modifica isla luego de guardado confirmado',async()=>{
  let release;
  const o=fixture(()=>new Promise(resolve=>{release=resolve}));
  const task=o.Controller.main(o.socket,{}, {user_catalog_item_id:35,occupied_tiles:[[1,0]]});
  assert.equal(o.scene.objects.length,0);
  assert.equal(o.scene._catalogMutationPending,true);
  release({success:true});
  await task;
  assert.equal(o.scene.objects.length,1);
  assert.equal(o.user.inventory.length,0);
  assert.equal(o.notified[0].name,'put');
});

test('casillas inválidas no llegan a Laravel',async()=>{
  const o=fixture();
  for(const tiles of [[],[[0,0],[0,0]],[[null,0]],[[10,0]],[[1.5,0]]]){
    await o.Controller.main(o.socket,{}, {user_catalog_item_id:35,occupied_tiles:tiles});
  }
  assert.equal(o.calls.length,0);
  assert.equal(o.scene.objects.length,0);
});

test('fallo al retirar objeto no lo elimina de sala',async()=>{
  const o=fixture(async()=>{throw Error('HTTP 500')},'RemoveItemPrivateSceneController');
  o.scene.objects=[o.item];o.item.private_scene_id=10;o.item.occupied_tiles=[[0,0]];o.user.inventory=[];
  await o.Controller.main(o.socket,{}, {user_catalog_item_id:35});
  assert.equal(o.scene.objects.length,1);
  assert.equal(o.user.inventory.length,0);
  assert.equal(o.notified.length,0);
});

test('rechazo de API convertido a JSON impide confirmar',async()=>{
  const filename=path.join(__dirname,'../src/services-api/PrivateSceneApiService.js');
  const ctx={module:{exports:{}},require:name=>{
    if(name==='./ApiService')return {post:async()=>({statusCode:403,error:'Forbidden'})};
    throw Error(name);
  }};
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),ctx);
  await assert.rejects(()=>ctx.module.exports.putItem({}, {authJwt:'redacted'}),/Forbidden/);
});


test('mover un mueble conserva las colisiones del resto de objetos', async () => {
  const o=fixture();
  o.item.private_scene_id=10;o.item.occupied_tiles=[[0,0]];o.scene.objects=[o.item];
  o.scene.rebuildObjectNavigationMap();
  assert.deepEqual(o.scene.navigationMapBase,[[1,0]]);
  await o.Controller.main(o.socket,{}, {user_catalog_item_id:35,occupied_tiles:[[1,0]],is_move:true});
  assert.deepEqual(o.scene.navigationMapBase,[[0,1]]);
  assert.equal(o.notified.length,1);
  assert.deepEqual(o.item.occupied_tiles,[[1,0]]);
});

test('retiro confirmado desbloquea la casilla y devuelve el inventario', async () => {
  const o=fixture(undefined,'RemoveItemPrivateSceneController');
  o.scene.objects=[o.item];o.item.private_scene_id=10;o.item.occupied_tiles=[[0,0]];o.user.inventory=[];
  o.scene.rebuildObjectNavigationMap();
  await o.Controller.main(o.socket,{}, {user_catalog_item_id:35});
  assert.deepEqual(o.scene.navigationMapBase,[[0,0]]);
  assert.equal(o.scene.objects.length,0);
  assert.equal(o.user.inventory.length,1);
  assert.equal(o.notified.length,1);
});

test('un segundo cambio simultáneo de sala es rechazado hasta que el primero se guarda', async () => {
  let release;
  const o=fixture(()=>new Promise(resolve=>{release=resolve}));
  const first=o.Controller.main(o.socket,{}, {user_catalog_item_id:35,occupied_tiles:[[0,0]]});
  const second=o.Controller.main(o.socket,{}, {user_catalog_item_id:35,occupied_tiles:[[1,0]]});
  await second;
  assert.equal(o.calls.length,1);
  assert.equal(o.scene.objects.length,0);
  release({success:true});
  await first;
  assert.equal(o.scene.objects.length,1);
});
