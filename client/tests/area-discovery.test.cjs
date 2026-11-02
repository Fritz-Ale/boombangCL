const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const vue = fs.readFileSync(path.join(__dirname, '../src/views/components/game/lobby/AreasTabComponent.vue'), 'utf8');
const script = vue.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'No se encuentra <script> de AreasTabComponent');
const source = script.replace(/^import[^\n]+$/gm, '').replace('export default {', 'return {');
const component = new Function('MenuTypeEnum', 'useOverlayScrollbars', 'SpinnerComponent', source)(
  { PUBLIC_SCENE: 1 }, () => ({}), {}
);
const scenes = [
  { uuid: 'u1', name: 'U.F.O.', total_users_in: 3 },
  { uuid: 'u2', name: 'Área Austral', total_users_in: 8 },
  { uuid: 'u3', name: 'Beluga Beach', total_users_in: 2 }
];

test('filtro de salas ignora acentos y diferencia de mayúsculas', () => {
  const ctx = { publicScenes: scenes, searchTerm: 'area austral', sortBy: 'popular' };
  assert.deepEqual(component.computed.filteredScenes.call(ctx).map(a => a.uuid), ['u2']);
});

test('salas más visitadas aparecen primero sin alterar los datos recibidos', () => {
  const input = [...scenes];
  const ctx = { publicScenes: input, searchTerm: '', sortBy: 'popular' };
  assert.deepEqual(component.computed.filteredScenes.call(ctx).map(a => a.uuid), ['u2', 'u1', 'u3']);
  assert.deepEqual(input.map(a => a.uuid), ['u1', 'u2', 'u3']);
});

test('orden alfabético y respuesta null protegida', () => {
  const ctx = { publicScenes: scenes, searchTerm: '', sortBy: 'nombre' };
  assert.deepEqual(component.computed.filteredScenes.call(ctx).map(a => a.uuid), ['u2', 'u3', 'u1']);
  assert.deepEqual(component.computed.filteredScenes.call({ publicScenes: null, searchTerm: '', sortBy: 'popular' }), []);
});
