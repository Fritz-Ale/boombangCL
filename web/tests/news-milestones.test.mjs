import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {newsMilestones,homeMilestones,normalizeMilestones} from '../scripts/build-milestones.mjs';
import {buildPublicSite} from '../scripts/build-public-site.mjs';

const load = async () => JSON.parse(await readFile('web/avance-data.json','utf8'));

test('all project updates are dated, curated and linked without changing the roadmap',async () => {
  const roadmap=await load();
  const updates=normalizeMilestones(roadmap);
  assert.equal(updates.length,7);
  assert.ok(updates.every(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date)));
  assert.equal(roadmap.phases.flatMap(p=>p.tasks).filter(t=>t.status==='implemented').length,11);
  assert.equal(roadmap.phases.flatMap(p=>p.tasks).filter(t=>t.status==='pending').length,9);
  assert.equal(updates[0].url,'galeria.html');
  assert.equal(updates[1].url,'buscar.html');
  assert.equal(updates[2].url,'index.html');
});

test('milestones escape untrusted text and reject external or scripting links', () => {
  const draft={updates:[{
    date:'2026-10-31',title:'<script>alert(1)</script>',
    description:'<img src=x onerror=alert(1)>',url:'javascript:alert(1)',kind:'site',
  }]};
  const html=newsMilestones(draft);
  assert.doesNotMatch(html,/<script|<img|javascript:/);
  assert.match(html,/&lt;script&gt;/);
  assert.match(html,/&lt;img/);
  assert.match(html,/href="avance.html"/);
  assert.match(html,/data-milestone-filter="site"/);
  assert.match(html,/data-milestone-filter="test"/);
  assert.throws(()=>normalizeMilestones({updates:[{date:'invalid',title:'x',description:'y'}]}),/Malformed/);
  assert.match(homeMilestones(draft),/noticias.html#hitos-reales/);
});

test('public news and homepage have working milestone HTML even without JavaScript',async () => {
  const dir=await mkdtemp(join(tmpdir(),'boombang-news-'));
  try{
    const built=await buildPublicSite(dir);
    assert.equal(built.pages.length,19);
    const news=await readFile(join(dir,'noticias.html'),'utf8');
    const home=await readFile(join(dir,'index.html'),'utf8');
    const css=await readFile(join(dir,'site-milestones.css'),'utf8');
    const js=await readFile(join(dir,'site-milestones.js'),'utf8');
    assert.match(news,/id="hitos-reales"/);
    assert.match(news,/data-milestone-filter="test"/);
    assert.equal((news.match(/class="milestone-card"/g)||[]).length,7);
    assert.match(news,/Galería pública de imágenes del proyecto/);
    assert.match(news,/No son noticias de BoomBang.tv/);
    assert.match(news,/site-milestones.js/);
    assert.match(home,/home-milestones-heading/);
    assert.equal((home.match(/<article><time datetime="/g)||[]).length,3);
    assert.match(home,/href="noticias.html#hitos-reales"/);
    assert.match(home,/site-milestones.css/);
    assert.match(css,/prefers-reduced-motion|milestone-card/);
    assert.match(js,/aria-pressed/);
    assert.doesNotMatch(js,/innerHTML|Authorization|GITHUB_TOKEN|api\.github\.com/);
  }finally{await rm(dir,{force:true,recursive:true});}
});
