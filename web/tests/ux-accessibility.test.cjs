const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repository = path.resolve(__dirname, '..', '..');
const read = filename => fs.readFileSync(path.join(repository, filename), 'utf8');
const pages = ['index.html', 'comunidad.html', 'mejoras.html'];

test('header, navegación por teclado y footer accesibles en las tres páginas', () => {
  for (const page of pages) {
    const html = read('web/' + page);
    assert.match(html, /<html lang="es-CL">/);
    assert.match(html, /class="skip-link" href="#principal"/);
    assert.match(html, /class="site-header" id="arriba"/);
    assert.match(html, /aria-controls="main-nav" aria-expanded="false"/);
    assert.match(html, /<nav id="main-nav".*aria-label="Navegación principal"/);
    assert.match(html, /class="footer-utility"/);
    assert.match(html, /href="#arriba"/);
    assert.match(html, /Estado actual: portal informativo/);
    assert.doesNotMatch(html, /href="http:\/\/play\.boombang\.com"/);
  }
});

test('el menú y las animaciones se degradan correctamente con accesibilidad', () => {
  const js = read('web/script.js');
  const css = read('web/styles.css');
  assert.doesNotThrow(() => new Function(js));
  assert.match(js, /aria-current/);
  assert.match(js, /close\(true\)/);
  assert.match(js, /prefers-reduced-motion/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /max-height:calc\(100dvh - 70px\)/);
});

test('el cliente ya no usa la hoja global de la demo Vite', () => {
  const css = read('client/src/style.css');
  const html = read('client/index.html');
  assert.doesNotMatch(css, /place-items:\s*center/);
  assert.doesNotMatch(css, /max-width:\s*1280px/);
  assert.match(css, /#app\s*\{/);
  assert.match(html, /<html lang="es-CL">/);
  assert.doesNotMatch(html, /vite\.svg/);
});

test('las pestañas del lobby funcionan con teclado en los seis idiomas', () => {
  const src = read('client/src/views/components/game/lobby/LobbyTabsComponent.vue');
  const buttons = src.match(/<button\b/g) || [];
  assert.equal(buttons.length, 4);
  assert.match(src, /:aria-pressed="activeTab === 'search'"/);
  assert.match(src, /aria-hidden="true"/);
  for (const locale of ['es', 'en', 'ja', 'ko', 'ru', 'zh']) {
    const data = JSON.parse(read('client/src/assets/lang/' + locale + '/translations.json'));
    assert.ok(data.lobby.tabs.search, 'falta búsqueda en ' + locale);
  }
});

test('la entrada a salas se recupera de rechazos y tiempos de espera', () => {
  const areas = read('client/src/views/components/game/lobby/AreasTabComponent.vue');
  const lobby = read('client/src/views/screens/game/LobbyScreen.vue');
  const screens = read('client/src/views/screens/game/GameScreens.vue');
  assert.match(areas, /join-error.*role="alert"/);
  assert.match(areas, /resetJoining\(message = ""\)/);
  assert.match(areas, /setTimeout\(\(\) => \{/);
  assert.match(lobby, /resetSceneJoin\(message/);
  assert.match(screens, /resetSceneJoin\(/);
});

test('los eventos malformados no impiden dibujar los válidos', () => {
  const js = read('web/comunidad.js');
  assert.match(js, /if \(!event \|\| typeof event !== 'object'/);
  assert.match(js, /No se pudo cargar la agenda/);
  assert.doesNotMatch(js, /innerHTML\s*=/);
});
