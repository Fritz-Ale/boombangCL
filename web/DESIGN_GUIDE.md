# Guía visual y de implementación — BoomBang CL

Esta guía concreta la opción **B: cambios aplicados al código**, no un prompt para generar una maqueta. El portal es un proyecto independiente de BoomBang.tv y no debe reproducir sus activos, personajes, logotipos ni pantallas oficiales sin permisos verificables.

## Identidad de videojuego social

La interfaz debe sentirse como un mundo para explorar: ambiente tropical, escenas reales del proyecto HTML5, ventanas de juego, botones reconocibles, paneles de comunidad y navegación clara.

El diseño usa una paleta limitada: turquesa (`#3bc2cf`), azul profundo (`#19384a`), arena (`#fff9ea`), naranja (`#ffa837`), coral (`#f77767`) y violeta (`#7763c8`). El texto debe mantener contraste suficiente con sus fondos.

## Reglas obligatorias

- No usar emojis del sistema operativo en textos, botones ni encabezados. Sustituirlos por iconografía vectorial o CSS original. El logo auxiliar de las páginas interiores se dibuja mediante CSS.
- No utilizar números correlativos decorativos en tarjetas, destinos, fases o etiquetas visuales. Las **métricas reales** (11 tareas implementadas de 20, fechas, cantidad de capturas) sí se muestran como información factual.
- Centrar las imágenes con `object-fit: contain` cuando una captura completa importa; no cortar personajes, avatares ni escenarios para llenar un contenedor.
- No presentar menús sin destino ni falsos botones para iniciar partidas, pagar, registrar usuarios o conectarse a salas. Todas las funciones no desplegadas deben indicarse como tales.
- Garantizar navegación mediante teclado, descripciones alternativas, controles con estado `aria-pressed`, foco visible y preferencia por movimiento reducido.
- Conservar los nombres, las rutas, el SEO y los enlaces internos. No introducir dependencias de registro ni secretos de Laravel en GitHub Pages.
- No descargar ni copiar recursos de BoomBang.tv. Antes de redistribuir los recursos heredados del repositorio, seguir `doc/PUBLIC_ASSET_REVIEW.md`, cuya revisión de permisos continúa pendiente.

## Rutas y componentes

**Portada:** `web/pro-home.html` es la fuente editorial. El compilador `web/scripts/build-professional-home.mjs` muestra el estado verdadero del proyecto. Los botones llevan a Mundo, Galería, Noticias y Avances.

**Explorador de escenarios:** `web/site-game.js` ofrece vistas de salas, islas y Golden Ring. Cambia capturas y textos alternativos, sin simular usuarios ni tráfico Socket.IO.

**Páginas interiores:** `web/site-game.css` establece el estilo tropical. `web/site-image-center.css` mantiene las imágenes completas y centradas. Las secciones informativas se generan desde `web/scripts/build-public-site.mjs` y `web/scripts/enhance-public-site.mjs`.

**Noticias y seguimiento:** leer hitos del archivo versionado `web/avance-data.json`, no inventar actividad de juego online. Mantener públicas las tareas faltantes y sus dependencias.

**Cuenta, foro y chat:** las vistas estáticas no admiten registro. El código Laravel del portal incorpora confirmación de correo, pero habilitarlo públicamente requiere SMTP/API de correo real, HTTPS, secretos, políticas de datos y pruebas completas.

## Validación previa a cada publicación

- `node --test web/tests/*.test.mjs` y comprobación de rutas/recursos en el compilador.
- Pruebas Laravel/MariaDB en GitHub Actions, incluyendo correo firmado, intentos de abuso y cuentas antiguas.
- `npm ci && npm run build` del cliente Phaser/Vue.
- Revisión de diseño en móvil y escritorio, enlaces del menú, centrado y contraste.
- Comprobación de que el último despliegue de GitHub Pages realmente ha finalizado.

El estado actual de una funcionalidad no se cambia a "completado" hasta contar con código, pruebas y, si corresponde, un servicio real desplegado.
