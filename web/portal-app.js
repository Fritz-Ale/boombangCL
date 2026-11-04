/* BoomBang CL portal: same-origin Laravel web sessions, no emulator secrets. */
(() => {
  'use strict';
  const root = document.querySelector('[data-portal-app]');
  if (!root) return;

  const kind = root.dataset.portalApp;
  const state = { csrf: '', user: null, items: [], page: 1, threadId: null };
  const one = (selector, base = root) => base.querySelector(selector);
  const all = (selector, base = root) => [...base.querySelectorAll(selector)];
  const put = (selector, text, base = root) => { const node = one(selector, base); if (node) node.textContent = String(text); };
  const visible = (selector, show, base = root) => { const node = one(selector, base); if (node) node.hidden = !show; };
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined && text !== null) el.textContent = String(text);
    if (className) el.className = className;
    return el;
  };
  const date = raw => {
    if (!raw) return '';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString('es-CL');
  };
  function message(text, error = false) {
    const box = one('[data-api-status]');
    if (box) {
      box.textContent = text;
      box.classList.toggle('error', error);
      box.classList.toggle('ok', !error);
    }
  }
  function formStatus(form, text) {
    const area = one('[data-form-status]', form.parentElement) || one('[data-form-status]', form);
    if (area) area.textContent = text;
  }
  function errorMessage(payload, response) {
    const errors = payload && payload.errors ? Object.values(payload.errors).flat() : [];
    return errors[0] || (payload && payload.message) || ('Error HTTP ' + response.status);
  }
  async function api(path, method = 'GET', body) {
    const headers = { Accept: 'application/json' };
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      if (state.csrf) headers['X-CSRF-TOKEN'] = state.csrf;
    }
    const response = await fetch('/portal' + path, {
      method, credentials: 'same-origin', headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(payload, response));
    return payload;
  }
  async function session() {
    const payload = await api('/session');
    state.csrf = payload.csrf || '';
    state.user = payload.authenticated ? payload.user : null;
    return state.user;
  }
  function postForm(form) {
    return Object.fromEntries(new FormData(form).entries());
  }
  function empty(parent, text) {
    parent.replaceChildren(node('p', text, 'portal-empty-state'));
  }
  function formatError(err) {
    return err && err.message ? err.message : 'No se pudo conectar con la API.';
  }
  async function pulse() {
    if (!state.user) return;
    try { await api('/presence', 'POST', {}); } catch (_) { /* keep UI honest */ }
  }
  async function status() {
    try {
      const data = await api('/status');
      const count = Number(data.portal_active_last_5_minutes);
      if (Number.isFinite(count)) put('[data-portal-presence]', count + ' usuario(s) activos en el portal en los últimos 5 minutos');
      const gameCount = data.game_online_count;
      const game = one('[data-game-presence]');
      if (game) game.textContent = Number.isInteger(gameCount) ? gameCount + ' jugador(es) reales en el juego (excluye bots)' : 'Jugadores del juego: no disponible';
    } catch (_) { put('[data-portal-presence]', 'Presencia del portal no disponible'); }
  }

  function initAccount() {
    const paint = () => {
      visible('[data-logged-in]', Boolean(state.user));
      visible('[data-logged-out]', !state.user);
      put('[data-username]', state.user ? state.user.username : '');
      visible('[data-staff-link]', Boolean(state.user && state.user.is_staff));
      const needsEmail = Boolean(state.user && state.user.email_verification_required && !state.user.email_verified);
      visible('[data-email-pending]', needsEmail);
      visible('[data-email-confirmed]', Boolean(state.user && state.user.email_verification_required && state.user.email_verified));
      const verifiedQuery = new URLSearchParams(window.location.search).get('email') === 'verified';
      message(needsEmail ? 'Confirma el correo para activar las funciones sociales.' :
        verifiedQuery && state.user ? 'Correo confirmado correctamente.' :
        state.user ? 'Sesión del portal iniciada.' : 'Puedes iniciar sesión o registrarte en el portal.');
      if (verifiedQuery) {
        const url = new URL(window.location.href);
        url.searchParams.delete('email');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    };
    for (const [selector, endpoint] of [['[data-login-form]', '/login'], ['[data-register-form]', '/register']]) {
      const form = one(selector);
      if (!form) continue;
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = one('[type=submit]', form);
        button.disabled = true;
        formStatus(form, 'Enviando…');
        try {
          const result = await api(endpoint, 'POST', postForm(form));
          state.csrf = result.csrf || state.csrf;
          state.user = result.user;
          form.reset();
          paint();
        } catch (error) {
          formStatus(form, formatError(error));
          if (String(error.message).includes('419')) message('Sesión caducada. Recarga la página antes de reintentar.', true);
        } finally { button.disabled = false; }
      });
    }
    const resend = one('[data-resend-verification]');
    if (resend) resend.addEventListener('click', async () => {
      resend.disabled = true;
      try {
        const response = await api('/resend-verification', 'POST', {});
        put('[data-verification-message]', response.message || 'Consulta tu bandeja de entrada.');
      } catch (error) {
        put('[data-verification-message]', formatError(error));
      } finally {
        resend.disabled = false;
      }
    });
    const logout = one('[data-logout]');
    if (logout) logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        const result = await api('/logout', 'POST', {});
        state.csrf = result.csrf || '';
        state.user = null;
        paint();
      } catch (error) { message(formatError(error), true); }
      finally { logout.disabled = false; }
    });
    paint();
  }

  async function reportContent(type, id) {
    if (!state.user) {
      message('Inicia sesión para reportar contenido.', true);
      return;
    }
    const choices = {'1':'spam','2':'harassment','3':'personal_data','4':'inappropriate','5':'other'};
    const answer = window.prompt('¿Por qué quieres reportar este contenido?\\n1. Spam\\n2. Acoso\\n3. Datos personales\\n4. Contenido inapropiado\\n5. Otro');
    if (!answer || !Object.prototype.hasOwnProperty.call(choices, answer.trim())) {
      if (answer) message('Selecciona un número del 1 al 5.', true);
      return;
    }
    try {
      await api('/reports', 'POST', {type, id, reason: choices[answer.trim()]});
      message('Reporte enviado al equipo de moderación.');
    } catch (error) {
      message(formatError(error), true);
    }
  }

  function renderThreads(items, append) {
    const container = one('[data-forum-list]');
    if (!append) container.replaceChildren();
    if (!items.length && !append) return empty(container, 'Todavía no hay temas. Puedes publicar el primero si tienes una cuenta.');
    for (const thread of items) {
      const button = node('button');
      button.type = 'button';
      button.append(
        node('strong', thread.title),
        node('span', (thread.author || 'Usuario') + ' · ' + date(thread.created_at) + (thread.locked ? ' · Cerrado' : '')),
        node('p', String(thread.body || '').slice(0, 190))
      );
      button.addEventListener('click', () => openThread(thread.id, true));
      container.append(button);
    }
  }
  async function loadThreads(append = false) {
    const data = await api('/forum/threads?page=' + state.page);
    renderThreads(data.items || [], append);
    visible('[data-forum-next]', Boolean(data.has_more));
  }
  async function openThread(id, updateUrl) {
    const payload = await api('/forum/threads/' + encodeURIComponent(id));
    const item = payload.thread;
    state.threadId = item.id;
    one('.portal-forum-layout').hidden = true;
    visible('[data-thread-view]', true);
    put('[data-thread-title]', item.title);
    put('[data-thread-meta]', item.author + ' · ' + date(item.created_at) + (item.locked ? ' · Tema cerrado' : ''));
    put('[data-thread-body]', item.body);
    const actions = one('[data-thread-actions]');
    actions.replaceChildren();
    if (state.user) {
      const report = node('button', 'Reportar tema', 'portal-backlink');
      report.type = 'button';
      report.addEventListener('click', () => reportContent('thread', item.id));
      actions.append(report);
    }
    if (state.user && state.user.is_staff) {
      const lock = node('button', item.locked ? 'Reabrir tema' : 'Cerrar tema', 'portal-backlink');
      lock.type = 'button';
      lock.addEventListener('click', async () => {
        try { await api('/forum/threads/' + item.id + '/lock', 'PATCH', { locked: !item.locked }); await openThread(item.id, false); }
        catch (error) { message(formatError(error), true); }
      });
      const remove = node('button', 'Eliminar tema', 'portal-backlink');
      remove.type = 'button';
      remove.style.marginLeft = '20px';
      remove.addEventListener('click', async () => {
        if (!window.confirm('¿Eliminar este tema y todas sus respuestas?')) return;
        try {
          await api('/forum/threads/' + item.id, 'DELETE');
          state.page = 1; await loadThreads();
          visible('[data-thread-view]', false);
          one('.portal-forum-layout').hidden = false;
          history.pushState(null, '', 'foro.html');
        } catch (error) { message(formatError(error), true); }
      });
      actions.append(lock, remove);
    }
    const replies = one('[data-thread-replies]');
    replies.replaceChildren();
    if (!(payload.replies || []).length) empty(replies, 'Todavía no hay respuestas.');
    else for (const reply of payload.replies) {
      const entry = node('div', null, 'portal-thread-reply');
      entry.append(node('small', reply.author + ' · ' + date(reply.created_at)), node('p', reply.body));
      if (state.user) {
        const report = node('button', 'Reportar respuesta', 'portal-backlink');
        report.type = 'button';
        report.addEventListener('click', () => reportContent('reply', reply.id));
        entry.append(report);
      }
      if (state.user && state.user.is_staff) {
        const remove = node('button', 'Eliminar respuesta', 'portal-backlink');
        remove.type = 'button';
        remove.addEventListener('click', async () => {
          if (!window.confirm('¿Eliminar esta respuesta?')) return;
          try { await api('/forum/replies/' + reply.id, 'DELETE'); await openThread(state.threadId, false); }
          catch (error) { message(formatError(error), true); }
        });
        entry.append(remove);
      }
      replies.append(entry);
    }
    if (payload.truncated) replies.append(node('p', 'Hay más respuestas que las 100 mostradas.'));
    visible('[data-forum-reply]', Boolean(state.user) && !item.locked);
    visible('[data-thread-login]', !state.user && !item.locked);
    if (updateUrl) history.pushState({ id: item.id }, '', 'foro.html?id=' + encodeURIComponent(item.id));
  }
  function initForum() {
    visible('[data-forum-create-wrap]', Boolean(state.user));
    visible('[data-forum-login]', !state.user);
    message('Consultando temas públicos del foro…');
    const form = one('[data-forum-create]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        const reply = await api('/forum/threads', 'POST', postForm(form));
        form.reset();
        state.page = 1;
        await loadThreads();
        await openThread(reply.id, true);
      } catch (error) { formStatus(form, formatError(error)); }
    });
    const reply = one('[data-forum-reply]');
    reply.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await api('/forum/threads/' + encodeURIComponent(state.threadId) + '/replies', 'POST', postForm(reply));
        reply.reset();
        await openThread(state.threadId, false);
      } catch (error) { formStatus(reply, formatError(error)); }
    });
    one('[data-forum-next]').addEventListener('click', async () => {
      state.page++;
      try { await loadThreads(true); } catch (error) { state.page--; message(formatError(error), true); }
    });
    one('[data-forum-back]').addEventListener('click', () => {
      visible('[data-thread-view]', false);
      one('.portal-forum-layout').hidden = false;
      history.pushState(null, '', 'foro.html');
    });
    window.addEventListener('popstate', () => {
      const selected = new URLSearchParams(location.search).get('id');
      if (selected && /^\d+$/.test(selected)) openThread(selected, false).catch(e => message(formatError(e), true));
      else { visible('[data-thread-view]', false); one('.portal-forum-layout').hidden = false; }
    });
    loadThreads().then(() => {
      message('Temas públicos consultados en la API de BBCL.');
      const selected = new URLSearchParams(location.search).get('id');
      if (selected && /^\d+$/.test(selected)) return openThread(selected, false);
    }).catch(error => message(formatError(error), true));
  }

  async function refreshChat(scroll = false) {
    const data = await api('/chat');
    const container = one('[data-chat-messages]');
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 90;
    container.replaceChildren();
    if (!(data.items || []).length) empty(container, 'Aún no hay mensajes. Puedes escribir el primero.');
    for (const item of (data.items || [])) {
      const block = node('div', null, 'portal-chat-row');
      const stamp = node('time', date(item.created_at));
      block.append(node('strong', item.author), stamp, node('p', item.body));
      if (state.user) {
        const report = node('button', 'Reportar', 'portal-backlink');
        report.type = 'button';
        report.style.marginLeft = '10px';
        report.addEventListener('click', () => reportContent('chat', item.id));
        block.append(report);
      }
      if (state.user && state.user.is_staff) {
        const remove = node('button', 'Eliminar mensaje', 'portal-backlink');
        remove.type = 'button';
        remove.style.marginLeft = '10px';
        remove.addEventListener('click', async () => {
          try { await api('/chat/' + item.id, 'DELETE'); await refreshChat(); }
          catch (error) { message(formatError(error), true); }
        });
        block.append(remove);
      }
      container.append(block);
    }
    if (scroll || nearBottom) container.scrollTop = container.scrollHeight;
  }
  function initChat() {
    visible('[data-chat-app]', Boolean(state.user));
    visible('[data-chat-login]', !state.user);
    if (!state.user) {
      message('El chat del portal requiere iniciar sesión.');
      return;
    }
    message('Chat conectado a la API. Los mensajes se actualizan cada 15 segundos.');
    refreshChat(true).catch(error => message(formatError(error), true));
    pulse(); status();
    window.setInterval(() => refreshChat().catch(error => message(formatError(error), true)), 15000);
    window.setInterval(() => { pulse(); status(); }, 60000);
    const form = one('[data-chat-form]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = one('[type=submit]', form);
      button.disabled = true;
      try {
        await api('/chat', 'POST', postForm(form));
        form.reset();
        await refreshChat(true);
        formStatus(form, '');
      } catch (error) { formStatus(form, formatError(error)); }
      finally { button.disabled = false; }
    });
  }

  function renderCatalog() {
    const wrap = one('[data-catalog-items]');
    const term = (one('[data-catalog-search]').value || '').toLocaleLowerCase('es');
    const selected = state.items.filter(item => ((item.name || '') + ' ' + (item.category || '')).toLocaleLowerCase('es').includes(term));
    wrap.replaceChildren();
    if (!selected.length) return empty(wrap, state.items.length ? 'No se encontraron objetos con ese nombre.' : 'No hay objetos activos disponibles para mostrar.');
    for (const item of selected) {
      const card = node('article', null, 'portal-catalog-item');
      const price = item.price_type ? String(item.price_type).replaceAll('_', ' ') : 'monedas';
      const hasPrice = item.price !== null && item.price !== undefined && String(item.price).trim() !== '';
      const amount = hasPrice && Number.isFinite(Number(item.price)) && Number(item.price) >= 0
        ? String(item.price) + ' ' + price : 'Precio no disponible';
      card.append(node('span', item.category || 'Otros'), node('h3', item.name || 'Objeto'), node('p', String(item.description || '').slice(0, 300)), node('strong', amount));
      wrap.append(card);
    }
  }
  // Actualizaciones periódicas solo para consultas de lectura: evita recargar
  // la página y no envía información de una cuenta autenticada.
  function watchPublicData(refresh) {
    window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 30000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh();
    });
  }
  function initCatalog() {
    const search = one('[data-catalog-search]');
    if (search) search.addEventListener('input', renderCatalog);
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const data = await api('/catalog');
        state.items = Array.isArray(data.items) ? data.items : [];
        message('Catálogo actualizado desde BBCL. Compras web desactivadas.');
        renderCatalog();
      } catch (error) {
        message(formatError(error), true);
        if (!state.items.length) empty(one('[data-catalog-items]'), 'Sin datos del catálogo hasta que la API esté disponible.');
      } finally { pending = false; }
    }
    refresh();
    watchPublicData(refresh);
  }
  function initRanking() {
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const data = await api('/ranking');
        const wrap = one('[data-ranking-list]');
        wrap.replaceChildren();
        put('[data-ranking-heading]', data.week
          ? (data.week.game || 'Minijuego') + ' · semana ' + data.week.number + '/' + data.week.year
          : 'Última clasificación disponible');
        if (!(data.items || []).length) empty(wrap, 'Aún no hay puntuaciones públicas para la última semana.');
        for (const item of (data.items || [])) {
          const entry = node('div', null, 'portal-rank-row');
          entry.append(node('b', '#' + item.position), node('strong', item.username), node('span', item.score + ' puntos'));
          wrap.append(entry);
        }
        message('Ranking actualizado desde la base de datos de BBCL.');
      } catch (error) { message(formatError(error), true); }
      finally { pending = false; }
    }
    refresh();
    watchPublicData(refresh);
  }

  async function loadNews() {
    const wrap = one('[data-news-feed]');
    const data = await api('/news');
    wrap.replaceChildren();
    if (!(data.items || []).length) empty(wrap, 'No se han publicado noticias en la API todavía.');
    for (const item of (data.items || [])) {
      const article = node('article');
      article.append(node('small', 'Publicado · ' + date(item.published_at)), node('h3', item.title), node('p', item.body));
      if (state.user && state.user.is_staff) {
        const remove = node('button', 'Eliminar noticia', 'portal-backlink');
        remove.type = 'button';
        remove.addEventListener('click', async () => {
          if (!window.confirm('¿Eliminar esta noticia?')) return;
          try { await api('/news/' + item.id, 'DELETE'); await loadNews(); }
          catch (error) { message(formatError(error), true); }
        });
        article.append(remove);
      }
      wrap.append(article);
    }
    message('Noticias consultadas desde la API del portal.');
  }
  function initNews() {
    visible('[data-news-editor]', Boolean(state.user && state.user.is_staff));
    const form = one('[data-news-form]');
    if (form) form.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await api('/news', 'POST', postForm(form));
        form.reset();
        formStatus(form, 'Noticia publicada.');
        await loadNews();
      } catch (error) { formStatus(form, formatError(error)); }
    });
    loadNews().catch(error => message(formatError(error), true));
  }

  session().then(() => {
    switch (kind) {
      case 'account': initAccount(); break;
      case 'forum': initForum(); break;
      case 'chat': initChat(); break;
      case 'catalog': initCatalog(); break;
      case 'ranking': initRanking(); break;
      case 'news': initNews(); break;
      default: message('Sección lista.');
    }
  }).catch(error => {
    message('No se pudo iniciar el portal: ' + formatError(error) + '. Revisa que Docker, Laravel y las migraciones estén activos.', true);
    // Los endpoints GET son públicos: si falla /session, consultar sin
    // autenticación y sin habilitar acciones protegidas de escritura.
    if (kind === 'catalog') initCatalog();
    if (kind === 'ranking') initRanking();
    if (kind === 'forum') initForum();
    if (kind === 'news') initNews();
  });
})();
