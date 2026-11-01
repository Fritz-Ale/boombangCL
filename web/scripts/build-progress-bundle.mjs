/**
 * Build a standalone, offline-viewable BoomBang CL progress preview, or the
 * isolated GitHub Pages bundle. Never packages API, game, account or secrets.
 *
 * Usage:
 *   node web/scripts/build-progress-bundle.mjs <outputDir> standalone
 *   node web/scripts/build-progress-bundle.mjs <outputDir> pages
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STYLES = ['styles.css', 'portal.css', 'avance.css'];
export const SCRIPTS = ['script.js', 'avance.js'];
const web = resolve(fileURLToPath(new URL('../', import.meta.url)));
const repository = 'https://github.com/Fritz-Ale/boombangCL';

export function relocateNavigation(html) {
  // The isolated export does NOT contain account, privacy or game pages.
  // Keep their links functional by pointing to the repository, not 404s.
  return html
    .replace(/href="(?:index|comunidad|noticias|cuenta|normas|privacidad)\.html"/g, 'href="' + repository + '"')
    .replace(/href="avance\.html"/g, 'href="./"');
}

export async function buildBundle(targetDirectory, mode = 'standalone') {
  if (!['standalone', 'pages'].includes(mode)) throw new Error('Unsupported bundle mode');
  const directory = resolve(targetDirectory);
  await mkdir(directory, { recursive: true });

  let html = relocateNavigation(await readFile(join(web, 'avance.html'), 'utf8'));
  const dataSource = await readFile(join(web, 'avance-data.json'), 'utf8');
  const data = JSON.parse(dataSource);
  if (data.version !== 1 || !Array.isArray(data.phases) || !data.phases.length) {
    throw new Error('Invalid editorial roadmap');
  }

  if (mode === 'pages') {
    for (const asset of [...STYLES, ...SCRIPTS]) {
      await copyFile(join(web, asset), join(directory, asset));
    }
    await writeFile(join(directory, 'avance-data.json'), dataSource);
    await writeFile(join(directory, '.nojekyll'), '');
  } else {
    for (const file of STYLES) {
      const tag = '<link rel="stylesheet" href="' + file + '">';
      if (!html.includes(tag)) throw new Error('Missing style: ' + file);
      let css = await readFile(join(web, file), 'utf8');
      // Avoid remote font requests; use local fallback fonts in offline preview.
      css = css.replace(/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com\/[^;]+;/g, '');
      if (/<\/style/i.test(css)) throw new Error('Unexpected CSS termination');
      html = html.replace(tag, '<style>\n' + css + '\n</style>');
    }
    const scripts = [];
    for (const file of SCRIPTS) {
      const tag = '<script defer src="' + file + '"></script>';
      if (!html.includes(tag)) throw new Error('Missing script: ' + file);
      html = html.replace(tag, '');
      const js = await readFile(join(web, file), 'utf8');
      if (/<\/script/i.test(js)) throw new Error('Unexpected JS termination');
      scripts.push('<script>\n' + js + '\n</script>');
    }
    // JSON is inserted into a non-executable script. Escaping < and &
    // prevents content embedded in future roadmap edits from injecting tags.
    const safeJson = JSON.stringify(data).replace(/</g, '\\u003c').replace(/&/g, '\\u0026');
    const inline = '<script type="application/json" id="avance-embedded">' +
      safeJson + '</script>';
    html = html.replace(
      '</body>',
      inline + '\n' + scripts.join('\n') + '\n</body>'
    );
    html = html.replace(
      'Datos del repositorio, no una conexión de producción',
      'Vista previa descargable; no es una web publicada'
    );
    await writeFile(join(directory, 'LEEME.txt'),
      'BoomBang CL - Vista previa del panel de avances\n\n' +
      'Abre index.html en un navegador. Funciona sin servidor, ' +
      'sin Laravel y sin tokens personales.\n' +
      'Las cifras son una fotografia editorial de las tareas.\n' +
      'GitHub es la fuente para revisar pruebas, issues y cambios recientes.\n'
    );
  }

  if (!html.includes('<main') || !html.includes('</main>')) {
    throw new Error('Dashboard HTML has no main landmark');
  }
  await writeFile(join(directory, 'index.html'), html);
  return { mode, output: join(directory, 'index.html'), taskCount: data.phases.flatMap(p => p.tasks).length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, mode] = process.argv.slice(2);
  if (!directory) {
    console.error('Usage: node web/scripts/build-progress-bundle.mjs <dir> [standalone|pages]');
    process.exitCode = 1;
  } else {
    buildBundle(directory, mode || 'standalone')
      .then(result => console.log('Dashboard bundle ready:', result.mode, result.taskCount, 'tasks'))
      .catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
