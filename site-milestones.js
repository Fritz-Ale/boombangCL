/* Progressive enhancement: versioned editorial cards remain readable without JS. */
(() => {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-milestone-filter]')];
  const cards = [...document.querySelectorAll('[data-milestone-kind]')];
  const count = document.querySelector('[data-milestone-count]');
  if (!buttons.length || !cards.length || !count) return;
  const render = category => {
    let visible = 0;
    for (const card of cards) {
      const shown = category === 'all' || card.dataset.milestoneKind === category;
      card.hidden = !shown;
      if (shown) visible++;
    }
    for (const button of buttons) {
      const active = category === button.dataset.milestoneFilter;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    }
    count.textContent = visible === 1 ? '1 hito documentado' : visible + ' hitos documentados';
  };
  buttons.forEach(button => button.addEventListener('click', () => render(button.dataset.milestoneFilter)));
  render('all');
})();
