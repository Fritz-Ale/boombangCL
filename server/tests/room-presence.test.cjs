'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SyncController = require('../src/controllers/game/scenes/UserSyncController');
const ConnectedUsersCollection = require('../src/collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../src/enums/ResponseSocketsEnum');

test('room presence sync only sends current room peers and never exposes their JWT', () => {
  const events = [];
  const socket = {id:'room-sync-self',emit(name,data){events.push({name,data});}};
  const area = {users:[]};
  const otherArea = {users:[]};
  const player = {socket,currentArea:area};
  const peer = {
    id:101, socket:{id:'room-sync-peer'},currentArea:area,
    currentAreaPosition:{x:2,y:3,z:0},authJwt:'secret-token',adminTools:{superuser:true},
    username:'peer'
  };
  const outsider = {
    id:102,socket:{id:'room-sync-outsider'},currentArea:otherArea,
    currentAreaPosition:{x:1,y:1,z:0},authJwt:'other-secret',username:'outsider'
  };
  area.users = [player,peer,outsider];
  const original = ConnectedUsersCollection.getBySocketId;
  ConnectedUsersCollection.getBySocketId = id => id === socket.id ? player : original.call(ConnectedUsersCollection,id);
  try {
    SyncController.main(socket,{});
    assert.equal(events.length,1);
    assert.equal(events[0].name,ResponseSocketsEnum.USER_UPDATE_POSITION);
    assert.equal(events[0].data.user.username,'peer');
    assert.deepEqual(events[0].data.position,{x:2,y:3,z:0});
    assert.equal(Object.hasOwn(events[0].data.user,'authJwt'),false);
    assert.equal(Object.hasOwn(events[0].data.user,'admin_tools'),false);
  } finally {
    ConnectedUsersCollection.getBySocketId = original;
  }
});
