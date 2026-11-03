/**
 * Build a navigation-safe, informational BoomBang CL website for GitHub Pages.
 *
 * Important: GitHub Pages is STATIC. Never ship login/register forms, the
 * Laravel backend or the game client as if they were functional services.
 *
 * This script shares the exact same source HTML, CSS, JS and editorial
 * roadmap as the development branch while replacing unsupported web
 * functions with honest "not yet available" public information.
 */
import { readFile, writeFile, copyFile, mkdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enhancePublicSite } from './enhance-public-site.mjs';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const web = join(root, 'web');
const shots = join(root, 'doc', 'screenshots');
const readonlyPages = ['index','comunidad','noticias','ayuda','normas','privacidad','avance'];
const assets = ['styles.css','portal.css','avance.css','script.js','portal.js','avance.js','avance-data.json'];
const screenshots = ['portada.png','lobby.png','sala-publica.png','sala-privada.png','islas.png','golden-ring.png','personalizacion.png','ranking.png','catalogo.png'];

const menu = [
  ['Inicio','index.html'], ['Comunidad','comunidad.html'], ['Noticias','noticias.html'],
  ['Foro','foro.html'], ['Amigos y clanes','social.html'], ['Avances','avance.html'],
  ['Mi cuenta','cuenta.html'], ['Ayuda','ayuda.html'],
];
const repo = 'https://github.com/Fritz-Ale/boombangCL';

export const pendingPages = [
  ['foro.html','Foro de la comunidad','','Los temas y respuestas necesitan Laravel y una base de datos pública operativa. No mostramos publicaciones ficticias.'],
  ['chat.html','Chat de BoomBang CL','','Enviar mensajes requiere una sesión de usuario y almacenamiento en un servidor seguro. No hay chat público activo.'],
  ['social.html','Amigos y clanes','','Las solicitudes e invitaciones están implementadas en el portal de desarrollo. Falta conectarlas al cliente del juego y desplegar el servidor.'],
  ['catalogo.html','Catálogo de objetos','','La consulta requiere una API con objetos reales. Las compras siguen desactivadas.'],
  ['ranking.html','Rankings y minijuegos','','Las clasificaciones necesitan resultados reales almacenados en el backend. No se publican puntuaciones inventadas.'],
  ['moderacion.html','Moderación de la comunidad','','El panel de reportes está reservado para personal autorizado y requiere una API protegida.'],
  ['cuenta.html','Mi cuenta','','El registro y el inicio de sesión requieren HTTPS y Laravel. Esta página estática nunca te pedirá contraseña.'],
  ['restablecer.html','Recuperar contraseña','','El restablecimiento requiere una API y un proveedor de correo real. No introduzcas contraseñas en esta página.'],
];

