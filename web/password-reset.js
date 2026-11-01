/* Account recovery: fragment-held token never sent in Referer; no emulator token. */
(() => {
  'use strict';
  const select = name => document.querySelector(name);
  const state = {csrf: '', token: '', email: ''};
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  state.token = fragment.get('token') || '';
  state.email = fragment.get('email') || '';
  // Prevent a reset token from remaining in browser history / future referrers.
  if (window.location.hash) history.replaceState(null, '', window.location.pathname);

  const say = (text, bad = false) => {
    const el = select('[data-reset-status]');
    el.textContent = text;
    el.classList.toggle('ok', !bad);
    el.classList.toggle('error', bad);
  };
  async function api(path, payload) {
    const response = await fetch('/portal/' + path, {
      method: 'POST', credentials: 'same-origin',
      headers: {'Content-Type':'application/json', 'Accept':'application/json','X-CSRF-TOKEN': state.csrf},
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const issue = Object.values(data.errors || {}).flat()[0] || data.message || 'Error HTTP ' + response.status;
      throw new Error(issue);
    }
    return data;
  }
  function bind(form, endpoint, payload, afterSuccess) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button[type=submit]');
      button.disabled = true;
      try {
        const data = await api(endpoint, payload(new FormData(form)));
        say(data.message || 'Solicitud procesada.');
        form.reset();
        afterSuccess?.();
      } catch (error) { say(error.message || 'No fue posible realizar la solicitud.', true); }
      finally { button.disabled = false; }
    });
  }

  async function init() {
    try {
      const response = await fetch('/portal/session', {headers:{Accept:'application/json'},credentials:'same-origin'});
      if (!response.ok) throw new Error('API no disponible');
      const session = await response.json();
      state.csrf = session.csrf || '';
      if (!state.csrf) throw new Error('No se pudo iniciar una sesión segura');

      const withToken = Boolean(state.token && state.email && state.token.length <= 512);
      select('[data-request-box]').hidden = withToken;
      select('[data-new-password-box]').hidden = !withToken;
      if (withToken) {
        const form = select('[data-confirm-reset]');
        form.elements.email.value = state.email;
        bind(form, 'reset-password', values => ({
          email: state.email, token: state.token,
          password: values.get('password'),
          password_confirmation: values.get('password_confirmation'),
        }), () => {
          state.token = '';
          select('[data-new-password-box]').hidden = true;
        });
        say('Enlace reconocido. Introduce tu nueva contraseña.');
      } else {
        bind(select('[data-request-reset]'), 'forgot-password',
          values => ({ email: values.get('email') }));
        say('Escribe tu correo para solicitar un enlace de recuperación.');
      }
    } catch (error) {
      say('No fue posible conectar con la API de Laravel. ' + error.message, true);
    }
  }
  init();
})();