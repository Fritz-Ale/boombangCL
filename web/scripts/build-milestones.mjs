/**
 * Build editorial milestone cards from the versioned progress record, never
 * by scraping news, inventing server status or loading secret GitHub tokens.
 */
export const milestoneKinds = Object.freeze({
  site:'Sitio web',
  code:'Código',
  test:'Pruebas',
});

const escapeText = value => String(value ?? '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function validTarget(value) {
  if (typeof value !== 'string') return 'avance.html';
  if (/^(?:index|avance|galeria|buscar|comunidad|noticias|ayuda|pendientes)\.html(?:#[a-z0-9-]+)?$/.test(value)) return value;
  if (/^https:\/\/github\.com\/Fritz-Ale\/boombangCL\/(?:actions\/runs\/[0-9]+|pull\/[0-9]+|issues\/[0-9]+)$/.test(value)) return value;
  return 'avance.html';
}

export function normalizeMilestones(roadmap) {
  if (!roadmap || !Array.isArray(roadmap.updates)) throw new Error('Missing milestone records');
  return roadmap.updates.map((update,i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(update.date||'') ||
        !Number.isFinite(Date.parse(update.date+'T12:00:00Z')) ||
        typeof update.title !== 'string' ||
        typeof update.description !== 'string') {
      throw new Error('Malformed milestone at index '+i);
    }
    return {
      date:update.date,
      title:update.title,
      description:update.description,
      kind:milestoneKinds[update.kind]?update.kind:'code',
      url:validTarget(update.url),
      _order:i,
    };
  }).sort((a,b)=>b.date.localeCompare(a.date)||a._order-b._order);
}

function card(item) {
  const datetime=escapeText(item.date);
  const day=new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
    .format(new Date(item.date+'T12:00:00Z'));
  return '<article class="milestone-card" data-milestone-kind="'+item.kind+'">'+
    '<div class="milestone-meta"><time datetime="'+datetime+'">'+escapeText(day)+'</time>'+
    '<span>'+milestoneKinds[item.kind]+'</span></div>'+
    '<h3>'+escapeText(item.title)+'</h3><p>'+escapeText(item.description)+'</p>'+
    '<a href="'+escapeText(item.url)+'"'+(item.url.startsWith('https://')?' target="_blank" rel="noopener noreferrer"':'')+
    '>Ver más →</a></article>';
}

export function newsMilestones(roadmap) {
  const items=normalizeMilestones(roadmap);
  if (!items.length) throw new Error('Cannot generate an empty project log');
  const buttons=[
    ['all','Todos'],
    ['site','Sitio web'],
    ['code','Código'],
    ['test','Pruebas'],
  ].map(([id,text],i)=>'<button type="button" data-milestone-filter="'+id+'" aria-pressed="'+(i===0?'true':'false')+'"'+
    (i===0?' class="is-active"':'')+'>'+text+'</button>').join('');
  return '<section class="portal-section container milestone-section" id="hitos-reales" aria-labelledby="hitos-title">'+
    '<div class="milestone-heading"><div><span class="eyebrow orange">HISTORIAL DEL DESARROLLO</span>'+
    '<h2 id="hitos-title">Lo que sí hemos construido.</h2>'+
    '<p>Hitos documentados en el repositorio, distintos de las imágenes y tarjetas ilustrativas del juego. No son noticias de BoomBang.tv ni eventos de un servidor online.</p>'+
    '</div><a class="button portal-button-alt" href="avance.html">Ver las 20 tareas →</a></div>'+
    '<div class="milestone-filters" role="group" aria-label="Filtrar hitos">'+buttons+'</div>'+
    '<p class="milestone-count" role="status" aria-live="polite" data-milestone-count>'+
    items.length+' hitos documentados</p>'+
    '<div class="milestone-grid">'+items.map(card).join('')+'</div>'+
    '<p class="milestone-caveat"><strong>Transparencia:</strong> las fechas corresponden al registro de avances del proyecto. Revisa las pruebas y los commits en GitHub para conocer el estado actual.</p></section>';
}

export function homeMilestones(roadmap) {
  const items=normalizeMilestones(roadmap).slice(0,3);
  return '<section class="home-milestones" aria-labelledby="home-milestones-heading"><div class="container">'+
    '<div class="home-milestones-head"><div><span class="eyebrow orange">NOVEDADES DEL PROYECTO</span>'+
    '<h2 id="home-milestones-heading">Lo último en la isla.</h2><p>Actualizaciones documentadas, no noticias del juego en vivo.</p></div>'+
    '<a href="noticias.html#hitos-reales" class="button portal-button-alt">Ver toda la bitácora →</a></div>'+
    '<div class="home-milestones-grid">'+items.map(item=>'<article>'+
      '<time datetime="'+escapeText(item.date)+'">'+escapeText(item.date)+'</time>'+
      '<span>'+milestoneKinds[item.kind]+'</span><h3>'+escapeText(item.title)+'</h3>'+
      '<p>'+escapeText(item.description)+'</p>'+
      '<a href="noticias.html#hitos-reales">Leer actualizaciones →</a></article>').join('')+'</div>'+
    '</div></section>';
}
