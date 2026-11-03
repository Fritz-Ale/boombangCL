/* Interacciones originales para el portal estático BoomBang CL. */
(() => {
  const areaSearch = document.querySelector('[data-area-search]');
  if (areaSearch) {
    const cards = Array.from(document.querySelectorAll('[data-area]'));
    const empty = document.querySelector('[data-area-empty]');
    const normal = value => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    areaSearch.addEventListener('input', () => {
      const term = normal(areaSearch.value.trim());
      let visible = 0;
      cards.forEach(card => {
        const match = normal(card.dataset.area || '').includes(term);
        card.hidden = !match;
        if (match) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    });
  }
  const filters = Array.from(document.querySelectorAll('[data-news-filter]'));
  const news = Array.from(document.querySelectorAll('[data-news-category]'));
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.newsFilter;
    filters.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    news.forEach(item => item.hidden = category !== 'todos' && item.dataset.newsCategory !== category);
  }));
})();
