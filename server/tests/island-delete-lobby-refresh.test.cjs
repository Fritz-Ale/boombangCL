'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
function load(p,deps){const ctx={module:{exports:{}},console:{error(){}},setTimeout:callback=>{callback();return 0;},require:k=>{if(!(k in deps))throw Error(k);return deps[k];}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'..',p),'utf8'),ctx);return ctx.module.exports;}
test('successful island removal broadcasts authoritative list after deleting active rooms',async()=>{
 let broadcasts=0,removed=0;const events=[];
 const player={socket:{emit(){}},setArea(){},id:8};
 const scene={id:7,users:[player],removeUser(){this.users=[];}};
 const ctrl=load('src/controllers/game/islands/DeleteIslandController.js',{
 '../../../enums/ResponseSocketsEnum':{FORCE_LOBBY_REDIRECT:'redirect',ISLAND_DELETED:'deleted'},
 '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>({id:'owner'})},
 '../../../services-api/IslandApiService':{delete:async()=>({success:true})},
 '../../../collections/PrivateScenesCollection':{getByIslandId:()=>[scene],remove(){removed++;}},
 './GetPublicIslandsController':{broadcastToLobby(){assert.equal(removed,1);broadcasts++;}}
 });
 await ctrl.main({id:'owner',emit(e){events.push(e);}},{in(){return{emit(){}};}},{islandId:1});
 assert.equal(broadcasts,1);assert.ok(events.includes('redirect'));
});
test('failed island deletion does not broadcast a false lobby refresh',async()=>{
 let broadcasts=0;
 const ctrl=load('src/controllers/game/islands/DeleteIslandController.js',{
 '../../../enums/ResponseSocketsEnum':{ERROR_ISLAND_DELETE:'error'},
 '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>({id:'owner'})},
 '../../../services-api/IslandApiService':{delete:async()=>({success:false})},
 '../../../collections/PrivateScenesCollection':{getByIslandId:()=>{throw Error('not expected');}},
 './GetPublicIslandsController':{broadcastToLobby(){broadcasts++;}}
 });
 await ctrl.main({id:'owner',emit(){}},{},{islandId:1});
 assert.equal(broadcasts,0);
});
