const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const pages = ['index.html', 'comunidad.html', 'mejoras.html'];

test('header y footer accesibles y coherentes entre las tres páginas', () => {
  const currentPages = ['index.html', 'comunidad.html', 'mejoras.html'];
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<header class="site-header" id="arriba">/);
    assert.match(html, /<nav id="main-nav" class="main-nav" aria-label="Navegación principal">/);
    assert.match(html, /aria-controls="main-nav" aria-expanded="false"/);
    assert.ok(html.includes('href="' + page + '" aria-current="page"'), 'sin página activa: ' + page);
    assert.match(html, /<footer class="site-footer" id="pie">/);
    assert.match(html, /href="#arriba">Volver arriba/);
    assert.match(html, /aria-label="Ayuda y proyecto"/);
    assert.match(html, /href="ui-improvements\.css"/);
    for (const destination of currentPages) {
      assert.ok(html.includes('href="' + destination + '"'), page + ': falta ' + destination);
    }
  }
});

test('la portada no ofrece una dirección de desarrollo como juego público', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /href="http:\/\/play\.boombang\.com"/);
  assert.match(html, /id="pasos-locales"/);
});

test('estilos cubren controles de foco y móviles estrechos', () => {
  const css = read('ui-improvements.css');
  assert.match(css, /focus-visible/);
  assert.match(css, /max-width: 420px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /footer-links/);
});

test('menú móvil abre y cierra con Escape restaurando el foco', () => {
  const events = {};
  const attributes = new Map([['aria-expanded', 'false']]);
  const classes = new Set();
  let focused = false;
  const nav = {
    classList: {
      add: key => classes.add(key),
      remove: key => classes.delete(key),
    },
    querySelectorAll: () => [],
    contains: target => target === nav || target === navLink,
  };
  const navLink = { name: 'enlace' };
  const button = {
    getAttribute: name => attributes.get(name),
    setAttribute: (name, value) => attributes.set(name, value),
    contains: target => target === button,
    focus: () => { focused = true; },
    addEventListener: (name, listener) => { events['button:' + name] = listener; },
  };
  const document = {
    activeElement: navLink,
    querySelector: () => button,
    getElementById: name => name === 'main-nav' ? nav : null,
    querySelectorAll: () => [],
    addEventListener: (name, listener) => { events['document:' + name] = listener; },
  };
  const window = { matchMedia: () => ({ matches: false, addEventListener() {} }) };
  vm.runInNewContext(read('script.js'), { document, window, Date, IntersectionObserver: undefined });
  events['button:click']();
  assert.equal(attributes.get('aria-expanded'), 'true');
  assert.equal(classes.has('open'), true);
  events['document:keydown']({ key: 'Escape' });
  assert.equal(attributes.get('aria-expanded'), 'false');
  assert.equal(classes.has('open'), false);
  assert.equal(focused, true);
});

async function renderAgenda(data, reject = false) {
  const list = {
    children: [],
    replaceChildren(...children) { this.children = [...children]; },
    append(...children) { this.children.push(...children); },
  };
  const document = {
    getElementById: name => name === 'eventos-lista' ? list : null,
    querySelectorAll: () => [],
    createElement: tag => ({
      tagName: tag,
      children: [],
      append(...nodes) { this.children.push(...nodes); },
      setAttribute(name, value) { this[name] = value; },
    }),
  };
  const fetch = () => reject ? Promise.reject(new Error('offline')) :
    Promise.resolve({ ok: true, json: async () => data });
  vm.runInNewContext(read('comunidad.js'), { document, fetch, Date, Intl, URL, window: {}, setInterval() {} });
  // Resolución del fetch + parse + render en microtareas.
  await new Promise(resolve => setImmediate(resolve));
  return list;
}

test('agenda descarta nulos, entradas malformadas y fechas pasadas sin romperse', async () => {
  const upcoming = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const list = await renderAgenda([
    null, {}, false, { fecha_utc: 'mañana', titulo: 'Invalido', descripcion: 'no' },
    { fecha_utc: past, titulo: 'Pasado', descripcion: 'No mostrar' },
    { fecha_utc: upcoming, titulo: 'Actividad confirmada', descripcion: 'Detalle de ejemplo' },
  ]);
  assert.equal(list.children.length, 1);
  const card = list.children[0];
  assert.equal(card.tagName, 'article');
  assert.equal(card.children[1].textContent, 'Actividad confirmada');
});

test('agenda comunica un error de red sin afirmar que no existen eventos', async () => {
  const list = await renderAgenda([], true);
  assert.equal(list.children.length, 1);
  assert.match(list.children[0].textContent, /No fue posible consultar/);
});
