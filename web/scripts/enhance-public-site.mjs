/**
 * Enriches the safe static Pages build with search, home progress, SEO and
 * accessible navigation. Never exports Laravel forms or secrets.
 */
import {readFile, writeFile, copyFile, readdir, access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeGalleryAssets,galleryItems} from './build-gallery.mjs';
import {newsMilestones,homeMilestones} from './build-milestones.mjs';
import {renderProfessionalHomepage} from './build-professional-home.mjs';

const web=resolve(fileURLToPath(new URL('../',import.meta.url)));
const base='https://fritz-ale.github.io/boombangCL/';
const pages=[
 ['index.html','Inicio','Presentación del mundo y estado público del proyecto','portada, isla, jugar'],
 ['comunidad.html','Comunidad','Áreas, salas y actividades del portal','amigos, salas, islas'],
 ['noticias.html','Noticias','Bitácora editorial de BoomBang CL','actualizaciones, desarrollo'],
 ['ayuda.html','Cómo jugar','Guía para preparar el juego HTML5 en desarrollo','mac, docker, instalar'],
 ['normas.html','Normas','Reglas de convivencia de la comunidad','respeto, moderación'],
 ['privacidad.html','Privacidad','Información inicial sobre protección de datos','datos, política'],
 ['avance.html','Avances','Seguimiento de tareas y pruebas de GitHub','progreso, estado, pruebas'],
 ['pendientes.html','Qué falta','Tareas necesarias para el lanzamiento','pendientes, servidores'],
 ['foro.html','Foro','Foro aún sin servidor público','respuestas, temas'],
 ['chat.html','Chat','Chat en preparación','mensajes, comunicación'],
 ['social.html','Amigos y clanes','Funciones sociales que requieren integración','amigos, clanes'],
 ['catalogo.html','Catálogo','Objetos del juego, sin compras web activas','objetos, inventario'],
 ['ranking.html','Rankings','Resultados de minijuegos aún no disponibles en producción','puntuaciones, minijuegos'],
 ['moderacion.html','Moderación','Panel protegido, no disponible en la web estática','reportes, seguridad'],
 ['cuenta.html','Mi cuenta','Registro y sesiones aún sin API pública','iniciar sesión, registro'],
 ['restablecer.html','Recuperar acceso','Correo de recuperación aún no disponible','contraseña, correo'],
 ['buscar.html','Buscar','Encuentra páginas y tareas de BoomBang CL','buscar, índice'],
 ['galeria.html','Galería','Capturas de islas, salas, personajes y minijuegos','capturas, imágenes, fotografías, mundo, personajes'],
];
const noIndex=new Set(['buscar.html','404.html','foro.html','chat.html','social.html','catalogo.html','ranking.html','moderacion.html','cuenta.html','restablecer.html']);
const safe=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');

export function addMetadata(filename,html) {
  // Avoid conflicting duplicate OpenGraph tags from the source homepage.
  html = html.replace(/<meta\s+property="og:(?:type|title|description|url|site_name)"[^>]*>/g,'');
  const row=pages.find(entry=>entry[0]===filename);
  const title=row?row[1]+' · BoomBang CL':'BoomBang CL';
  const description=row?row[2]:'Portal independiente BoomBang CL.';
  const url=base+(filename==='index.html'?'':filename);
  const metadata='<link rel="canonical" href="'+url+'">'+
    '<meta property="og:type" content="website">'+
    '<meta property="og:site_name" content="BoomBang CL">'+
    '<meta property="og:title" content="'+safe(title)+'">'+
    '<meta property="og:description" content="'+safe(description)+'">'+
    '<meta property="og:url" content="'+url+'">'+
    (noIndex.has(filename)?'<meta name="robots" content="noindex,follow">':'');
  if (!html.includes('</head>')) throw new Error('Missing head: '+filename);
  return html.replace('</head>','<link rel="stylesheet" href="site-search.css">'+metadata+'</head>');
}

export function addSearchNavigation(html) {
  const rx=/<nav\b[^>]*\bid="main-nav"[^>]*>[\s\S]*?<\/nav>/;
  if(!rx.test(html)) throw new Error('Missing primary site navigation');
  return html.replace(rx,nav=>nav.replace('</nav>','<a href="galeria.html">Galería</a><a href="buscar.html">Buscar</a></nav>'));
}

