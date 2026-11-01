import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const web = join(repo, 'web');
const read = path => readFileSync(join(repo, path), 'utf8');
const pages = ['index.html', 'comunidad.html', 'noticias.html', 'ayuda.html', 'cuenta.html', 'foro.html', 'chat.html', 'catalogo.html', 'ranking.html', 'social.html', 'moderacion.html', 'normas.html', 'privacidad.html', 'restablecer.html', 'avance.html'];
const assets = ['styles.css', 'portal.css', 'live.css', 'script.js', 'portal.js', 'portal-app.js', 'social-app.js', 'moderacion.js', 'password-reset.js', 'avance.js', 'avance.css', 'avance-data.json'];

test('all portal pages, scripts and styles are included in Docker image', () => {
  const docker = read('web/Dockerfile');
  for (const file of [...pages, ...assets]) {
    assert.ok(existsSync(join(web, file)), file + ' exists');
    assert.ok(docker.includes('web/' + file), file + ' is copied to Docker image');
  }
});

test('local HTML links point to pages that exist', () => {
  for (const file of pages) {
    const html = read('web/' + file);
    assert.ok(html.includes('<main'), file + ' has main content');
    assert.ok(html.includes('</main>'), file + ' closes main');
    for (const [, link] of html.matchAll(/href="([^"]+\.html)(?:#[^"]*)?"/g)) {
      assert.ok(existsSync(join(web, link)), file + ': ' + link);
    }
    for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+\.(?:css|js))"/g)) {
      assert.ok(existsSync(join(web, asset)), file + ': ' + asset);
    }
  }
});

test('references to screenshots are shipped from the existing repo', () => {
  for (const file of pages) {
    const html = read('web/' + file);
    for (const [, image] of html.matchAll(/src="screenshots\/([^"]+\.png)"/g)) {
      assert.ok(existsSync(join(repo, 'doc/screenshots', image)), file + ': ' + image);
    }
  }
});

test('client never embeds emulator API token or a payment endpoint', () => {
  for (const file of assets.filter(x => x.endsWith('.js'))) {
    const source = read('web/' + file);
    assert.ok(!source.includes('EMULATOR_API_TOKEN'), file);
    assert.ok(!source.includes('/shop/purchase'), file);
    assert.ok(!source.includes('/stripe/create-checkout-session'), file);
  }
});

test('community auth is isolated behind Laravel sessions and CSRF', () => {
  const routes = read('api/routes/web.php');
  assert.ok(routes.includes("Route::prefix('portal')"));
  assert.ok(routes.includes("['auth:web']"));
  const auth = read('api/app/Http/Controllers/Portal/PortalAuthController.php');
  assert.ok(auth.includes("session()->regenerate()"));
  assert.ok(auth.includes("session()->invalidate()"));
  const proxy = read('web/nginx.conf');
  assert.ok(proxy.includes('location ^~ /portal/'));
  assert.ok(proxy.includes('proxy_pass http://$portal_backend;'));
});

test('progress dashboard tracks reviewed tasks without claiming production deployment', () => {
  const data = JSON.parse(read('web/avance-data.json'));
  assert.equal(data.version, 1);
  assert.equal(data.pr.status, 'draft');
  assert.equal(data.issue.number, 2);
  const tasks = data.phases.flatMap(phase => phase.tasks);
  assert.ok(tasks.length >= 12, 'roadmap must contain meaningful tasks');
  assert.ok(tasks.some(task => task.status === 'pending'), 'unfinished work remains explicit');
  assert.ok(tasks.some(task => task.status === 'implemented'));
  assert.ok(tasks.every(task => ['implemented', 'pending', 'testing'].includes(task.status)));
  assert.match(read('web/avance.html'), /GitHub Actions|Pruebas automáticas/);
  assert.match(read('web/avance.js'), /textContent/);
  assert.doesNotMatch(read('web/avance.js'), /GITHUB_TOKEN|PRIVATE_TOKEN|access_token/);
});

test('GitHub Pages status is optional and never requires client-side repository credentials', () => {
  const script = read('web/avance.js');
  const generator = read('web/scripts/generate-progress-status.mjs');
  assert.match(script, /avance-github\.json/);
  assert.ok(!script.includes('Authorization:'));
  assert.ok(!script.includes('api.github.com'));
  assert.match(generator, /GITHUB_REPOSITORY/);
  assert.match(generator, /PROGRESS_GITHUB_TOKEN/);
});
