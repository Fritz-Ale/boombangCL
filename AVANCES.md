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

## ¿Dónde ver el avance más reciente?

1. [Issue #2 — Hoja de ruta](https://github.com/Fritz-Ale/boombangCL/issues/2): marca casillas cuando las tareas se completen.
2. [PR #1 — Archivos y commits](https://github.com/Fritz-Ale/boombangCL/pull/1): muestra las incorporaciones reales sin alterar `main`.
3. [GitHub Actions — Pruebas](https://github.com/Fritz-Ale/boombangCL/actions): verifica el resultado de la ejecución más reciente.
4. [Panel visual `web/avance.html`](https://github.com/Fritz-Ale/boombangCL/blob/feature/portal-comunidad-noticias-2026/web/avance.html): permite filtrar etapas una vez servido por Nginx.

### Publicación de la página

La ruta del panel dentro del portal es `/avance.html`, una vez desplegada la versión de la rama. El repositorio es **privado**, y GitHub no tiene un sitio público de Pages verificado en este momento. Por eso **no anunciamos una URL pública inventada**. Puedes consultar este archivo Markdown directamente en GitHub con acceso a tu cuenta.

**Actualización del tablero:** para mantenerlo fiel a la realidad, cambiar el estado de `web/avance-data.json` al completar tareas y actualizar la issue #2. El navegador no usa ni almacena tokens privados de GitHub.
