const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../src/models/SceneModel.js'), 'utf8');
const start = source.indexOf('    getNavigationMapWithPlayers(excludeUserId)');
const end = source.indexOf('    #startItemActivationChecks()', start);
assert.ok(start >= 0 && end > start, 'se encuentra método de navegación');
const method = source.slice(start, end).trim();
const navigation = new Function('return ({' + method + '})')();

test('jugadores sin coordenadas no rompen el mapa de rutas', () => {
  const scene = Object.assign(Object.create(navigation), {
    navigationMapBase: [[0, 0], [0, 0]],
    users: [
      { id: 1, currentAreaPosition: { x: 1, y: 0 } },
      { id: 2, currentAreaPosition: { x: null, y: null } },
      { id: 3, currentAreaPosition: { x: 999, y: -3 } },
      { id: 4 },
    ],
    reservedTiles: { '99,99': 1, '1,1': 1, 'undefined,0': 4 },
  });
  const map = scene.getNavigationMapWithPlayers(0);
  assert.deepEqual(map, [[0, 1], [0, 1]]);
  assert.deepEqual(scene.navigationMapBase, [[0, 0], [0, 0]]);
});

test('el mapa excluye al jugador que solicita la ruta', () => {
  const scene = Object.assign(Object.create(navigation), {
    navigationMapBase: [[0, 0], [0, 0]],
    users: [{ id: 'self', currentAreaPosition: { x: 0, y: 0 } }],
    reservedTiles: {},
  });
  assert.deepEqual(scene.getNavigationMapWithPlayers('self'), [[0, 0], [0, 0]]);
});
