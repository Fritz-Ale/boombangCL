# 📊 Avances de BoomBang CL

> **Estado: en desarrollo (PR #1 en borrador).** Los cambios del portal aún no están en `main` ni se ha verificado un despliegue público del videojuego.

Este es el panel de seguimiento para consultar desde **GitHub, incluido el teléfono**. Se complementa con el tablero visual en `web/avance.html`, que se incorpora al sitio cuando se construya la imagen web de la rama.

[**🗺️ Hoja de ruta con casillas de verificación**](https://github.com/Fritz-Ale/boombangCL/issues/2) · [**🔀 Cambios propuestos / PR #1**](https://github.com/Fritz-Ale/boombangCL/pull/1) · [**🧪 Pruebas de GitHub Actions**](https://github.com/Fritz-Ale/boombangCL/actions) · [**🌴 Código de la página de avances**](https://github.com/Fritz-Ale/boombangCL/blob/feature/portal-comunidad-noticias-2026/web/avance.html)

## Estado resumido

| Indicador | Estado |
|:--|:--|
| Panel de avances | ✅ Implementado en rama de desarrollo |
| Tareas de esta hoja de ruta | **11 de 20 implementadas en código (55%)** |
| Tareas todavía pendientes | **9** |
| Última prueba automatizada verificada (31-10-2026, Chile) | ✅ **12 pruebas y 57 aserciones** de Laravel y MariaDB |
| Rama principal `main` | Sin fusionar los cambios de la PR #1 |
| Lanzamiento público | ⏳ Pendiente; no existe URL de producción verificada |

**El 55 % corresponde solo a un conteo de tareas del panel**, sin ponderación por esfuerzo. No representa la terminación del videojuego ni el porcentaje de preparación para producción. Los enlaces de GitHub permiten verificar resultados más recientes: el estado de las pruebas en esta tabla es una fotografía histórica, no una lectura en vivo.

## 🌴 Experiencia web

| Función | Estado |
|:--|:--|
| Portada tropical y diseño adaptable | ✅ Implementado en PR |
| Comunidad, noticias y ayuda | ✅ Implementado en PR |
| Catálogo en modo lectura | ✅ Implementado en PR |
| Clasificación semanal | ✅ Implementado en PR |

## 💬 Comunidad

| Función | Estado |
|:--|:--|
| Registro, login y sesiones | ✅ Implementado en PR |
| Foro, chat y noticias con API | ✅ Implementado en PR |
| Solicitudes de amistad y clanes del portal | ✅ Implementado en PR |
| Reportes y moderación | ✅ Implementado en PR |
| Integrar amistades y clanes dentro del cliente Phaser | ⏳ Pendiente |

## 🛡️ Seguridad y calidad

| Función | Estado |
|:--|:--|
| Recuperación de contraseñas de un solo uso | ✅ Código implementado; correo real pendiente |
| Contador interno de jugadores reales, sin bots | ✅ Código implementado; requiere servidor y secreto configurado |
| Pruebas automáticas de PHP, JS, Nginx y MariaDB | ✅ Aprobadas en ejecución verificada |
| Verificación de correo y antispam avanzado | ⏳ Pendiente |
| Privacidad, retención de datos y procedimientos finales | ⏳ Pendiente |

## 🚀 Lanzamiento

| Función | Estado |
|:--|:--|
| Proveedor real de email y dominio remitente | ⏳ Pendiente |
| Dominio HTTPS y secretos de producción | ⏳ Pendiente |
| Pruebas completas del cliente multijugador y todos los contenedores | ⏳ Pendiente |
| Revisión de licencias y publicación | ⏳ Pendiente |
| Decisión de VIP/pagos con seguridad transaccional | ⏳ Pendiente; pagos web desactivados |
| Revisión y fusión de la PR #1 | ⏳ Pendiente |

## 📱 Vista previa descargable sin publicar el proyecto

Desde GitHub (incluido el móvil) puedes obtener una versión de **solo el panel de avances**, sin habilitar Pages ni compartir el repositorio:

1. Abre [GitHub Actions · Portal web - chequeos](https://github.com/Fritz-Ale/boombangCL/actions/workflows/portal-checks.yml).
2. Entra en una ejecución de la **Pull Request #1** que haya terminado correctamente.
3. En la sección **Artifacts**, descarga `boombangcl-avances-vista-previa`.
4. Descomprime el ZIP y abre `index.html` en un navegador. El HTML contiene sus propios estilos, scripts y 20 tareas; **no necesita Docker, Laravel ni internet** para mostrar los indicadores. Los enlaces a GitHub sí requieren conexión y permiso de acceso al repositorio.

El archivo es una **fotografía editorial** de la rama, no un panel en vivo ni una web publicada. El artefacto se conserva durante **14 días** por ejecución y es accesible según los permisos del repositorio. No contiene secretos, cuentas, código del juego ni datos de usuarios.

## ¿Dónde ver el avance más reciente?

1. [Issue #2 — Hoja de ruta](https://github.com/Fritz-Ale/boombangCL/issues/2): marca casillas cuando las tareas se completen.
2. [PR #1 — Archivos y commits](https://github.com/Fritz-Ale/boombangCL/pull/1): muestra las incorporaciones reales sin alterar `main`.
3. [GitHub Actions — Pruebas](https://github.com/Fritz-Ale/boombangCL/actions): verifica el resultado de la ejecución más reciente.
4. [Panel visual `web/avance.html`](https://github.com/Fritz-Ale/boombangCL/blob/feature/portal-comunidad-noticias-2026/web/avance.html): permite filtrar etapas una vez servido por Nginx.

### Publicación de la página

La ruta del panel dentro del portal es `/avance.html`, una vez desplegada la versión de la rama. El repositorio es público y la rama independiente `gh-pages` contiene una portada real y 17 páginas estáticas. La URL de GitHub Pages es **https://fritz-ale.github.io/boombangCL/** cuando la publicación de la rama está activada en Settings → Pages. El juego multijugador y Laravel todavía no están desplegados públicamente.

**Actualización del tablero:** la issue #2 tiene las mismas 20 tareas que `web/avance-data.json`; al finalizar tareas, actualiza ambas. Una vez configurado GitHub Pages y activada expresamente la variable de repositorio `ENABLE_PROGRESS_PAGES=true`, un workflow de GitHub Actions generará un resumen mínimo de estado de PR, checks y issue, también con ejecución diaria. No expone el `GITHUB_TOKEN` al navegador ni muestra código privado. Sin Pages, el panel funciona con la fotografía editorial y los enlaces a GitHub.

### Corrección de navegación (31 de octubre de 2026)

La página «Inicio» de GitHub Pages ahora contiene la **portada real** en lugar del panel de avances y el menú enlaza a páginas HTML internas existentes. Las secciones que requieren Laravel muestran una explicación, sin formularios falsos. [Consultar las nueve dependencias de lanzamiento](https://fritz-ale.github.io/boombangCL/pendientes.html). Se mantienen **11 de 20** tareas con código y **9 pendientes**: reparar enlaces no completa automáticamente las tareas del backend.

### Galería de capturas del cliente HTML5

La [galería pública de BoomBang CL](https://fritz-ale.github.io/boombangCL/galeria.html) reúne **nueve capturas** ya existentes en `doc/screenshots/`: portada, lobby, salas, islas, personalización, Golden Ring, ranking y catálogo. Ofrece filtros por mundo, personajes y minijuegos, y permite abrir las imágenes originales. La navegación, el buscador, la portada y la página de comunidad enlazan a esta sección.

**Alcance:** son ilustraciones del repositorio, **no** prueba de partidas activas ni de que exista un servidor multijugador desplegado. La revisión de licencias y activos de terceros sigue pendiente; no se han añadido archivos externos nuevos. El código fuente que reconstruye esta página es `web/scripts/build-gallery.mjs`, coordinado por `web/scripts/enhance-public-site.mjs`. El despliegue sigue aislado del backend y de los formularios de cuentas.

### Bitácora pública de novedades del proyecto

La página [Noticias](https://fritz-ale.github.io/boombangCL/noticias.html#hitos-reales) incluye una bitácora con fechas y filtros (sitio web, código y pruebas). Se genera automáticamente desde `web/avance-data.json` mediante `web/scripts/build-milestones.mjs`, sin copiar noticias oficiales de BoomBang.tv y sin depender de una API pública ni mostrar información privada. La [portada](https://fritz-ale.github.io/boombangCL/) resume los tres hitos más recientes.

Esta bitácora documenta el **proyecto**, no eventos de un servidor de juego. Los enlaces se limitan a páginas internas conocidas o a referencias verificables de GitHub. `web/tests/news-milestones.test.mjs` verifica datos, salida HTML segura y navegación incluso sin JavaScript. Las tareas de lanzamiento siguen en **11 implementadas en código y 9 pendientes**.

### Rediseño editorial del sitio público

La web de BoomBang CL adopta una identidad visual profesional centrada en el contenido real, no en una plantilla de elementos decorativos. La portada usa una jerarquía tipográfica sobria, una paleta limitada de azul petróleo, verdes apagados y tonos cálidos, fotografías del cliente HTML5 ya presentes en el proyecto y llamadas a la acción verificables.

- Plantilla fuente: `web/pro-home.html`; CSS: `web/site-professional.css`; contador y últimas novedades desde el JSON versionado: `web/scripts/build-professional-home.mjs`.
- `web/scripts/enhance-public-site.mjs` aplica el estilo común a todas las rutas y genera la portada. El workflow de Pages lo compila sin abrir el backend ni insertar secretos.
- El sitio público publicado desde `gh-pages` mantiene enlaces a Comunidad, Galería, Noticias, Ayuda, Avances y las demás secciones.
- Las métricas de portada se refieren exclusivamente a la lista de **20 tareas del portal** (11 implementadas en código, 9 pendientes); no al desarrollo completo ni al estado en producción del juego.
- No se prometen jugadores en línea, cuentas registrables, compras ni partidas abiertas; la revisión de derechos de los recursos originales sigue pendiente.

**URL pública:** https://fritz-ale.github.io/boombangCL/

### Identidad de portal de juego inspirada en BoomBang.tv

El sitio público fue rediseñado para transmitir la estética de un **mundo social tropical**, sin copiar el código ni los elementos gráficos del sitio oficial. La portada incluye cielo turquesa, interfaz tipo ventana de juego, tarjetas con escenas reales del repositorio y un explorador de capturas de salas, islas y Golden Ring. El conjunto utiliza una nueva paleta y componentes propios en lugar de reproducir la web oficial.

**Código fuente:** `web/pro-home.html`, `web/site-game.css`, `web/site-game.js`. La generación sigue usando `web/scripts/build-professional-home.mjs` y `web/scripts/enhance-public-site.mjs`, y el workflow de GitHub Pages incluye los nuevos recursos. El mismo tema visual se aplica a las 19 rutas estáticas.

**Seguridad:** el explorador muestra archivos de `doc/screenshots/` y no consulta cuentas, API, servidores ni datos de jugadores. Se mantiene el estado real del proyecto en **11 de 20 tareas implementadas en código y nueve pendientes**. No hay botón funcional de partida multijugador hasta contar con una infraestructura verificada.

[Ver sitio público](https://fritz-ale.github.io/boombangCL/) · [Galería](https://fritz-ale.github.io/boombangCL/galeria.html) · [Avances](https://fritz-ale.github.io/boombangCL/avance.html)

### Capturas centradas y protección antispam (1 de noviembre de 2026)

La web pública utiliza `web/site-image-center.css` para centrar las imágenes completas de la portada, islas, avatares, minijuegos y galería. Se evitan recortes provocados por `object-fit: cover`, con ajustes específicos para móviles. El compilador de `gh-pages` incluye esta hoja de estilos al final del documento, y las pruebas comprueban ese orden en todas las páginas.

El backend Laravel usa ahora **límites de registro, inicio y recuperación tanto por IP como por dirección de correo/nombre de cuenta** (estos identificadores se usan convertidos en hash SHA-256 dentro de las claves de caché). Esto complementa CSRF, el campo antispam y la validación existente. Las pruebas automatizadas cubren el bloqueo de ráfagas, intentos de contraseña y honeypots. **No sustituye la verificación efectiva de correo**, que permanece pendiente junto con el proveedor de correo saliente real.

El inventario preliminar de capturas y la revisión de derechos pendiente se encuentran en [`doc/PUBLIC_ASSET_REVIEW.md`](../doc/PUBLIC_ASSET_REVIEW.md). La licencia de código consultada no basta para confirmar los permisos de publicación de cada recurso gráfico.


## Verificación de correo del portal (código, no envío productivo)

Las cuentas **creadas por el portal** desde esta versión requieren validar su dirección de email antes de publicar mensajes o participar en amistades y clanes. El registro envía una notificación con un **enlace firmado por Laravel**, que vence después de **60 minutos**. El destino de verificación es una ruta `/portal/verify-email/{id}/{hash}` protegida con firma, caducidad, coincidencia del correo y límites de uso. La verificación cambia `email_verified_at` en MariaDB; un segundo dispositivo o pestaña reconoce el estado actualizado mediante `GET /portal/session`.

Las rutas de escritura y lectura social bajo `portal.verified` exigen confirmación solo a usuarios marcados con `portal_email_verification_required_at`. Esta columna se añade como **nullable**, para no bloquear automáticamente cuentas antiguas del cliente BoomBang. Un usuario sin verificar puede iniciar sesión, cerrar sesión, consultar la cuenta y pedir otro enlace (`POST /portal/resend-verification`, limitado por IP y usuario), pero no publicar ni interactuar socialmente. Los enlaces manipulado, vencidos o destinados a bots/cuentas inactivas se rechazan. El portal no expone secretos en el navegador.

**Configuración antes del despliegue real:**
1. Ejecutar migraciones: `docker compose exec api php artisan migrate --force`.
2. Configurar un dominio propio **HTTPS** para la API y `APP_URL` público, además de `PORTAL_FRONTEND_URL` apuntando al portal (HTTPS en producción).
3. Configurar `MAIL_MAILER=smtp` o un proveedor transaccional válido y `MAIL_FROM_ADDRESS` de un dominio verificado, con secretos en el servidor.
4. Verificar entregabilidad, expiración y reenvío con una casilla de correo real. La opción `log` en desarrollo o `array` en pruebas **no envía mensajes a personas**.
5. Habilitar la página de cuenta **solo después** de completar HTTPS, cookies seguras, límites de registro, verificación y política de privacidad.

**Pruebas:** `PortalFeatureTest.php` valida registro, bloqueo de publicaciones, enlace firmado, vencimiento, alteración del enlace, reenvío limitado, cambio de sesión y compatibilidad de usuarios antiguos.

**Estado de hoja de ruta:** se completó la implementación base de verificación **en código**, pero «Verificación de correo y antispam reforzado» continúa pendiente como requisito de lanzamiento hasta demostrar entrega real y revisión de abusos. «Envío real de correos y dominio remitente» también permanece pendiente.


### Compilación del cliente Phaser/Vue en CI

El workflow `.github/workflows/portal-checks.yml` incorpora el trabajo `Cliente HTML5 Phaser + Vue`: ejecuta `npm ci --no-audit --no-fund` y `npm run build` en `client/` con Node.js 20 y exige `dist/index.html` junto con `dist/assets/`. Esto permite detectar errores de empaquetado, dependencias y recursos del cliente en cada pull request.

**Alcance:** verifica compilación, **no** partida real, conexión Socket.IO, inventario, logins ni comunicación con MariaDB. Es un avance parcial de la tarea «Pruebas integrales del juego y todos los contenedores», que permanece pendiente hasta que existan pruebas reales con los servicios levantados.


### Ajuste de interfaz y continuación de tareas (1 de noviembre de 2026)

Se ha adoptado el plan de rediseño directo al repositorio, recogido en [`web/DESIGN_GUIDE.md`](web/DESIGN_GUIDE.md). La portada elimina los números decorativos de las tarjetas, etiquetas y selector de salas, y los sustituye por elementos de CSS originales. El generador de páginas públicas elimina los emojis estándar de las vistas. Se mantiene la navegación, el explorador de capturas, las noticias, el buscador y el centrado de imágenes.

**Trabajo previo verificado:** [GitHub Actions #41269387592](https://github.com/Fritz-Ale/boombangCL/actions/runs/41269387592) comprobó la verificación de correo del portal en Laravel, las pruebas estáticas y la compilación Phaser/Vue. La implementación del correo existe en código, pero el **registro público sigue desactivado** hasta configurar un servicio de email real, dominio/HTTPS y probar la entrega. No se han agregado assets oficiales de BoomBang.tv ni se ha resuelto la revisión de licencias.

**Publicación:** los cambios del diseño también se han incorporado a la rama `gh-pages`, pero GitHub Pages ha devuelto un error de **despliegue simultáneo en curso**, incluso tras reintentar. No afirmar que la última versión está visible hasta que un despliegue finalice correctamente. [Ver acciones de Pages](https://github.com/Fritz-Ale/boombangCL/actions).

**Estado:** 11 de 20 tareas implementadas en código, nueve pendientes; la PR permanece en borrador y `main` no se ha modificado.
