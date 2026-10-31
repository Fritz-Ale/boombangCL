(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const add = (parent, tag, content, cls) => {
    const el = document.createElement(tag);
    el.textContent = content == null ? '' : String(content);
    if (cls) el.className = cls;
    parent.appendChild(el);
    return el;
  };
  const state = { csrf: '', user: null };
  const status = (message, error = false) => {
    const box = $('[data-social-status]');
    box.textContent = message;
    box.classList.toggle('error', error);
    box.classList.toggle('ok', !error);
  };
  async function call(path, method = 'GET', data) {
    const response = await fetch('/portal' + path, {
      method, credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(method === 'GET' ? {} : {'Content-Type': 'application/json', 'X-CSRF-TOKEN': state.csrf}) },
      ...(data === undefined ? {} : {body: JSON.stringify(data)}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Object.values(body.errors || {}).flat()[0] || body.message || 'Error ' + response.status);
    return body;
  }
  function bind(formSelector, endpoint, done) {
    const form = $(formSelector);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('button[type=submit]');
      submit.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        await call(endpoint, 'POST', data);
        form.reset();
        status('Cambios guardados correctamente.');
        await done();
      } catch (error) { status(error.message, true); }
      finally {submit.disabled = false;}
    });
  }
  function action(parent, label, fn) {
    const button = add(parent, 'button', label, 'portal-backlink');
    button.type = 'button';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await fn(); status('Cambios guardados.'); }
      catch (error) { status(error.message, true); }
      finally { button.disabled = false; }
    });
    return button;
  }
  async function friendships() {
    const response = await call('/friends');
    const list = $('[data-friend-list]');
    list.replaceChildren();
    if (!(response.items || []).length) add(list, 'p', 'Aún no tienes solicitudes o amistades.', 'portal-empty-state');
    for (const friend of response.items || []) {
      const row = add(list, 'div', '', 'portal-member-box');
      add(row, 'strong', friend.username);
      add(row, 'p', friend.status === 'accepted' ? 'Amistad confirmada' : (friend.direction === 'sent' ? 'Solicitud enviada' : 'Solicitud recibida'));
      if (friend.status === 'pending' && friend.direction === 'received') {
        action(row, 'Aceptar', async () => { await call('/friends/' + friend.id + '/accept', 'PATCH', {}); await friendships(); });
      }
      action(row, friend.status === 'accepted' ? 'Eliminar amistad' : 'Cancelar o rechazar', async () => { await call('/friends/' + friend.id, 'DELETE'); await friendships(); });
    }
  }
  async function clans() {
    const data = await call('/clan');
    const current = $('[data-clan-detail]');
    current.replaceChildren();
    $('[data-clan-create]').hidden = !!data.clan;
    $('[data-clan-owner]').hidden = !data.clan || !data.clan.owner;
    $('[data-clan-leave]').hidden = !data.clan || data.clan.owner;
    if (data.clan) {
      add(current, 'h3', data.clan.name);
      add(current, 'p', data.clan.description || 'Clan sin descripción');
      add(current, 'h3', 'Miembros');
      for (const member of data.clan.members) add(current, 'p', '👤 ' + member.username);
    }
    const invites = $('[data-clan-invites]');
    invites.replaceChildren();
    if (!(data.invites || []).length) add(invites, 'p', 'No tienes invitaciones pendientes.', 'portal-empty-state');
    for (const invitation of data.invites || []) {
      const box = add(invites, 'div', '', 'portal-member-box');
      add(box, 'strong', invitation.name);
      action(box, 'Aceptar', async () => { await call('/clan/invitations/' + invitation.id + '/respond', 'POST', {accept: true}); await clans(); });
      action(box, 'Rechazar', async () => { await call('/clan/invitations/' + invitation.id + '/respond', 'POST', {accept: false}); await clans(); });
    }
  }
  async function init() {
    try {
      const session = await call('/session');
      state.csrf = session.csrf;
      state.user = session.user;
      $('[data-social-login]').hidden = !!state.user;
      $('[data-social-content]').hidden = !state.user;
      if (!state.user) { status('Inicia sesión para gestionar tus amigos y clanes.'); return; }
      await Promise.all([friendships(), clans()]);
      status('Amigos y clanes conectados con Laravel.');
      bind('[data-friend-form]', '/friends', friendships);
      bind('[data-clan-form]', '/clan', clans);
      bind('[data-invite-form]', '/clan/invite', clans);
      $('[data-clan-leave]').addEventListener('click', async () => {
        try { await call('/clan/leave', 'POST', {}); await clans(); status('Saliste del clan.'); }
        catch (error) { status(error.message, true); }
      });
      $('[data-disband]').addEventListener('click', async () => {
        if (!window.confirm('¿Disolver el clan y eliminar todas las invitaciones?')) return;
        try { await call('/clan', 'DELETE'); await clans(); status('Clan disuelto.'); }
        catch (error) { status(error.message, true); }
      });
    } catch (error) { status('No se pudo iniciar: ' + error.message, true); }
  }
  init();
})();