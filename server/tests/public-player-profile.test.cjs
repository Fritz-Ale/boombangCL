'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const UserResource = require('../src/resources/UserResource');

test('public player profiles exclude credentials and administrative controls', () => {
  const user = {
    id:9, username:'test-player', socket:{id:'profile-test-socket'},
    authJwt:'private-jwt-value',adminTools:{ban:true},
    currentAreaPosition:{x:1,y:2,z:0},avatarId:4
  };
  const publicProfile = UserResource.publicProfile(user);
  assert.equal(publicProfile.username,'test-player');
  assert.equal(publicProfile.socket_id,'profile-test-socket');
  assert.equal(publicProfile.x,1);
  assert.equal(publicProfile.avatar_id,4);
  assert.equal(Object.hasOwn(publicProfile,'authJwt'),false);
  assert.equal(Object.hasOwn(publicProfile,'admin_tools'),false);
  const ownProfile = new UserResource().transform(user);
  assert.equal(ownProfile.authJwt,'private-jwt-value',
    'the authenticated player resource retains its existing contract');
});