export function homepageProgress(tasks) {
  const done=tasks.filter(x=>x.status==='implemented').length;
  const pending=tasks.filter(x=>x.status==='pending').length;
  const ratio=Math.round(done/(done+pending)*100);
  return '<section class="site-status-band" aria-labelledby="home-project-status"><div class="container">'+
   '<div class="site-status-intro"><span class="eyebrow orange">EL PROYECTO HOY</span>'+
   '<h2 id="home-project-status">Construimos la isla paso a paso.</h2>'+
   '<p>La web se puede explorar. Para activar cuentas, funciones sociales y partidas en línea todavía necesitamos servidores y pruebas.</p>'+
   '<div class="site-status-links"><a class="button button-sun" href="avance.html">Ver todos los avances →</a>'+
   '<a class="button portal-button-alt" href="pendientes.html">Qué falta para jugar →</a>'+ 
   '<a class="button portal-button-alt" href="galeria.html">Ver capturas del juego →</a></div></div>'+
   '<div class="site-status-counter"><span>FUNCIONALIDADES DEL PANEL</span>'+
   '<strong>'+done+'<small>/'+(done+pending)+'</small></strong>'+
   '<div class="site-status-track" role="progressbar" aria-label="Porcentaje de tareas implementadas en código" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio+'">'+
   '<span style="width:'+ratio+'%"></span></div>'+
   '<p><strong>'+pending+' tareas pendientes.</strong> El '+ratio+'% mide solo esta lista, no el desarrollo total del videojuego.</p></div></div></section>';
}

function searchPage(nav) {
 const header='<header class="site-header"><div class="container header-inner">'+
  '<a class="brand" href="index.html" aria-label="BoomBang CL, inicio"><span class="brand-sun" aria-hidden="true">✳</span><span>boom<span class="brand-accent">bang</span><strong>CL</strong></span></a>'+
  '<button class="menu-button" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menú"><span></span><span></span><span></span></button>'+
  nav.replace('href="buscar.html"','href="buscar.html" aria-current="page"')+'</div></header>';
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="theme-color" content="#0c3444"><meta name="description" content="Buscar secciones y tareas del proyecto BoomBang CL.">'+
 '<title>Buscar · BoomBang CL</title><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="portal.css">'+
 '<link rel="stylesheet" href="site-preview.css"><script defer src="script.js"></script><script defer src="site-search.js"></script></head>'+
 '<body class="portal-page"><a class="skip-link" href="#principal">Saltar al contenido</a>'+
 '<div class="top-strip">✦ BoomBang CL · Tu guía de la isla</div>'+header+
 '<main id="principal"><section class="portal-banner portal-compact"><div class="container"><span class="eyebrow light">EXPLORA EL PORTAL</span>'+
 '<h1>Busca en <em>nuestra isla.</em></h1><p>Encuentra páginas y tareas de desarrollo sin iniciar sesión.</p></div></section>'+
 '<section class="portal-section container"><div class="site-search-panel">'+
 '<form data-search-form role="search"><label for="site-search-input">¿Qué quieres encontrar?</label><div class="site-search-controls">'+
 '<input id="site-search-input" name="q" type="search" maxlength="100" autocomplete="off" placeholder="Amigos, correo, minijuegos…" data-site-search>'+
 '<select aria-label="Tipo de resultado" data-search-category><option value="all">Todo</option><option value="page">Páginas</option><option value="task">Tareas</option></select>'+
 '<button class="button button-sun" type="submit">Buscar</button>'+
 '<button class="button portal-button-alt" type="button" data-clear-search hidden>Limpiar</button></div></form>'+
 '<p role="status" aria-live="polite" data-search-status>Cargando índice…</p>'+
 '<div class="site-search-results" data-search-results></div></div>'+
 '<p class="site-search-hint">Este buscador solo consulta información pública de BoomBang CL; no requiere contraseñas ni servicios externos.</p></section></main>'+
 '<footer class="site-footer"><div class="container"><p>© <span id="year">2026</span> BoomBang CL · Proyecto no oficial.</p>'+
 '<nav><a href="index.html">Inicio</a><a href="avance.html">Avances</a><a href="pendientes.html">Pendientes</a></nav></div></footer></body></html>';
}

