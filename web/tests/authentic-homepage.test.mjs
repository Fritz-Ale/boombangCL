import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFileSync(join(root, file), 'utf8');

test('portada utiliza capturas existentes del proyecto y no ilustraciones inventadas', () => {
  const html = read('web/index.html');
  const shots = [...html.matchAll(/src="screenshots\/([^"]+\.png)"/g)].map(m => m[1]);
  assert.ok(shots.length >= 8, 'Se muestran capturas de las salas, kekos y objetos');
  for (const image of shots) assert.ok(existsSync(join(root, 'doc/screenshots', image)), image);
  assert.doesNotMatch(html, /[\p{Emoji_Presentation}\uFE0F]/gu);
  assert.doesNotMatch(html, /art-sticker|floating-spark|feature-icon|hero-orb/);
  assert.match(html, /El servidor multijugador aún no cuenta con una dirección pública verificada/);
  assert.doesNotMatch(html, /Jugar ahora|Jugadores conectados|Jugando en vivo/);
});

test('estilo de portada se distribuye en Docker y compilador del sitio estático', () => {
  assert.match(read('web/Dockerfile'), /web\/heritage\.css/);
  const builder = read('web/scripts/build-public-site.mjs');
  assert.match(builder, /'heritage\.css'/);
  assert.match(builder, /'inventario\.png'/);
  assert.match(read('web/scripts/enhance-public-site.mjs'), /archive-intro/);
  assert.doesNotMatch(read('web/scripts/enhance-public-site.mjs'), /renderProfessionalHomepage\(/);
});
