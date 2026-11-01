import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildBundle, relocateNavigation } from '../scripts/build-progress-bundle.mjs';

async function withTempFolder(fn) {
  const target = await mkdtemp(join(tmpdir(), 'boombangcl-preview-'));
  try {
    return await fn(target);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
}

test('single-file preview works with local file:// without additional assets or authentication', async () => {
  await withTempFolder(async folder => {
    const result = await buildBundle(folder, 'standalone');
    assert.equal(result.mode, 'standalone');
    assert.equal(result.taskCount, 20);

    const files = (await readdir(folder)).sort();
    assert.deepEqual(files, ['LEEME.txt', 'index.html']);

    const html = await readFile(join(folder, 'index.html'), 'utf8');
    assert.match(html, /id="avance-embedded"/);
    assert.match(html, /Vista previa descargable/);
    assert.match(html, /data-gh-pr/);
    assert.equal((html.match(/<style>/g) || []).length, 3);
    assert.doesNotMatch(html, /<script defer src=/);
    assert.doesNotMatch(html, /<link rel="stylesheet" href="/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com/);
    assert.doesNotMatch(html, /href="(?:index|cuenta|comunidad|privacidad)\.html"/);

    const embedded = html.match(/<script type="application\/json" id="avance-embedded">([^<]*)<\/script>/);
    assert.ok(embedded, 'must embed JSON for offline use');
    const roadmap = JSON.parse(embedded[1]);
    assert.equal(roadmap.phases.flatMap(phase => phase.tasks).length, 20);
    assert.equal(roadmap.phases.flatMap(phase => phase.tasks).filter(task => task.status === 'implemented').length, 11);
    assert.ok(html.includes("document.getElementById('avance-embedded')"));
    for (const unsafe of ['EMULATOR_API_TOKEN', 'PROGRESS_GITHUB_TOKEN', 'api/.env']) {
      assert.ok(!html.includes(unsafe), 'never ship ' + unsafe);
    }
  });
});

test('GitHub Pages export includes only whitelisted progress assets', async () => {
  await withTempFolder(async folder => {
    const result = await buildBundle(folder, 'pages');
    assert.equal(result.mode, 'pages');
    const files = (await readdir(folder)).sort();
    assert.deepEqual(files, [
      '.nojekyll', 'avance-data.json', 'avance.css',
      'avance.js', 'index.html', 'portal.css', 'script.js', 'styles.css',
    ].sort());
    const html = await readFile(join(folder, 'index.html'), 'utf8');
    assert.match(html, /href="avance.css"/);
    assert.match(html, /src="avance.js"/);
    assert.doesNotMatch(html, /href="cuenta.html"/);
  });
});

test('isolated navigation routes unavailable private portal pages to repository', () => {
  const result = relocateNavigation('<a href="cuenta.html">Cuenta</a><a href="avance.html">Avance</a>');
  assert.match(result, /https:\/\/github\.com\/Fritz-Ale\/boombangCL/);
  assert.match(result, /href="\.\/"/);
});

test('unsupported modes cannot accidentally export whole repository', async () => {
  await withTempFolder(async folder => {
    await assert.rejects(() => buildBundle(folder, 'full-website'), /Unsupported bundle mode/);
    assert.deepEqual(await readdir(folder), []);
  });
});
