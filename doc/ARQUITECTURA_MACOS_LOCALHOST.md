# Arquitectura y preparación local de BoomBangCL en macOS

## Alcance de la imagen de referencia (noviembre de 2026)

La imagen entregada representa: cliente Vue/Phaser, servidor Node.js/Socket.IO, API Laravel/Backpack, base de datos MariaDB, Docker, MySQL Workbench y Electron. Es un diagrama conceptual, no una confirmación de servicios activos.

## Comprobación en el repositorio

| Componente | Evidencia | Requisito para localhost |
| --- | --- | --- |
| Cliente Vue 3 + Phaser 3 | `client/package.json`: Vue ^3.5.13, Phaser ^3.87.0, Vite ^6 | Sí |
| Socket.IO + Node.js | `server/package.json`: Socket.IO ^4.8.1 | Sí |
| API Laravel | `api/composer.json`: Laravel ^12, PHP ^8.2, Passport y Backpack | Sí |
| MariaDB | `docker-compose.yml`: imagen mariadb:11 | Sí |
| Docker Compose | `docker-compose.yml` | Recomendado para base de datos |
| MySQL Workbench | No es dependencia de ejecución | Opcional |
| Electron | Launcher de escritorio separado | Opcional; no necesario para navegador |

**Precaución:** la imagen menciona Laravel 12, PHP 8.2+, Vue 3 y Phaser 3.87, coincidentes con las declaraciones de dependencias, pero la versión exacta instalada depende de los archivos lock y del entorno.

## Antes de probar en el MacBook

1. Instalar Git, Docker Desktop, Node.js compatible con Vite 6 y PHP/Composer si la API se ejecutará fuera de Docker. Usar versiones compatibles con los archivos lock.
2. Clonar `Fritz-Ale/boombangCL` y seleccionar la rama de desarrollo para revisar los cambios sin modificar `main`.
3. Crear los archivos locales `.env`, `client/.env`, `server/.env` y `api/.env` desde sus respectivos `.env.example`. No subir secretos ni credenciales al repositorio.
4. Revisar puertos: cliente Vite 5173, Node 3000, Laravel 8000; el Docker Compose existente expone también el portal web 8001.
5. **No ejecutar directamente `docker compose up` sin revisar configuración**: el Compose actual requiere una red Docker externa `proxy-network`, hosts virtuales y variables de entorno pensadas para otro despliegue. Además, el servicio `client` no publica un puerto en el host. Conviene preparar un perfil local específico.
6. Preparar MariaDB y verificar si las migraciones, semillas o el respaldo SQL son adecuados antes de importarlos. No sobrescribir datos existentes.
7. Arrancar API y servidor Socket.IO; después abrir el cliente Vite en el navegador y comprobar registro, entrada a sala, dos usuarios, chat y movimiento.

## Instalaciones de ChatGPT: necesarias y opcionales

Para revisar y modificar el código desde ChatGPT, **GitHub conectado** es suficiente. No se necesita un plugin específico de Vue, Phaser, Laravel, MariaDB, Docker ni Electron para analizar archivos o proponer correcciones.

Los servicios reales del juego corren en el MacBook o en un servidor, no dentro de un plugin de ChatGPT. Una integración con herramientas de desarrollo puede facilitar revisiones, pero no sustituye Docker, Node.js, PHP ni la base de datos.

## Orden de validación

1. Comprobar dependencias, archivos de entorno y red de Docker.
2. Preparar un arranque local reproducible, sin dominios públicos ficticios.
3. Verificar conexión Laravel ↔ MariaDB y Node ↔ MariaDB.
4. Verificar cliente ↔ Socket.IO y autenticación.
5. Probar dos jugadores simultáneos en una misma sala; después islas, inventario y Golden Ring.

No se incorporarán imágenes ni elementos de Habbo: la referencia del juego es BoomBang, respetando derechos de terceros.
