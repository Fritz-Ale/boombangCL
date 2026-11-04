import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const read = path => readFileSync(join(root, path), 'utf8');
const home = read('web/index.html');
const sources = [
  'portada.png',
  'sala-publica.png',
  'islas.png',
  'sala-privada.png',
  'golden-ring.png',
  'personalizacion.png',
  'catalogo.png',
  'lobby.png',
];

test('la portada solo utiliza capturas que existen en el repositorio', () => {
  const pictures = [...home.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
  assert.equal(pictures.length, sources.length);
  for (const picture of pictures) {
    assert.match(picture, /^screenshots\/[a-z0-9-]+\.png$/);
    assert.ok(existsSync(join(root, 'doc', picture)), 'imagen no encontrada: ' + picture);
  }
  assert.deepEqual(pictures.map(p => p.replace('screenshots/', '')), sources);
});

test('la portada no simula servidores ni usa elementos visuales de reemplazo', () => {
  assert.match(home, /servidor multijugador aún no tiene acceso público verificado/);
  assert.doesNotMatch(home, /localhost:5173|http:\/\/play\.boombang\.com/);
  assert.doesNotMatch(home, /<svg\b|<canvas\b|<form\b/);
  assert.doesNotMatch(home, /[\p{Emoji_Presentation}\uFE0F]/gu);
  assert.doesNotMatch(home, /https?:\/\/[^"\s]+\.(?:png|jpg|jpeg|svg|webp)/i);
});

test('el portal Docker y la compilacion estatica incorporan el CSS del archivo', () => {
  assert.match(home, /href="archive-home\.css"/);
  assert.match(read('web/Dockerfile'), /web\/archive-home\.css/);
  assert.match(read('web/scripts/build-public-site.mjs'), /'archive-home\.css'/);
  assert.match(read('web/archive-home.css'), /object-fit:contain/);
});

test('los enlaces locales de la portada tienen archivos de destino', () => {
  const urls = [...home.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  for (const link of urls) {
    if (link.startsWith('https://') || link.startsWith('#')) continue;
    const path = link.split('#')[0];
    assert.ok(existsSync(join(root, 'web', path)), 'enlace inexistente: ' + link);
  }
});

test('la portada adopta jerarquia auditada sin inventar datos de BoomBang.tv', () => {
  for (const label of ['Inicio','Comunidad','Foro','Acerca de','Noticias','Acceso','Registrarte']) {
    assert.match(home, new RegExp('>'+label+'<'));
  }
  for (const heading of ['Tu isla','Chat','Acciones','Minijuegos','Comunidad, salas y actividad']) {
    assert.ok(home.includes('>'+heading+'</h'), 'falta apartado: '+heading);
  }
  assert.ok(home.includes('Dónde está la gente'));
  assert.ok(home.includes('Últimos en unirse'));
  assert.match(home, /no publicamos cifras ni usuarios de BoomBang\.tv/);
  assert.doesNotMatch(home, /api\.boombang\.tv\/api\/avatar/);
  assert.doesNotMatch(home, /static\.boombang\.tv\/web\/assets/);
});
