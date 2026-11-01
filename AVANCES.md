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
