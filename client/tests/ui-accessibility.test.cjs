const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('el juego tiene un viewport propio y no depende de la plantilla Vite', () => {
  const css = read('src/style.css');
  const html = read('index.html');
  assert.match(html, /<html lang="es-CL">/);
  assert.match(html, /BoomBangCL · Juego HTML5/);
  assert.doesNotMatch(html, /vite\.svg/);
  assert.match(css, /#app\s*\{/);
  assert.doesNotMatch(css, /place-items:\s*center/);
  assert.doesNotMatch(css, /max-width:\s*1280px/);
});

test('las pestañas del lobby son botones accesibles y traducidos', () => {
  const tabs = read('src/views/components/game/lobby/LobbyTabsComponent.vue');
  assert.equal((tabs.match(/<button\b/g) || []).length, 4);
  assert.match(tabs, /:aria-pressed="activeTab === 'search'"/);
  assert.match(tabs, /:aria-label="\$t\('lobby\.tabs\.search'\)"/);
  for (const lang of ['es', 'en', 'ja', 'ko', 'ru', 'zh']) {
    const messages = JSON.parse(read('src/assets/lang/' + lang + '/translations.json'));
    assert.ok(messages.lobby.tabs.search, lang + ': falta traducción del buscador');
  }
});

test('un fallo de entrada no deja los controles bloqueados', () => {
  const areas = read('src/views/components/game/lobby/AreasTabComponent.vue');
  const lobby = read('src/views/screens/game/LobbyScreen.vue');
  const screens = read('src/views/screens/game/GameScreens.vue');
  assert.match(areas, /role="alert"/);
  assert.match(areas, /resetJoining\(message = ""\)/);
  assert.match(areas, /clearTimeout\(this\.joinTimer\)/);
  assert.match(areas, /10000/);
  assert.match(lobby, /ref="areasTab"/);
  assert.match(lobby, /resetSceneJoin\(message/);
  assert.match(screens, /ref="lobbyScreen"/);
  assert.match(screens, /resetSceneJoin\(/);
});
