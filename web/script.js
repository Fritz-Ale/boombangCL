/* Navegación, footer y apariciones progresivas · sin dependencias */
(() => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.getElementById('main-nav');
  if (menuButton && nav) {
    const desktop = window.matchMedia('(min-width: 761px)');
    const isOpen = () => menuButton.getAttribute('aria-expanded') === 'true';
    const close = ({ restoreFocus = false } = {}) => {
      if (!isOpen()) return;
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menú');
      if (restoreFocus) menuButton.focus();
    };
    const open = () => {
      nav.classList.add('open');
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Cerrar menú');
    };

    menuButton.addEventListener('click', () => {
      if (isOpen()) close();
      else open();
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isOpen()) {
        const returnFocus = nav.contains(document.activeElement);
        close({ restoreFocus: returnFocus });
      }
    });
    document.addEventListener('click', event => {
      if (isOpen() && !nav.contains(event.target) && !menuButton.contains(event.target)) {
        close();
      }
    });
    document.addEventListener('focusin', event => {
      if (isOpen() && !nav.contains(event.target) && !menuButton.contains(event.target)) {
        close();
      }
    });
    const onBreakpoint = () => close();
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else desktop.addListener?.(onBreakpoint);
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const items = document.querySelectorAll('[data-reveal]');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  if (items.length && 'IntersectionObserver' in window && !reducedMotion) {
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
    // Evitar contenido oculto si el navegador deja de entregar eventos de intersección.
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        document.documentElement.classList.remove('js-ready');
        observer.disconnect();
      }
    });
  }
})();
