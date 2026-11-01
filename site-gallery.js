/* Small, accessible gallery filter. All images are already present in the static site. */
(() => {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-gallery-filter]')];
  const cards = [...document.querySelectorAll('[data-gallery-category]')];
  const label = document.querySelector('[data-gallery-count]');
  if (!buttons.length || !cards.length || !label) return;
  function select(category) {
    let count = 0;
    for (const card of cards) {
      const show = category === 'all' || card.dataset.galleryCategory === category;
      card.hidden = !show;
      if (show) count++;
    }
    for (const button of buttons) {
      const active = button.dataset.galleryFilter === category;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    }
    label.textContent = count === 1 ? '1 captura' : count + ' capturas';
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.galleryFilter)));
  select('all');
})();
