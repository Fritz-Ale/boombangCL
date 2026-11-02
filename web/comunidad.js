/* BoomBangCL · contenido comunitario, sin analítica ni almacenamiento */
(() => {
  const clock = document.getElementById('chile-time');
  const formatChile = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago', day: '2-digit', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  });
  if (clock) {
    const renderClock = () => { clock.textContent = formatChile.format(new Date()) + ' (Santiago)'; };
    renderClock();
    setInterval(renderClock, 60000);
  }
  const events = document.getElementById('eventos-lista');
  if (events) {
    fetch('eventos.json', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('La agenda no está disponible');
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) return;
        const valid = data.filter(event => {
          const date = Date.parse(event.fecha_utc);
          return Number.isFinite(date) && date >= Date.now() &&
            typeof event.titulo === 'string' && event.titulo.trim() &&
            typeof event.descripcion === 'string';
        }).sort((a, b) => Date.parse(a.fecha_utc) - Date.parse(b.fecha_utc)).slice(0, 12);
        if (!valid.length) return;
        events.replaceChildren();
        valid.forEach(event => {
          const card = document.createElement('article');
          card.className = 'cl-event';
          const time = document.createElement('time');
          time.dateTime = new Date(event.fecha_utc).toISOString();
          time.textContent = formatChile.format(new Date(event.fecha_utc)) + ' (Santiago)';
          const title = document.createElement('h3');
          title.textContent = event.titulo.slice(0, 110);
          const detail = document.createElement('p');
          detail.textContent = event.descripcion.slice(0, 400);
          card.append(time, title, detail);
          events.append(card);
        });
      })
      .catch(() => { /* Mantener mensaje estático; no inventar eventos */ });
  }
  const form = document.getElementById('idea-form');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const type = document.getElementById('idea-categoria').value.trim();
    const title = document.getElementById('idea-titulo').value.trim().slice(0, 90);
    const detail = document.getElementById('idea-detalle').value.trim().slice(0, 1500);
    const status = document.getElementById('idea-estado');
    if (title.length < 6 || detail.length < 20) {
      status.textContent = 'Describe la idea con un título y detalles suficientes.';
      return;
    }
    const issueTitle = '[Comunidad CL] ' + type + ': ' + title;
    const issueBody = '## Tipo\n' + type + '\n\n## Propuesta\n' + detail +
      '\n\n## Contexto\nBorrador creado desde la web de BoomBangCL. No incluyas datos personales.';
    const url = new URL('https://github.com/Fritz-Ale/boombangCL/issues/new');
    url.searchParams.set('title', issueTitle);
    url.searchParams.set('body', issueBody);
    const opened = window.open(url.toString(), '_blank', 'noopener,noreferrer');
    status.textContent = 'El borrador se abrió en GitHub; revisa su contenido antes de publicarlo. Se requiere cuenta de GitHub.';
    if (!opened) {
      const link = document.createElement('a');
      link.href = url.toString(); link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = 'Abrir propuesta en GitHub';
      status.replaceChildren(link);
    }
  });
  const filters = document.querySelectorAll('.cl-filter[data-filter]');
  const cards = document.querySelectorAll('.cl-roadmap-item[data-stage]');
  const count = document.getElementById('roadmap-count');
  if (filters.length && cards.length) {
    const render = stage => {
      let total = 0;
      cards.forEach(card => {
        card.hidden = stage !== 'todo' && card.dataset.stage !== stage;
        if (!card.hidden) total++;
      });
      filters.forEach(button => {
        const active = button.dataset.filter === stage;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (count) count.textContent = String(total);
    };
    filters.forEach(button => button.addEventListener('click', () => render(button.dataset.filter)));
    render('todo');
  }
})();