export function navbar(current) {
  return '<nav class="main-nav" id="main-nav" aria-label="Navegación principal">' +
    menu.map(([label, file]) => '<a href="' + file + '"' +
      (file === current ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') +
    '</nav>';
}

function shell(current, title, inner) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0c3444"><title>${title} · BoomBang CL</title>
<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="portal.css"><link rel="stylesheet" href="site-preview.css">
<script defer src="script.js"></script></head><body class="portal-page">
<a class="skip-link" href="#principal">Saltar al contenido</a>
<div class="top-strip">✦ BoomBang CL · Portal en desarrollo</div><header class="site-header">
<div class="container header-inner"><a class="brand" href="index.html" aria-label="BoomBang CL, inicio"><span class="brand-sun">✳</span>
<span>boom<span class="brand-accent">bang</span><strong>CL</strong></span></a>
<button class="menu-button" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="Abrir menú"><span></span><span></span><span></span></button>
${navbar(current)}</div></header><main id="principal">${inner}</main>
<footer class="site-footer"><div class="container"><p>© <span id="year">2026</span> BoomBang CL · Proyecto independiente no oficial.</p>
<nav><a href="index.html">Inicio</a><a href="avance.html">Avances</a><a href="normas.html">Normas</a><a href="privacidad.html">Privacidad</a>
<a href="${repo}">GitHub</a></nav></div></footer></body></html>`;
}

const developmentNotice = '<div class="container portal-notice" role="note"><strong>Vista pública de desarrollo:</strong> puedes explorar la web y los avances. Cuentas, foro, chat y juego necesitan servidores. <a href="pendientes.html">Ver las nueve tareas restantes →</a></div>';

export function transformReadonlyPage(name, html) {
  const page = name + '.html';
  if (!html.includes('<main id="principal">')) throw new Error('Missing main: ' + page);
  const originalNav = /<nav\b[^>]*\bid="main-nav"[^>]*>[\s\S]*?<\/nav>/;
  if (!originalNav.test(html)) throw new Error('Missing navigation: ' + page);
  let result = html.replace(originalNav, navbar(page))
    .replace(/<script\b[^>]*src="portal-app\.js"[^>]*><\/script>/g, '')
    .replace(/<link rel="stylesheet" href="live\.css">/g, '')
    .replace(/<a\b[^>]*href="http:\/\/play\.boombang\.com"[^>]*>[\s\S]*?<\/a>/g,
      '<a class="button button-sun" href="ayuda.html">Consulta el estado del juego ↗</a>')
    .replace('</head>', '<link rel="stylesheet" href="site-preview.css"></head>');

  if (name !== 'avance') result = result.replace('<main id="principal">', '<main id="principal">' + developmentNotice);
  if (name === 'noticias') {
    const start = result.indexOf('<section class="portal-section container portal-live" data-portal-app="news"');
    const end = result.indexOf('<section class="portal-section portal-surface">', start);
    if (start < 0 || end < 0) throw new Error('News backend section not found');
    result = result.slice(0, start) +
      '<section class="portal-section container"><div class="portal-heading"><span class="eyebrow orange">NOTICIAS DEL PROYECTO</span><h2>Publicaciones en preparación</h2><p>Las noticias dinámicas se habilitarán cuando la API esté desplegada. Por ahora son ejemplos editoriales.</p><a class="button button-sun" href="avance.html">Ver avances comprobables ↗</a></div></section>' +
      result.slice(end);
  }
  if (name === 'index') {
    result = result.replace('El enlace utiliza la dirección de desarrollo local del proyecto; no es una sala pública ni confirma que el servidor esté en línea.',
      'Este sitio público es informativo: el juego multijugador no tiene un servidor público verificado.');
  }
  if (name === 'avance') {
    result = result
      .replace('Datos del repositorio, no una conexión de producción', 'Código en desarrollo; juego no desplegado')
      .replace('Cuando el panel se publique con GitHub Pages, GitHub Actions preparará una fotografía del Pull Request, las pruebas y las casillas de la hoja de ruta, sin mostrar credenciales privadas.',
        'Esta web es estática y no utiliza credenciales privadas. Consulta los enlaces a GitHub para conocer los resultados actuales.')
      .replace('En el portal local, consulta los enlaces de GitHub. El resumen automático se actualiza al desplegar GitHub Pages y no es en tiempo real.',
        'Esta es una fotografía del avance. Consulta GitHub para resultados en tiempo real.')
      .replace('Ver hoja de ruta en GitHub ↗</a>',
        'Ver hoja de ruta en GitHub ↗</a><a class="button button-ghost" href="pendientes.html">Las 9 tareas restantes →</a>');
  }
  return result;
}

function unavailablePage(path, title, emoji, description) {
  const media = path === 'ranking.html' ? 'ranking.png' : path === 'catalogo.html' ? 'catalogo.png' : null;
  const right = media ? `<img src="screenshots/${media}" alt="Captura ilustrativa sin datos en vivo" loading="lazy">` :
    '<span aria-hidden="true">' + emoji + '</span>';
  return shell(path,title,`<section class="portal-banner portal-compact"><div class="container">
<span class="eyebrow light">EN DESARROLLO</span><h1>${title}</h1><p>Esta función aún no puede utilizarse en GitHub Pages.</p>
</div></section><section class="portal-section container"><div class="preview-cols"><div>
<span class="eyebrow orange">NO DISPONIBLE AÚN</span><h2>Seguimos trabajando.</h2><p>${description}</p>
<div class="portal-notice"><strong>Privacidad:</strong> no solicitamos credenciales ni mostramos funciones simuladas.</div>
<div class="preview-links"><a class="button button-sun" href="pendientes.html">Qué falta para lanzar →</a>
<a class="button portal-button-alt" href="avance.html">Ver avances</a><a class="button portal-button-alt" href="index.html">Inicio</a></div>
</div><div class="preview-art">${right}<p>Función aún sin conexión a un servicio público.</p></div></div></section>`);
}

const launchBlockers = [
  ['Infraestructura','Envío real de correos y dominio remitente','Se requiere proveedor de email, dominio validado y pruebas de entrega.'],
  ['Infraestructura','Dominio público, HTTPS y secretos seguros','El frontend estático puede usarse por HTTPS en Pages; el juego necesita alojar API, sockets, cliente y base de datos con secretos protegidos.'],
  ['Seguridad','Verificación de correo y antispam reforzado','Confirmar email y proteger el registro antes de abrir cuentas públicas.'],
  ['Calidad','Pruebas integrales del juego y todos los contenedores','Validar cliente HTML5, Laravel, Socket.IO, MariaDB y funcionalidades con usuarios de prueba.'],
  ['Integración','Amistades y clanes dentro del cliente del juego','Integrar las funciones sociales existentes dentro de Phaser y validar permisos.'],
  ['Legal','Revisión de activos, licencias y publicación','Comprobar derechos de imágenes, música, marcas y código.'],
  ['Privacidad','Política de privacidad y retención definitivas','Definir gestión y conservación de datos, eliminaciones y reportes.'],
  ['Economía','Decidir compras y VIP con seguridad transaccional','Mantener compras desactivadas hasta implementar validación completa del lado del servidor.'],
  ['Revisión','Revisión y aprobación de la PR antes de fusionar','Auditar, probar y aprobar la PR de desarrollo antes de fusionarla con main.'],
];
function blockersPage() {
  return shell('pendientes.html','Las nueve tareas pendientes',`<section class="portal-banner portal-compact"><div class="container">
<span class="eyebrow light">HOJA DE RUTA</span><h1>Las nueve tareas <em>pendientes.</em></h1>
<p>Once de veinte tareas del portal están implementadas en código. Estas nueve dependencias siguen sin resolver.</p>
</div></section><section class="portal-section container"><div class="portal-notice">
<strong>La página pública no significa que el juego esté disponible.</strong> GitHub Pages solo hospeda archivos estáticos, no el servidor multijugador.</div>
<div class="preview-roadmap">${launchBlockers.map(([category,title,desc],i)=>`<article><span>${String(i+1).padStart(2,'0')} · ${category}</span>
<h2>${title}</h2><p>${desc}</p></article>`).join('')}</div>
<div class="preview-links"><a class="button button-sun" href="avance.html">Volver a avances</a>
<a class="button portal-button-alt" href="${repo}/issues/2">Checklist en GitHub ↗</a></div>
</section>`);
}
const css = `.site-header .main-nav{gap:15px;flex-wrap:wrap}.site-header .main-nav>a{font-size:.77rem}
.preview-cols{display:grid;grid-template-columns:1.2fr .8fr;gap:45px;align-items:center}
.preview-cols h2{font-size:clamp(2.2rem,4vw,3.5rem)}.preview-cols p{color:#607a86;line-height:1.8}
.preview-links{display:flex;flex-wrap:wrap;gap:13px;margin-top:25px}
.preview-art{background:#e7f6ea;border:1px solid #c9e4d6;border-radius:22px;overflow:hidden;text-align:center}
.preview-art>span{font-size:7rem;display:grid;place-items:center;min-height:230px}
.preview-art img{width:100%;max-height:330px;object-fit:cover}.preview-art p{padding:16px;color:#41817b;font-size:.82rem}
.preview-roadmap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px;margin:30px 0}
.preview-roadmap article{background:#fff;border:1px solid #e2ebdf;border-radius:20px;padding:24px}
.preview-roadmap article>span{color:#078f8a;font-size:.73rem;font-weight:900;letter-spacing:.07em}
.preview-roadmap h2{font-size:1.22rem;margin:10px 0}
.preview-roadmap p{font-size:.89rem;line-height:1.7;color:#67808b;margin:0}
@media(max-width:850px){.preview-cols,.preview-roadmap{grid-template-columns:1fr}}`;

function linksOf(html) {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1])
    .filter(link => !/^(https?:|mailto:|data:|#)/.test(link))
    .map(link => link.split(/[?#]/)[0])
    .filter(link => link && link !== './' && link !== '/');
}

export async function buildPublicSite(targetDir) {
  const out = resolve(targetDir);
  const roadmap = JSON.parse(await readFile(join(web,'avance-data.json'),'utf8'));
  const tasks = roadmap.phases.flatMap(group => group.tasks || []);
  if (tasks.length !== 20 || tasks.filter(item => item.status === 'implemented').length !== 11) {
    throw new Error('Roadmap must be reviewed before changing task counts');
  }
  for (const [,label] of launchBlockers) {
    if (!tasks.some(item => item.name === label && item.status === 'pending')) {
      throw new Error('Outstanding task not found in roadmap: ' + label);
    }
  }
  await mkdir(out,{recursive:true});
  await mkdir(join(out,'screenshots'),{recursive:true});
  for (const asset of assets) await copyFile(join(web,asset),join(out,asset));
  for (const picture of screenshots) await copyFile(join(shots,picture),join(out,'screenshots',picture));
  await writeFile(join(out,'site-preview.css'),css);
  await writeFile(join(out,'.nojekyll'),'\n');

  const pages = new Map();
  for (const name of readonlyPages) {
    const content = await readFile(join(web,name+'.html'),'utf8');
    pages.set(name+'.html',transformReadonlyPage(name,content));
  }
  for (const [filename,title,emoji,description] of pendingPages) {
    pages.set(filename,unavailablePage(filename,title,emoji,description));
  }
  pages.set('pendientes.html',blockersPage());
  pages.set('404.html',shell('404.html','Página no encontrada',
    '<section class="portal-section container"><h1>Esta isla no está aquí.</h1><p>La página no existe.</p><a class="button button-sun" href="index.html">Volver al inicio</a></section>'));

  const available = new Set([...pages.keys(),...assets,'site-preview.css','.nojekyll',...screenshots.map(file=>'screenshots/'+file)]);
  for (const [filename,content] of pages.entries()) {
    for (const link of linksOf(content)) {
      if (!available.has(link)) throw new Error('Broken public link ' + filename + ' -> ' + link);
    }
    if (filename === 'cuenta.html' && /<form\b/.test(content)) throw new Error('Public account form must be disabled');
    if (filename === 'index.html' && content.includes('portal-app.js')) throw new Error('Public homepage must be static');
    await writeFile(join(out,filename),content);
  }
  // Verify all copied media resources exist before publication.
  await Promise.all([...available].map(async item => { await stat(join(out,item)); }));
  // Add safe search, SEO, keyboard-friendly navigation and progress snapshot.
  const enriched = await enhancePublicSite(out,roadmap);
  console.log('Public BoomBang CL site prepared: ' + enriched.pages + ' pages / ' + tasks.length + ' tracked tasks');
  return { pages:[...pages.keys(),'buscar.html','galeria.html'], tasks:tasks.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node web/scripts/build-public-site.mjs <output-directory>');
    process.exitCode=1;
  } else {
    buildPublicSite(target).catch(error => {console.error(error.message);process.exitCode=1;});
  }
}
