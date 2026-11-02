'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load(file, dependencies) {
  const sandbox = {module:{exports:{}}, console:{error(){}}, setTimeout,
    require:key=>{if(!(key in dependencies))throw Error(key);return dependencies[key];}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),sandbox);
  return sandbox.module.exports;
}
test('rejected island deletion never evicts users or deletes the live room',async()=>{
  const events=[];let removeCount=0, playerRemovals=0;
  const player={socket:{emit(e){events.push('kick:'+e);}},setArea(){playerRemovals++;}};
  const room={id:7,users:[player],removeUser(){playerRemovals++;}};
  const socket={id:'s',emit(e){events.push(e);}};
  const handler=load('src/controllers/game/islands/DeleteIslandController.js',{
    '../../../enums/ResponseSocketsEnum':{ERROR_ISLAND_DELETE:'error',FORCE_LOBBY_REDIRECT:'kick'},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>({id:'owner'})},
    '../../../services-api/IslandApiService':{delete:async()=>({success:false,message:'denied'})},
    './GetPublicIslandsController':{broadcastToLobby(){}},
    '../islands/GetPublicIslandsController':{broadcastToLobby(){}},
    '../../../collections/PrivateScenesCollection':{
      getByIslandId:()=>[room],remove(){removeCount++;}
    }
  });
  await handler.main(socket,{in(){return {emit(){}};}},{islandId:2});
  assert.equal(playerRemovals,0);
  assert.equal(removeCount,0);
  assert.deepEqual(events,['error']);
});
test('rejected private room deletion never removes connected players',async()=>{
  const events=[];let removeCount=0,removePlayer=0;
  const room={id:7,island_id:2,users:[{id:3}]};
  const handler=load('src/controllers/game/private-scenes/DeletePrivateSceneController.js',{
    '../../../enums/ResponseSocketsEnum':{ERROR_PRIVATE_SCENE_DELETE:'error'},
    '../../../collections/ConnectedUsersCollection':{getBySocketId:()=>({id:'owner'})},
    '../../../services-api/PrivateSceneApiService':{delete:async()=>({statusCode:403,success:true})},
    '../../../collections/PrivateScenesCollection':{getById:()=>room,remove(){removeCount++;}},
    '../../../tasks/RemoveUserFromSceneTask':{main(){removePlayer++;}},
    '../islands/GetPublicIslandsController':{broadcastToLobby(){}}
  });
  await handler.main({id:'s',emit:e=>events.push(e)},{},{sceneId:7});
  assert.equal(removePlayer,0);
  assert.equal(removeCount,0);
  assert.deepEqual(events,['error']);
});
