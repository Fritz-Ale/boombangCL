import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const source = dirname(fileURLToPath(import.meta.url));
const dist = join(source, 'dist');
mkdirSync(dist, { recursive: true });

for (const name of ['index.html', 'styles.css', 'script.js']) {
  const encoded = readFileSync(join(source, name + '.gz.b64'), 'utf8').trim();
  const bytes = gunzipSync(Buffer.from(encoded, 'base64'));
  writeFileSync(join(dist, name), bytes);
  console.log('Built', name, bytes.length, 'bytes');
}

writeFileSync(join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
