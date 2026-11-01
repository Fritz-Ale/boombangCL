/**
 * Static media gallery for the public site. All images are existing project
 * screenshots already reviewed for the public preview. Never suggest these
 * screenshots represent live users, sessions or deployed gameplay.
 */
import { readFile,writeFile,copyFile,access } from 'node:fs/promises';
import { resolve,join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web=resolve(fileURLToPath(new URL('../',import.meta.url)));

export const galleryItems = [
  {file:'portada.png',title:'Portada del juego',category:'mundo',description:'Imagen de presentación del cliente BoomBang HTML5.',alt:'Captura de la portada del cliente HTML5'},
  {file:'lobby.png',title:'Lobby',category:'mundo',description:'Vista del vestíbulo del proyecto original.',alt:'Captura del vestíbulo del juego'},
  {file:'sala-publica.png',title:'Sala pública',category:'mundo',description:'Escenario de una sala pública del cliente.',alt:'Captura de una sala pública'},
  {file:'sala-privada.png',title:'Sala privada',category:'mundo',description:'Ejemplo de una sala privada del cliente.',alt:'Captura de una sala privada'},
  {file:'islas.png',title:'Islas y construcción',category:'mundo',description:'Diseño de islas incluido en el código base.',alt:'Captura de las islas del juego'},
  {file:'personalizacion.png',title:'Personalización de personajes',category:'personajes',description:'Ejemplo del aspecto de los avatares del proyecto.',alt:'Captura de la personalización de personajes'},
  {file:'golden-ring.png',title:'Golden Ring',category:'minijuegos',description:'Captura del minijuego Golden Ring del código original.',alt:'Captura de la arena del minijuego Golden Ring'},
  {file:'ranking.png',title:'Clasificaciones',category:'minijuegos',description:'Ejemplo visual de clasificaciones; no contiene resultados en vivo.',alt:'Captura de una pantalla de clasificación del juego'},
  {file:'catalogo.png',title:'Catálogo de objetos',category:'personajes',description:'Vista ilustrativa de objetos del proyecto. No es una tienda activa.',alt:'Captura de un catálogo de objetos'},
];

const escapeHTML=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
export function galleryPage(nav) {
  const categories=[
    ['all','Todas las capturas'],
    ['mundo','Mundo e islas'],
    ['personajes','Personajes y objetos'],
    ['minijuegos','Minijuegos'],
  ];
  const filters=categories.map(([id,label],i)=>
    '<button type="button" data-gallery-filter="'+id+'" aria-pressed="'+(i===0?'true':'false')+'"'+
    (i===0?' class="is-active"':'')+'>'+label+'</button>').join('');
  const cards=galleryItems.map(item=>{
    const src='screenshots/'+escapeHTML(item.file);
    return '<figure class="gallery-card" data-gallery-category="'+escapeHTML(item.category)+'">'+
      '<a href="'+src+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir imagen completa: '+escapeHTML(item.title)+'">'+
      '<img src="'+src+'" loading="lazy" decoding="async" width="960" height="600" alt="'+escapeHTML(item.alt)+'">'+
      '<span class="gallery-open">Ver captura completa ↗</span></a>'+
      '<figcaption><h2>'+escapeHTML(item.title)+'</h2><p>'+escapeHTML(item.description)+'</p></figcaption></figure>';
  }).join('');

  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="theme-color" content="#0c3444"><title>Galería · BoomBang CL</title>'+
    '<meta name="description" content="Capturas de las islas, salas, personajes y minijuegos incluidos en BoomBang HTML5.">'+
    '<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="portal.css">'+
    '<link rel="stylesheet" href="site-preview.css"><script defer src="script.js"></script>'+
    '<script defer src="site-gallery.js"></script></head><body class="portal-page">'+
    '<a class="skip-link" href="#principal">Saltar al contenido</a>'+
    '<div class="top-strip">✦ BoomBang CL · Recuerdos del proyecto HTML5</div>'+
    '<header class="site-header"><div class="container header-inner">'+
    '<a class="brand" href="index.html" aria-label="BoomBang CL, inicio"><span class="brand-sun" aria-hidden="true">✳</span>'+
    '<span>boom<span class="brand-accent">bang</span><strong>CL</strong></span></a>'+
    '<button class="menu-button" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menú">'+
    '<span></span><span></span><span></span></button>'+nav.replace('href="galeria.html"','href="galeria.html" aria-current="page"')+
    '</div></header><main id="principal">'+
    '<section class="portal-banner portal-compact"><div class="container"><span class="eyebrow light">ARCHIVO VISUAL</span>'+
    '<h1>Postales de <em>nuestra isla.</em></h1><p>Explora capturas del cliente BoomBang HTML5 incluido en el proyecto.</p></div></section>'+
    '<section class="portal-section container"><div class="portal-notice" role="note">'+
    '<strong>Imágenes de referencia, no del servidor en vivo.</strong> Estas capturas son parte del código base y no demuestran que las salas, jugadores, compras o minijuegos estén disponibles en esta web pública.</div>'+
    '<div class="gallery-heading"><div><span class="eyebrow orange">CAPTURAS DEL REPOSITORIO</span>'+
    '<h2>Conoce el mundo.</h2><p>Selecciona una categoría y abre la captura original para verla más grande.</p></div>'+
    '<a class="button portal-button-alt" href="avance.html">Ver el estado real del desarrollo →</a></div>'+
    '<div class="gallery-filters" role="group" aria-label="Filtrar capturas">'+filters+'</div>'+
    '<p class="gallery-count" data-gallery-count role="status" aria-live="polite">9 capturas</p>'+
    '<div class="gallery-grid">'+cards+'</div>'+
    '<p class="gallery-disclaimer">BoomBang CL es un proyecto independiente sin afiliación oficial. La publicación de estas imágenes no implica que el juego esté desplegado ni disponible para jugar.</p>'+
    '<div class="preview-links"><a class="button button-sun" href="comunidad.html">Explorar la comunidad</a>'+
    '<a class="button portal-button-alt" href="pendientes.html">Qué falta para lanzar</a></div></section></main>'+
    '<footer class="site-footer"><div class="container"><p>© <span id="year">2026</span> BoomBang CL · Proyecto no oficial.</p>'+
    '<nav><a href="index.html">Inicio</a><a href="avance.html">Avances</a><a href="normas.html">Normas</a>'+
    '<a href="privacidad.html">Privacidad</a></nav></div></footer></body></html>';
}

export async function writeGalleryAssets(destination,nav) {
  for(const item of galleryItems) await access(join(destination,'screenshots',item.file));
  await writeFile(join(destination,'galeria.html'),galleryPage(nav));
  for(const file of ['site-gallery.css','site-gallery.js']){
    await copyFile(join(web,file),join(destination,file));
  }
  return galleryItems.length;
}
