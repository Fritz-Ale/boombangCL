# Revisión de BoomBangCL — 3 de noviembre de 2026

## Sincronización

Origen verificado: https://github.com/Fritz-Ale/boombangCL.
La rama de trabajo `feature/portal-comunidad-noticias-2026` partía de `11443b58`:
187 commits detrás de su rama remota y 202 detrás de `origin/main`.
Se integró `origin/main` (`abcfebae`) mediante fast-forward, que incluye la rama remota.
Se conservó el trabajo previo con `git stash push --include-untracked` y se reaplicó.
El stash `respaldo-local-antes-sincronizacion-2026-11-03` permanece como respaldo.
Cinco conflictos resueltos: administración de usuarios, autenticación del emulador,
rutas API y cargadores de escenas públicas y privadas. Se preservaron traducciones,
limitación de solicitudes y filtrado de recursos inactivos junto con las protecciones remotas.
Los cambios locales previos restantes no se consideran revisados para publicación.
No se deben publicar respaldos de entorno ni volcados de datos con información privada.

## Resultado por bloque

| Bloque | Resultado | Límite o pendiente |
| --- | --- | --- |
| Servidor Node / Socket.IO | Pruebas de transporte, salas, concurrencia, compras, inventario, perfiles y comandos correctas | No sustituye una partida real con varios jugadores |
| Cliente Vue / Phaser | Pruebas correctas y compilación de producción completa | Persisten avisos de tamaño de bundles, importaciones mixtas y referencia de Line Awesome |
| API Laravel | 363 archivos PHP sin errores sintácticos; cinco scripts independientes pasan | PHPUnit: 2 pruebas completadas, 22 errores por conexión rechazada a la BD local; avisos de deprecación |
| Web / portal | 29 pruebas correctas tras corregir exportación de CSS | Funcionalidad dinámica del portal pendiente de ejecutar con BD de pruebas |
| Launcher Electron | Corregida ruta del icono Windows a assets/favicon.ico | Instalador Windows no generado ni probado |
| Docker / datos | API, servidor, cliente, web y MariaDB activos; BD healthy | API sin PHPUnit por instalación --no-dev; imágenes existentes no reconstruidas |
| Recursos de salas | Auditoría Laravel: fondos de las 11 áreas activas presentes y legibles | Falta validación visual HTTP/CORS/Phaser |

Las pruebas Node disponibles suman 111: 82 de servidor/cliente y 29 de web.
Las primeras pasaron en la ejecución integrada; las cuatro fallas de web correspondían
al mismo CSS ausente del exportador y se corrigieron; las 29 de web pasaron después.

## Correcciones de esta revisión

- Añadir `reference-design.css` a la exportación pública y a la imagen Docker web.
- Corregir el icono del instalador: la antigua ruta `web/public/favicon/…` no existe.
- Mover `maxParallelFileOps` al nivel de opciones de entrada de Rollup; antes se ignoraba.
- Ajustar el test de inicio de Laravel para validar su redirección configurada.
- Mantener autenticación interna también en desarrollo y probar ese comportamiento.
- Ignorar copias `.env.backup*` para evitar incluir credenciales al preparar cambios.

## Observaciones restantes

`CLAUDE.md` está desactualizado: web existe como portal estático Nginx, hay workflows CI
y pruebas Node. No debe interpretarse su descripción de web ausente como estado actual.
Docker advierte que `API_BASSET_DEV_MODE` y `SERVER_APP_ENV` no están definidos y que
la clave `version` es obsoleta. No se modificaron valores de entorno sin conocer el destino.
La suite Laravel necesita una base de pruebas accesible y preparada; no se ejecutaron
migraciones ni restauraciones sobre la base de jugadores para resolver este problema.
Los contenedores activos no garantizan que el cliente estático sirva los cambios recién
compilados: hace falta reconstruir las imágenes para desplegarlos.
