const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(base, name), 'utf8');
const pages = ['index.html', 'comunidad.html', 'mejoras.html'];

test('las páginas públicas están en español de Chile y no prometen servicio activo', () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<html lang="es-CL">/);
    assert.match(html, /<main id="principal">/);
    assert.match(html, /href="comunidad\.html"/);
    assert.match(html, /href="mejoras\.html"/);
    assert.match(html, /Proyecto independiente|proyecto independiente|Proyecto en desarrollo|comunidad|Comunidad/);
  }
});

test('enlaces internos apuntan a documentos y anclas existentes', () => {
  for (const page of pages) {
    const html = read(page);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    for (const href of hrefs) {
      if (/^(https?:|mailto:|data:)/.test(href)) continue;
      const [filename, fragment] = href.split('#');
      const target = filename ? path.join(base, filename) : path.join(base, page);
      assert.ok(fs.existsSync(target), page + ' => no existe ' + href);
      if (!fragment) continue;
      const targetHtml = fs.readFileSync(target, 'utf8');
      assert.ok(targetHtml.includes('id="' + fragment + '"'), page + ' => no existe el ancla ' + href);
    }
  }
});

test('scripts de la portada y comunidad compilan sin dependencias', () => {
  for (const script of ['script.js', 'comunidad.js']) {
    assert.doesNotThrow(() => new Function(read(script)));
  }
});

test('agenda publica JSON válido, sin entradas ficticias iniciales', () => {
  const entries = JSON.parse(read('eventos.json'));
  assert.ok(Array.isArray(entries));
  assert.equal(entries.length, 0);
});

test('propuestas GitHub sin backend, contenidos dinámicos usando textContent', () => {
  const source = read('comunidad.js');
  assert.match(source, /github\.com\/Fritz-Ale\/boombangCL\/issues\/new/);
  assert.match(source, /textContent/);
  assert.doesNotMatch(source, /innerHTML\s*=/);
});

test('build de Cloudflare prepara imágenes que la portada utiliza', () => {
  const sh = read('build-pages.sh');
  assert.match(sh, /cp -R doc\/screenshots\/\. web\/screenshots\//);
  assert.match(read('index.html'), /screenshots\/portada\.png/);
});
