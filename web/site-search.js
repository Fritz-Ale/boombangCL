/* Search only the static, public navigation index produced by GitHub Pages. */
(() => {
  'use strict';
  const input = document.querySelector('[data-site-search]');
  const list = document.querySelector('[data-search-results]');
  const status = document.querySelector('[data-search-status]');
  const filter = document.querySelector('[data-search-category]');
  const clear = document.querySelector('[data-clear-search]');
  if (!input || !list || !status || !filter || !clear) return;

  const normalize = value => String(value || '').toLocaleLowerCase('es')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  let entries = [];

  function buildResult(item) {
    const article = document.createElement('article');
    article.className = 'site-search-card';
    const link = document.createElement('a');
    link.href = item.url;
    link.className = 'site-search-link';
    const category = document.createElement('span');
    category.className = 'site-search-kind';
    category.textContent = item.kind === 'task' ? 'Tarea de desarrollo' : 'Sección del sitio';
    const heading = document.createElement('h2');
    heading.textContent = item.title;
    const description = document.createElement('p');
    description.textContent = item.description;
    link.append(category,heading,description);
    article.append(link);
    return article;
  }

  function render() {
    const query = normalize(input.value);
    const selected = filter.value;
    let matches = entries.filter(item => (selected === 'all' || item.kind === selected) &&
      (!query || normalize(item.title + ' ' + item.description + ' ' + (item.tags || '')).includes(query)));
    const count = matches.length;
    matches = matches.slice(0,30);
    list.replaceChildren(...matches.map(buildResult));
    if (!count) {
      const empty = document.createElement('p');
      empty.className = 'site-search-empty';
      empty.textContent = 'No encontramos resultados. Prueba con otra palabra o con el filtro «Todo».';
      list.append(empty);
    }
    status.textContent = count === 1 ? '1 resultado' : count + ' resultados' +
      (count > matches.length ? ' · se muestran los primeros ' + matches.length : '');
    clear.hidden = input.value.length === 0;
  }

  input.addEventListener('input', render);
  filter.addEventListener('change', render);
  clear.addEventListener('click', () => { input.value = ''; filter.value = 'all'; render(); input.focus(); });

  document.querySelector('[data-search-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    render();
    document.querySelector('[data-search-status]')?.scrollIntoView({block:'nearest'});
  });

  fetch('search-index.json', {cache:'no-store'})
    .then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.json(); })
    .then(data => {
      if (data.version !== 1 || !Array.isArray(data.entries)) throw new Error('Invalid search index');
      entries = data.entries.filter(item => ['page','task'].includes(item.kind) &&
        typeof item.title === 'string' && typeof item.description === 'string' &&
        typeof item.url === 'string' && /^(?:[a-z]+\.html)(?:#[a-z0-9-]+)?$/.test(item.url));
      const query = new URLSearchParams(window.location.search).get('q');
      if (query) input.value = query.slice(0,100);
      render();
    })
    .catch(() => {
      status.textContent = 'No fue posible cargar el índice de búsqueda.';
      list.replaceChildren();
      const link = document.createElement('a');
      link.href = 'avance.html';
      link.textContent = 'Consultar todas las tareas en el panel de avances →';
      list.append(link);
    });
})();
