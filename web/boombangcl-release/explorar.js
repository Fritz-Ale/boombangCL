/* BoomBangCL: catalog public read-only, without generated entries or credentials. */
(() => {
  'use strict';
  const root = document.getElementById('catalog-items');
  const status = document.getElementById('catalog-status');
  const search = document.getElementById('filter');
  const refreshButton = document.getElementById('refresh');
  if (!root || !status || !search || !refreshButton) return;

  const state = { items: [], connected: false, busy: false, updatedAt: null };
  let controller = null;
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.dataset.state = isError ? 'offline' : 'ready';
  };
  const stringify = value => typeof value === 'string' ? value : '';
  const normal = value => stringify(value).toLocaleLowerCase('es-CL');
  const money = item => {
    const price = item.price;
    if (price === null || price === undefined || price === '' || !Number.isFinite(Number(price)) || Number(price) < 0) return 'Precio no disponible';
    return `${Number(price)} ${stringify(item.price_type).replaceAll('_', ' ') || 'monedas'}`;
  };

  function render() {
    const q = normal(search.value).trim();
    root.replaceChildren();
    const filtered = state.items.filter(item => normal(item.name + ' ' + item.category).includes(q));
    if (!filtered.length) {
      const notice = document.createElement('p');
      notice.textContent = !state.connected
        ? 'Los artículos solo aparecerán cuando el servidor real esté disponible.'
        : state.items.length
          ? 'No hay objetos que coincidan con la búsqueda.'
          : 'La API funciona, pero no hay objetos activos.';
      root.append(notice);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of filtered) {
      const card = document.createElement('article');
      card.className = 'catalog-item';
      const category = document.createElement('p');
      category.textContent = item.category || 'Sin categoría';
      const title = document.createElement('h3');
      title.textContent = item.name || 'Sin nombre';
      const description = document.createElement('p');
      description.textContent = item.description.slice(0, 220);
      const price = document.createElement('p');
      price.className = 'catalog-price';
      price.textContent = money(item);
      card.append(category, title, description, price);
      fragment.append(card);
    }
    root.append(fragment);
  }

  async function load() {
    if (state.busy) return;
    state.busy = true;
    refreshButton.disabled = true;
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 11000);
    if (!state.connected) setStatus('Comprobando el catálogo público de BoomBangCL…');
    try {
      const response = await fetch('/portal/catalog', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok || !(response.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
        throw new Error('La API del catálogo no está disponible.');
      }
      const data = await response.json();
      if (data.available !== true || !Array.isArray(data.items)) throw new Error('La respuesta del catálogo no es válida.');
      state.items = data.items.filter(item => item && typeof item === 'object').map(item => ({
        name: stringify(item.name), category: stringify(item.category),
        description: stringify(item.description), price: item.price,
        price_type: stringify(item.price_type),
      }));
      state.connected = true;
      state.updatedAt = new Date();
      const time = state.updatedAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      setStatus(`Catálogo conectado · ${state.items.length} objetos · Actualizado a las ${time}`);
    } catch (error) {
      // Stale data are not presented as current when the origin is unreachable.
      state.connected = false;
      state.items = [];
      setStatus('Catálogo temporalmente fuera de línea. Falta conectar o iniciar el servidor Laravel; las imágenes de referencia siguen disponibles.', true);
    } finally {
      clearTimeout(timeout);
      controller = null;
      state.busy = false;
      refreshButton.disabled = false;
      render();
    }
  }

  refreshButton.addEventListener('click', load);
  search.addEventListener('input', render);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!state.updatedAt || Date.now() - state.updatedAt.getTime() > 30000)) load();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') load();
  }, 30000);
  load();
})();
