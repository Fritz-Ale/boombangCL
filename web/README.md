# Portal web de BoomBang CL

Sitio **original** en español, responsivo y orientado a comunidades de juegos sociales. Toma como referencia únicamente las **categorías y patrones generales** de sitios como BoomBang.tv, pero no contiene una copia íntegra de su interfaz, textos, código ni recursos. Se mantienen los créditos del proyecto de base BoomBang HTML5.

## Páginas

| Ruta | Contenido |
| --- | --- |
| `index.html` | Portada tropical, experiencias, juego y acceso a secciones |
| `comunidad.html` | Directorio de áreas con buscador, sistemas sociales y espacios futuros |
| `noticias.html` | Tarjetas de novedades del desarrollo con filtro por categoría |
| `ayuda.html` | Guía de preparación de servicios, acceso local y preguntas frecuentes |

`styles.css` y `script.js` conservan los estilos y comportamientos originales de la portada. `portal.css` y `portal.js` implementan los estilos y filtros adicionales del portal.

Las imágenes se utilizan desde `doc/screenshots/` del **propio repositorio** y se copian al contenedor web al construir la imagen.

## Ejecutar en Mac

Desde la raíz del repositorio, con Docker Desktop instalado y la red de proxy previamente configurada:

```sh
docker compose up --build web
```

Abre **http://localhost:8001**.

Para entrar al cliente HTML5 se requieren la API, el servidor Node.js, la base de datos y la configuración de dominios locales descrita en el `README.md` principal. La dirección de desarrollo es **http://play.boombang.com**; no representa un despliegue público.

## Estado de las funciones

- **Disponible como interfaz estática:** navegación entre páginas, sitio adaptable a móviles, imágenes del proyecto, buscador local de áreas, filtro de novedades, menú móvil y secciones informativas.
- **Pendiente de integración real:** registro, inicio de sesión, invitado, conteos de jugadores, actividad reciente, catálogo web, noticias desde backend, rankings en vivo, foro, clan, contenidos comunitarios y pagos/VIP.
- **No se muestran estadísticas inventadas:** los nombres de salas son ejemplos de navegación y todos los indicadores no conectados se etiquetan como tales.
- **Seguridad:** no recopilar credenciales ni conectar formularios de acceso a un backend sin revisar autenticación, CSRF, privacidad y validación.

## Derechos y alcance

El portal es una implementación independiente y **no está afiliado con BoomBang.tv**. No se han descargado ni copiado sus archivos, hojas de estilo, scripts, imágenes o textos. Los recursos del código base se mantienen bajo las condiciones de `../LICENSE.txt`; revisar dichas condiciones antes de su distribución pública.
