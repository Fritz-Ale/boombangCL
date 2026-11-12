import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const source = dirname(fileURLToPath(import.meta.url));
const dist = join(source, 'dist');
mkdirSync(dist, { recursive: true });

for (const name of ['index.html', 'styles.css', 'script.js']) {
  const encoded = readFileSync(join(source, name + '.gz.b64'), 'utf8').trim();
  const bytes = gunzipSync(Buffer.from(encoded, 'base64'));
  if (name === 'index.html') {
    const html = bytes.toString('utf8');
    const anchor = '<a href="#foro">Foro</a>';
    if (!html.includes(anchor)) throw new Error('Expected original menu anchor not found; refusing an unexpected HTML rewrite.');
    writeFileSync(join(dist, name), html.replace(anchor, '<a href="explorar.html">Kekos y catálogo</a>'));
  } else writeFileSync(join(dist, name), bytes);
  console.log('Built', name, bytes.length, 'bytes');
}
const screenshotSource = join(source, '..', '..', 'doc', 'screenshots');
const screenshotDist = join(dist, 'screenshots');
mkdirSync(screenshotDist, { recursive: true });
for (const name of ['personalizacion.png', 'catalogo.png', 'inventario.png']) {
  const from = join(screenshotSource, name);
  if (!existsSync(from)) throw new Error('Missing original repository screenshot: ' + from);
  copyFileSync(from, join(screenshotDist, name));
  console.log('Copied repository screenshot', name);
}

for (const name of ['explorar.html', 'explorar.css', 'explorar.js']) {
  copyFileSync(join(source, name), join(dist, name));
  console.log('Copied', name);
}
writeFileSync(join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
