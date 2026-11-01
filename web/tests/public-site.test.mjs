import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPublicSite, pendingPages, navbar, transformReadonlyPage } from '../scripts/build-public-site.mjs';

test('public GitHub Pages navigation stays in the website and not the GitHub repository', () => {
  const html = navbar('index.html');
  for (const page of ['index.html','comunidad.html','noticias.html','avance.html','cuenta.html']) {
    assert.match(html, new RegExp('href="' + page.replace('.','\\.') + '"'));
  }
  assert.ok(!html.includes('href="https://github.com'));
});

test('public preview has a complete homepage, progress page and all 17 routable pages', async () => {
  const dir = await mkdtemp(join(tmpdir(),'boombangcl-public-'));
  try {
    const result = await buildPublicSite(dir);
    assert.equal(result.pages.length,19);
    assert.equal(result.tasks,20);
    for (const page of result.pages) {
      assert.ok((await readFile(join(dir,page),'utf8')).includes('<main'), 'main in '+page);
    }
    const homepage = await readFile(join(dir,'index.html'),'utf8');
    const dashboard = await readFile(join(dir,'avance.html'),'utf8');
    const proCss = await readFile(join(dir,'site-professional.css'),'utf8');
    const homeTitle = await readFile(join(dir,'index.html'),'utf8');
    assert.match(proCss, /\.pro-hero-grid/);
    assert.match(proCss, /prefers-reduced-motion/);
    assert.match(homeTitle, /href="site-professional.css"/);
    assert.match(homeTitle, /href="site-game.css"/);
    assert.match(homeTitle, /src="site-game.js"/);
    assert.match(homeTitle, /data-game-explorer/);
    assert.equal((homeTitle.match(/data-game-scene="/g)||[]).length, 3);
    const gameCss = await readFile(join(dir,'site-game.css'),'utf8');
    const gameJs = await readFile(join(dir,'site-game.js'),'utf8');
    const imageCss = await readFile(join(dir,'site-image-center.css'),'utf8');
    assert.match(homepage, /href="site-image-center.css"/);
    assert.match(imageCss, /object-fit:contain!important/);
    assert.match(imageCss, /object-position:50% 50%!important/);
    assert.match(imageCss, /\.game-explorer-image img/);
    assert.match(imageCss, /\.gallery-card img/);
    assert.match(imageCss, /@media \(max-width:560px\)/);
    for (const page of result.pages) {
      const html = await readFile(join(dir,page),'utf8');
      const themeIndex = html.indexOf('href="site-game.css"');
      const centeringIndex = html.indexOf('href="site-image-center.css"');
      assert.ok(themeIndex >= 0 && centeringIndex > themeIndex, 'image centering CSS must load last: '+page);
    }
    assert.match(gameCss, /\.game-hero/);
    assert.match(gameCss, /\.game-explorer/);
    assert.match(gameCss, /prefers-reduced-motion/);
    assert.match(gameJs, /aria-pressed/);
    assert.doesNotMatch(gameJs, /Authorization|GITHUB_TOKEN|innerHTML|api\.github\.com/);
    assert.doesNotMatch(homeTitle, /🥳|🌴|Tu isla\.|¡Vamos a jugar!|¡Hey, hola!/);
    assert.match(homeTitle, /El servidor multijugador todavía no está disponible/);
    const searchPage = await readFile(join(dir,'buscar.html'),'utf8');
    const galleryPage = await readFile(join(dir,'galeria.html'),'utf8');
    const galleryJs = await readFile(join(dir,'site-gallery.js'),'utf8');
    const searchData = JSON.parse(await readFile(join(dir,'search-index.json'),'utf8'));
    const robots = await readFile(join(dir,'robots.txt'),'utf8');
    const sitemap = await readFile(join(dir,'sitemap.xml'),'utf8');
    const account = await readFile(join(dir,'cuenta.html'),'utf8');
    const news = await readFile(join(dir,'noticias.html'),'utf8');
    const blockers = await readFile(join(dir,'pendientes.html'),'utf8');
    assert.match(homepage, /Las islas te/);
    assert.match(homepage, /href="index.html"/);
    assert.match(homepage, /href="comunidad.html"/);
    assert.match(homepage, /href="buscar.html"/);
    assert.match(homepage, /href="galeria.html"/);
    assert.match(homepage, /Descubre el mundo/);
    assert.match(galleryPage, /ARCHIVO VISUAL/);
    assert.match(galleryPage, /site-gallery.css/);
    assert.match(galleryPage, /data-gallery-filter="all"/);
    assert.match(galleryPage, /captura completa/);
    assert.equal((galleryPage.match(/class="gallery-card"/g) || []).length,9);
    assert.match(galleryPage, /Imágenes de referencia, no del servidor en vivo/);
    assert.doesNotMatch(galleryJs, /innerHTML|Authorization|api\.github\.com/);
    assert.match(homepage, /id="progress-title"/);
    assert.match(homepage, /href="#explorador"/);
    assert.doesNotMatch(homepage, /Jugar ahora|Jugadores conectados|Jugando en vivo/);
    assert.match(homepage, /class="game-progress-number"><strong>11<\/strong><span>\/ 20<\/span>/);
    assert.match(homepage, /rel="canonical"/);
    assert.match(homepage, /og:description/);
    assert.match(searchPage, /data-site-search/);
    assert.match(searchPage, /data-search-results/);
    assert.equal(searchData.version,1);
    assert.equal(searchData.entries.filter(entry => entry.kind === 'task').length,20);
    assert.ok(searchData.entries.some(entry => entry.url === 'galeria.html'));
    assert.match(sitemap, /galeria\.html/);
    assert.ok(searchData.entries.some(entry => entry.title.includes('Amistades y clanes')));
    assert.match(robots, /Sitemap:/);
    assert.match(sitemap, /<loc>https:\/\/fritz-ale\.github\.io\/boombangCL\/<\/loc>/);
    assert.doesNotMatch(sitemap, /cuenta\.html|restablecer\.html|buscar\.html/);
    assert.doesNotMatch(homepage, /href="http:\/\/play\.boombang\.com"/);
    assert.doesNotMatch(homepage, /portal-app\.js/);
    assert.match(dashboard, /href="index.html"/);
    assert.match(dashboard, /pendientes\.html/);
    assert.doesNotMatch(account, /<form\b/);
    assert.match(account, /no/i);
    assert.doesNotMatch(news, /data-news-form/);
    assert.match(blockers, /Las nueve tareas/);
    assert.ok((await readdir(join(dir,'screenshots'))).length >= 9);
    assert.ok((await readdir(dir)).includes('.nojekyll'));
  } finally {
    await rm(dir,{force:true,recursive:true});
  }
});

test('all unavailable pages present honest backend status instead of public data collection', async () => {
  const dir = await mkdtemp(join(tmpdir(),'boombangcl-safe-'));
  try {
    await buildPublicSite(dir);
    for (const [file] of pendingPages) {
      const html = await readFile(join(dir,file),'utf8');
      assert.doesNotMatch(html, /<form\b|type="password"|portal-app\.js/);
      assert.match(html, /href="index\.html"/);
      assert.match(html, /href="pendientes\.html"/);
    }
  } finally {
    await rm(dir,{force:true,recursive:true});
  }
});

test('public deployment workflow uses multipage builder while publication requires opt-in', async () => {
  const yaml = await readFile('.github/workflows/pages-avances.yml','utf8');
  assert.match(yaml,/build-public-site\.mjs _site/);
  assert.match(yaml,/ENABLE_PROGRESS_PAGES == 'true'/);
  assert.doesNotMatch(yaml,/run: node web\/scripts\/build-progress-bundle\.mjs _site pages/);
});

test('search and metadata never contain secrets or operational account forms', async () => {
  const dir = await mkdtemp(join(tmpdir(),'boombangcl-search-'));
  try {
    await buildPublicSite(dir);
    const script = await readFile(join(dir,'site-search.js'),'utf8');
    const body = await readFile(join(dir,'buscar.html'),'utf8');
    const account = await readFile(join(dir,'cuenta.html'),'utf8');
    const index = JSON.parse(await readFile(join(dir,'search-index.json'),'utf8'));
    assert.doesNotMatch(script,/Authorization:|GITHUB_TOKEN|api\.github\.com|innerHTML/);
    assert.doesNotMatch(body,/<form[^>]*data-register|type="password"/);
    assert.match(account,/name="robots" content="noindex,follow"/);
    assert.ok(index.entries.every(item=>!item.url.startsWith('https:')));
    assert.ok(index.entries.every(item=>['page','task'].includes(item.kind)));
  } finally { await rm(dir,{recursive:true,force:true}); }
});
