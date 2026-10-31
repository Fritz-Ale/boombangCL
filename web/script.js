(() => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.getElementById('main-nav');
  if (menuButton && nav) {
    const close = () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menú');
    };
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) close();
    });
  }
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  const items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-ready');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 50px 0px' });
    items.forEach(item => observer.observe(item));
  }
})();