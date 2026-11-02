const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const filename = path.resolve(__dirname, '../src/controllers/game/scenes/SendUserToSceneController.js');

test('puerta sin sala de destino conserva al usuario en su sala anterior', async () => {
  const source = fs.readFileSync(filename, 'utf8');
  let removals = 0;
  const logEntries = [];
  const context = {
    module: { exports: {} },
    require: name => {
      if (name.includes('RemoveUserFromSceneTask')) return { main: () => { removals++; } };
      if (name.includes('PublicScenesCollection')) return { getById: () => null };
      if (name.includes('GameScenesCollection')) return { getById: () => null };
      if (name.includes('ConsoleLogger')) return class { log(message) { logEntries.push(message); } };
      return {};
    },
    console,
  };
  vm.runInNewContext(source, context, { filename });
  const controller = context.module.exports;
  const original = { id: 'lobby', name: 'Sala origen' };
  const user = { currentArea: original };
  await controller.main(user, { public_scene_id: 'missing' });
  assert.equal(removals, 0);
  assert.equal(user.currentArea, original);
  assert.equal(logEntries.length, 1);
});
