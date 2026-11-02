/* BoomBangCL · navegación y mejoras progresivas sin librerías externas */
(() => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.getElementById('main-nav');
  const currentFile = location.pathname.split('/').pop() || 'index.html';

  if (nav) {
    // Señalar la página actual a lectores de pantalla en todas las plantillas.
    nav.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const file = href.split('#')[0];
      if (file && file === currentFile && !href.includes('#')) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  if (menuButton && nav) {
    const close = (restoreFocus = false) => {
      const wasOpen = nav.classList.contains('open');
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menú');
      if (restoreFocus && wasOpen) menuButton.focus();
    };

    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open) nav.querySelector('a')?.focus();
    });

    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        event.preventDefault();
        close(true);
      }
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) close();
    });
    // Evitar un menú móvil abierto al pasar a escritorio y volver a móvil.
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) close();
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // No ocultar el contenido si el navegador no soporta IntersectionObserver
  // o el usuario solicita movimiento reducido.
  const items = [...document.querySelectorAll('[data-reveal]')];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (items.length && 'IntersectionObserver' in window && !reducedMotion) {
    try {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px 50px 0px' });
      items.forEach(item => observer.observe(item));
      document.documentElement.classList.add('js-ready');
    } catch (_) {
      document.documentElement.classList.remove('js-ready');
    }
  }
})();
