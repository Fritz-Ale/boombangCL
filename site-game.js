/* Static and accessible screenshot selector: no game servers or user data. */
(() => {
  'use strict';
  const root = document.querySelector('[data-game-explorer]');
  if (!root) return;
  const image = root.querySelector('[data-game-scene-image]');
  const title = root.querySelector('[data-game-scene-title]');
  const description = root.querySelector('[data-game-scene-description]');
  const count = root.querySelector('[data-game-scene-count]');
  const buttons = [...root.querySelectorAll('[data-game-scene]')];
  if (!image || !title || !description || !count || buttons.length !== 3) return;

  const scenes = Object.freeze({
    salas: Object.freeze({
      src:'screenshots/sala-publica.png',
      alt:'Captura de una sala pública del cliente BoomBang HTML5',
      title:'Salas públicas',
      description:'Explora la apariencia de los espacios compartidos de BoomBang HTML5.',
      count:'SALAS',
    }),
    islas: Object.freeze({
      src:'screenshots/islas.png',
      alt:'Captura de islas y escenarios incluidos en BoomBang HTML5',
      title:'Islas',
      description:'Una muestra de los espacios que puedes construir dentro del cliente.',
      count:'ISLAS',
    }),
    ring: Object.freeze({
      src:'screenshots/golden-ring.png',
      alt:'Captura del minijuego Golden Ring incluido en BoomBang HTML5',
      title:'Golden Ring',
      description:'Captura del minijuego que forma parte del código del proyecto.',
      count:'GOLDEN RING',
    }),
  });

  function selectScene(key) {
    if (!Object.prototype.hasOwnProperty.call(scenes,key)) return;
    const scene = scenes[key];
    image.src = scene.src;
    image.alt = scene.alt;
    title.textContent = scene.title;
    description.textContent = scene.description;
    count.textContent = scene.count;
    for (const button of buttons) {
      const active = button.dataset.gameScene === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed',String(active));
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => selectScene(button.dataset.gameScene));
  }
  selectScene('salas');
})();
