'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const JoinController = require('../src/controllers/game/scenes/UserJoinPublicSceneController');
const ConnectedUsersCollection = require('../src/collections/ConnectedUsersCollection');
const MenuTypeEnum = require('../src/enums/MenuTypeEnum');
const ResponseSocketsEnum = require('../src/enums/ResponseSocketsEnum');
const PublicScenesCollection = require('../src/collections/PublicScenesCollection');

test('nonexistent BoomBang public room returns an error without disconnecting the player', async () => {
  const replies = [];
  const socket = {id:'missing-scene-test',emit(name,data){replies.push({name,data});}};
  const user = {currentArea:null,setArea(){throw Error('Invalid room must not be joined');}};
  const originalUser = ConnectedUsersCollection.getBySocketId;
  const originalScene = PublicScenesCollection.getByUid;
  ConnectedUsersCollection.getBySocketId = id => id === socket.id ? user : originalUser.call(ConnectedUsersCollection,id);
  PublicScenesCollection.getByUid = () => undefined;
  try {
    await JoinController.main(socket,{}, {menuType:MenuTypeEnum.PUBLIC_SCENE,sceneUuid:'nonexistent-scene'});
    assert.deepEqual(replies,[{name:ResponseSocketsEnum.JOIN_PUBLIC_SCENE,data:{success:false,message:'Scene not found'}}]);
    assert.equal(user.currentArea,null);
  } finally {
    ConnectedUsersCollection.getBySocketId = originalUser;
    PublicScenesCollection.getByUid = originalScene;
  }
});