function publicSearchIndex(roadmap){
 const tasks=roadmap.phases.flatMap(phase=>phase.tasks||[]);
 return {version:1,entries:[
   ...pages.filter(row=>row[0]!=='buscar.html').map(([url,title,description,tags])=>({kind:'page',url,title,description,tags})),
   ...tasks.map(task=>({kind:'task',url:task.status==='pending'?'pendientes.html':'avance.html',
      title:task.name,description:task.detail||'',tags:task.status==='pending'?'pendiente por hacer':'implementado en código'})),
 ]};
}

function sitemap() {
 const indexable=pages.filter(row=>!noIndex.has(row[0]));
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  indexable.map(([file])=>'<url><loc>'+base+(file==='index.html'?'':file)+'</loc></url>').join('\n')+
  '\n</urlset>\n';
}

export async function enhancePublicSite(directory,roadmap) {
 const output=resolve(directory);
 const tasks=roadmap.phases.flatMap(phase=>phase.tasks||[]);
 const existing=(await readdir(output)).filter(name=>name.endsWith('.html'));
 if(existing.length!==17) throw new Error('Expected 17 original public routes');
 const navPattern=/<nav\b[^>]*\bid="main-nav"[^>]*>[\s\S]*?<\/nav>/;
 const index=await readFile(join(output,'index.html'),'utf8');
 const nav=addSearchNavigation(index).match(navPattern)?.[0];
 if(!nav) throw new Error('Homepage navigation missing');

 for(const filename of existing){
   let html=await readFile(join(output,filename),'utf8');
   if(filename!=='404.html') html=addSearchNavigation(html);
   if(filename==='noticias.html'){
     const marker='<section id="publicaciones"';
     if(!html.includes(marker))throw new Error('News page editorial anchor missing');
     html=html.replace(marker,newsMilestones(roadmap)+'\n'+marker);
     html=html.replace('Contenido editorial de presentación; sin fechas de publicación ni noticias en vivo.',
       'Tarjetas ilustrativas del mundo y del cliente HTML5; no representan noticias en vivo.');
     html=html.replace('</head>','<link rel="stylesheet" href="site-milestones.css"><script defer src="site-milestones.js"></script></head>');
   }
   if(filename==='comunidad.html'){
     const promo='<section class="container portal-section" aria-label="Archivo visual">'+
       '<div class="portal-notice"><strong>¿Quieres ver los escenarios?</strong> Explora las '+
       '<a href="galeria.html">nueve capturas del juego y sus personajes</a>. '+
       'Son imágenes del proyecto, no partidas en vivo.</div></section>';
     if(!html.includes('</main>'))throw new Error('Community page main missing');
     html=html.replace('</main>',promo+'</main>');
   }
   if(filename==='index.html'){
     if(!html.includes('<section class="intro section-pad"')) throw new Error('Homepage progress anchor missing');
     html=html.replace('<section class="intro section-pad"',homepageProgress(tasks)+'<section class="intro section-pad"');
     const projectAnchor='<section class="project section-pad"';
     if(!html.includes(projectAnchor))throw new Error('Homepage latest-updates anchor missing');
     html=html.replace(projectAnchor,homeMilestones(roadmap)+projectAnchor);
     html=html.replace('</head>','<link rel="stylesheet" href="site-milestones.css"></head>');
     html=html.replace('El botón de juego abre la dirección local del cliente y requiere que los servicios estén configurados.',
       'La página para jugar explica qué servicios faltan. No hay servidor multijugador público activo.');
   }
   html=addMetadata(filename,html);
   await writeFile(join(output,filename),html);
 }

 await writeFile(join(output,'buscar.html'),addMetadata('buscar.html',searchPage(nav)));
 await writeGalleryAssets(output,nav);
 const galleryHtml=await readFile(join(output,'galeria.html'),'utf8');
 await writeFile(join(output,'galeria.html'),addMetadata('galeria.html',galleryHtml));
 await copyFile(join(web,'site-milestones.js'),join(output,'site-milestones.js'));
 await copyFile(join(web,'site-milestones.css'),join(output,'site-milestones.css'));
 await copyFile(join(web,'site-search.js'),join(output,'site-search.js'));
 await copyFile(join(web,'site-search.css'),join(output,'site-search.css'));
 await writeFile(join(output,'search-index.json'),JSON.stringify(publicSearchIndex(roadmap),null,2)+'\n');
 await writeFile(join(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+base+'sitemap.xml\n');
 await writeFile(join(output,'sitemap.xml'),sitemap());

 // Consistent visual direction across every static page. Replace the former
 // emoji-heavy marketing homepage only after route and screenshot generation.
 await copyFile(join(web,'site-professional.css'),join(output,'site-professional.css'));
 await copyFile(join(web,'site-game.css'),join(output,'site-game.css'));
 await copyFile(join(web,'site-image-center.css'),join(output,'site-image-center.css'));

 await copyFile(join(web,'site-game.js'),join(output,'site-game.js'));
 for(const filename of (await readdir(output)).filter(name=>name.endsWith('.html'))) {
   let html=filename==='index.html' ? addMetadata('index.html',await renderProfessionalHomepage(roadmap))
     : await readFile(join(output,filename),'utf8');
   if(filename!=='index.html'){
     html=html
       .replace(/(<div class="top-strip"[^>]*>)(?:<span[^>]*>✦<\/span>\s*|✦\s*)/,'$1')
       .replace(/Proyecto independiente · Portal conectado a la API si se ejecuta Laravel/g,'BOOMBANG CL · ARCHIVO Y DESARROLLO')
       .replace('Donde empiezan las <em>amistades.</em>','El mundo de <em>BoomBang HTML5.</em>')
       .replace('Descubre las salas, los rincones sociales y las funciones que queremos reunir en BoomBang CL.','Una mirada a los escenarios, sistemas sociales y recursos conservados del proyecto HTML5.')
       .replace('Noticias de <em>nuestra isla.</em>','Actualizaciones del <em>proyecto.</em>')
       .replace('Conoce los componentes del proyecto y los próximos pasos de este portal independiente.','Seguimiento de las mejoras y decisiones técnicas del proyecto BoomBang CL.')
       .replace('Así va nuestra <em>aventura.</em>','Estado del <em>desarrollo.</em>');
     if(['foro.html','chat.html','social.html','catalogo.html','ranking.html','moderacion.html','cuenta.html','restablecer.html'].includes(filename))
       html=html.replace(/(<h1>)[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'$1');
   }
   // Remove operating-system emoji glyphs from all visitor-facing pages.
   // Keep real labels, task counters and the original image assets intact.
   html=html.replace(/[\\p{Emoji_Presentation}\\uFE0F]/gu,'');
   html=html.replace(/(<div class="top-strip"[^>]*>)\\s*✦\\s*/g,'$1');
   if(!html.includes('href="site-professional.css"'))
     html=html.replace('</head>','<link rel="stylesheet" href="site-professional.css"></head>');
   if(!html.includes('href="site-game.css"'))
     html=html.replace('</head>','<link rel="stylesheet" href="site-game.css"></head>');
   // Load after all theme styles so image framing wins at every breakpoint.
   if(!html.includes('href="site-image-center.css"'))
     html=html.replace('</head>','<link rel="stylesheet" href="site-image-center.css"></head>');
   await writeFile(join(output,filename),html);
 }


 const files=new Set(await readdir(output));
 const allHtml=(await readdir(output)).filter(file=>file.endsWith('.html'));
 for(const filename of allHtml){
   const html=await readFile(join(output,filename),'utf8');
   for(const [,link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
     if(/^(?:https?:|data:|mailto:|#)/.test(link)) continue;
     const file=link.split(/[?#]/)[0];
     if(!file||file==='./')continue;
     if(file.startsWith('screenshots/')) await access(join(output,file));
     else if(!files.has(file))throw new Error('Broken link: '+filename+' -> '+file);
   }
   if(filename==='cuenta.html' && /<form\b/.test(html))throw new Error('Public account forms are forbidden');
 }
 return {pages:allHtml.length,searchEntries:publicSearchIndex(roadmap).entries.length,galleryPhotos:galleryItems.length};
}
