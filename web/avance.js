/* Dashboard de avances: datos versionados en el repo; sin acceso a repos privados desde el navegador. */
(() => {
  'use strict';
  const query = selector => document.querySelector(selector);
  const element = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  };
  const put = (selector, text) => { const target = query(selector); if (target) target.textContent = text; };
  const statusText = { implemented:'Implementado en la rama', pending:'Pendiente', testing:'En pruebas' };
  const statusMark = { implemented:'✓', pending:'•', testing:'◷' };
  let roadmap = null;
  function render() {
    if (!roadmap || !Array.isArray(roadmap.phases)) return;
    const tasks = roadmap.phases.flatMap(phase => phase.tasks || []);
    const implemented = tasks.filter(item => item.status === 'implemented').length;
    const pending = tasks.filter(item => item.status === 'pending').length;
    const percentage = tasks.length ? Math.round((implemented / tasks.length) * 100) : 0;
    put('[data-count-implemented]', implemented);
    put('[data-count-pending]', pending);
    put('[data-percentage]', percentage + '%');
    put('[data-done-detail]', implemented + ' de ' + tasks.length + ' tareas de esta lista tienen implementación en código');
    put('[data-count-tests]', String(roadmap.ci?.testsPassed ?? 0) + '/' + String(roadmap.ci?.testsPassed ?? 0));
    const bar = query('[data-progress-bar]');
    if (bar) bar.style.width = percentage + '%';
    const progress = query('[role=progressbar]');
    if (progress) progress.setAttribute('aria-valuenow', String(percentage));
    const date = new Date(roadmap.capturedAt + 'T12:00:00');
    put('[data-captured]', Number.isNaN(date.getTime()) ? roadmap.capturedAt : date.toLocaleDateString('es-CL',{year:'numeric',month:'long',day:'numeric'}));

    const selected = query('[data-filter]')?.value || 'all';
    const holder = query('[data-phases]');
    if (!holder) return;
    holder.replaceChildren();
    for (const phase of roadmap.phases) {
      const list = (phase.tasks || []).filter(item => selected === 'all' || item.status === selected);
      if (!list.length) continue;
      const panel = element('article', null, 'avance-phase');
      const top = element('div', null, 'avance-phase-title');
      const heading = element('div');
      heading.append(element('h3', phase.name), element('p', phase.description), element('small', list.length + ' tarea(s) mostrada(s)', 'avance-phase-count'));
      top.append(element('span', phase.icon, 'avance-phase-emoji'), heading);
      panel.append(top);
      for (const item of list) {
        const row = element('div', null, 'avance-task ' + (item.status || 'pending'));
        const copy = element('div');
        copy.append(element('h4', item.name), element('p', item.detail || ''), element('small', statusText[item.status] || 'Estado por revisar'));
        row.append(element('span', statusMark[item.status] || '•', 'avance-task-mark'), copy);
        panel.append(row);
      }
      holder.append(panel);
    }
    if (!holder.children.length) {
      holder.append(element('p', 'No hay tareas para el filtro seleccionado.', 'avance-fallback'));
    }
  }
  const ghState = {
    success: 'Pruebas aprobadas',
    failure: 'Pruebas fallidas',
    cancelled: 'Ejecución cancelada',
    skipped: 'Ejecución omitida',
    timed_out: 'Pruebas agotaron el tiempo',
    neutral: 'Resultado neutral',
    action_required: 'Requiere intervención',
  };
  async function readGithubSnapshot() {
    try {
      // Only the Pages build produces this file: no browser-to-GitHub private
      // requests and no personal access token in JavaScript.
      const response = await fetch('avance-github.json', { cache: 'no-store' });
      if (!response.ok) return;
      const snapshot = await response.json();
      if (snapshot.version !== 1 || snapshot.origin !== 'github-actions-snapshot') return;
      if (snapshot.pullRequest) {
        const pr = snapshot.pullRequest;
        put('[data-gh-pr]', pr.merged ? 'Fusionado' : pr.state === 'open' ? (pr.draft ? 'Borrador · abierto' : 'Abierto') : 'Cerrado');
        if (Number.isSafeInteger(pr.changedFiles) && Number.isSafeInteger(pr.commits)) {
          put('[data-gh-files]', pr.changedFiles + ' archivos · ' + pr.commits + ' commits');
        }
      }
      if (snapshot.checks) {
        const checks = snapshot.checks;
        put('[data-gh-checks]', checks.status === 'completed' ? (ghState[checks.conclusion] || 'Finalizadas') : checks.status === 'in_progress' ? 'Pruebas en ejecución' : 'Pruebas pendientes');
        put('[data-gh-run]', 'Estado de GitHub Actions al generar esta fotografía');
      }
      if (snapshot.issue && Number.isSafeInteger(snapshot.issue.total)) {
        put('[data-gh-roadmap]', snapshot.issue.completed + '/' + snapshot.issue.total + ' tareas');
        put('[data-gh-issue]', snapshot.issue.pending + ' pendientes en la issue #2 al publicar');
      }
      if (snapshot.generatedAt && !Number.isNaN(Date.parse(snapshot.generatedAt))) {
        put('[data-gh-timestamp]', 'Fotografía de GitHub generada: ' + new Date(snapshot.generatedAt).toLocaleString('es-CL', { dateStyle:'medium', timeStyle:'short' }) + '. No es una conexión en tiempo real.');
      }
    } catch {
      // Local Docker deployments work with the editorial roadmap only.
    }
  }

  async function init() {
    try {
      const response = await fetch('avance-data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar los datos del proyecto');
      roadmap = await response.json();
      if (roadmap.version !== 1 || !Array.isArray(roadmap.phases)) throw new Error('Formato de avances no válido');
      render();
      const updates = query('[data-updates]');
      if (updates) for (const item of roadmap.updates || []) {
        const article = element('article', null, 'avance-update');
        const content = element('div');
        content.append(element('h3', item.title), element('p', item.description));
        article.append(element('time', item.date), content);
        updates.append(article);
      }
    } catch (error) {
      const holder = query('[data-phases]');
      if (holder) holder.replaceChildren(element('p','No fue posible cargar la fotografía del avance. Revisa la hoja de ruta en GitHub.','avance-fallback'));
    }
  }
  query('[data-filter]')?.addEventListener('change', render);
  readGithubSnapshot();
  init();
})();