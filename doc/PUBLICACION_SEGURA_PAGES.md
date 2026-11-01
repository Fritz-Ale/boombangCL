# Publicación segura de BoomBang CL

## Arquitectura

- `main`: código principal del proyecto (incluye Laravel, Node.js y el cliente).
- `feature/portal-comunidad-noticias-2026`: mejoras y pruebas antes de fusionarlas.
- `gh-pages`: archivos estáticos actualmente publicados.
- GitHub Pages **no** ejecuta Laravel, MariaDB ni Socket.IO. No presentar registro, chat o multijugador como operativos allí sin un backend alojado y probado.

## Evitar conflictos de despliegue

**Elegir un único mecanismo de publicación activo.** No ejecutar a la vez el despliegue automático desde la rama `gh-pages` y un workflow independiente que invoque `actions/deploy-pages`.

### Opción conservadora: publicar desde rama

1. En **Settings → Pages**, seleccionar **Deploy from a branch**.
2. Seleccionar `gh-pages` y `/(root)`.
3. Comprobar que `gh-pages/index.html` existe.
4. Publicar solamente archivos estáticos revisados en esa rama.
5. No activar el workflow `.github/workflows/pages-avances.yml` mientras Pages use este mecanismo.

### Opción futura: GitHub Actions

Usarla únicamente después de decidir una migración de método de publicación y revisar el workflow. El workflow `pages-avances.yml` de la rama de desarrollo requiere la variable `ENABLE_PROGRESS_PAGES=true`; no habilitarla por accidente.

## Error 400: «in progress deployment»

El error indica que GitHub rechazó una nueva implementación mientras otra seguía marcada como activa. No demuestra por sí solo que el contenido del sitio esté dañado.

1. Consultar **Actions** y **Settings → Pages** para ver qué ejecución y qué fuente están activas.
2. Esperar a que termine una ejecución en curso antes de lanzar otra.
3. Revisar el estado de `https://fritz-ale.github.io/boombangCL/`.
4. Si persiste el bloqueo, recopilar ID de ejecución, error y hora para soporte; evitar eliminar la rama o pulsar **Unpublish site** como primera medida.

## Comprobaciones antes de publicar

- Existe `index.html` en la raíz del artefacto o de `gh-pages`.
- Enlaces internos, CSS, JavaScript e imágenes resuelven desde `/boombangCL/`.
- No se publican archivos `.env`, claves, base de datos, tokens ni código de servidor.
- La portada indica claramente que el juego multijugador todavía no está disponible, si ese sigue siendo su estado.
- Las pruebas de `web/tests/` pasan antes de fusionar cambios.
- Se verifica la web publicada **después** del despliegue, no solo el estado verde del workflow.

## Próximos hitos técnicos

1. Verificar la navegación y recursos del portal estático en móvil.
2. Probar registro, sesión, recuperación de contraseña y moderación contra Laravel real.
3. Probar el cliente Phaser/Vue con el servidor Socket.IO y base de datos.
4. Publicar funciones dinámicas solo cuando exista infraestructura compatible y pruebas de extremo a extremo.

Este documento es una guía operativa: no cambia por sí mismo ninguna configuración de GitHub Pages.
