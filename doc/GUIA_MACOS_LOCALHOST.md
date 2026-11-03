# Arranque local de BoomBangCL en macOS

Este procedimiento usa el cliente Vue/Phaser, la API Laravel y el servidor Node.js originales del proyecto. No usa imágenes ni software de otros juegos.

## Requisitos
- Git, Docker Desktop, Node.js compatible con Vite 6, PHP >= 8.2 y Composer.
- Consultar `client/package.json`, `server/package.json` y `api/composer.json` antes de instalar.
- Elegir la rama `feature/portal-comunidad-noticias-2026` para probar mejoras aún no integradas a `main`.

## Base de datos aislada
1. Copiar `.env.example` a `.env` en la raíz y establecer una contraseña privada distinta de los valores de ejemplo en `BOOMBANG_LOCAL_DB_PASSWORD`.
2. Ejecutar `docker compose -f compose.local.yml up -d db`.
3. Comprobar `docker compose -f compose.local.yml ps`. La base de datos escucha únicamente en `127.0.0.1:3307`.
4. Las bases se crean vacías. Revisar primero el esquema SQL y migraciones antes de importar datos. No sobrescribir bases existentes.

## Configuración de servicios
- Copiar `api/.env.example` a `api/.env`; configurar `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_DATABASE=boombang_api`, `DB_USERNAME=root` y `DB_PASSWORD` con la clave local.
- Copiar `server/.env.example` a `server/.env`; configurar `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_DATABASE=boombang_api`, `DB_USER=root` y `DB_PASSWORD` con la misma clave.
- Copiar `client/.env.example` a `client/.env`; mantener `VITE_SERVER_URL=http://localhost:3000` y URL de API local.
- Alinear `EMULATOR_API_TOKEN` entre Laravel y Node; nunca publicarlo en el cliente ni en Git.
- Generar `APP_KEY` de Laravel con `php artisan key:generate` después de instalar dependencias.

## Arranque por terminales separadas
```sh
# API (tras instalar dependencias y preparar el esquema)
cd api && composer install && php artisan key:generate && php artisan serve --host=127.0.0.1 --port=8000
```
```sh
# Servidor multijugador
cd server && npm install && npm run dev
```
```sh
# Cliente web
cd client && npm install && npm run dev -- --host 127.0.0.1
```

Abrir `http://localhost:5173` (o la dirección que indique Vite). La API suele estar en `http://127.0.0.1:8000` y Socket.IO en `http://localhost:3000`. Los puertos pueden estar ocupados; confirmar la salida real de cada proceso.

## Verificaciones antes de considerar que funciona
- API Laravel arranca sin errores de migraciones ni conexión.
- Node conecta a MariaDB y atiende conexiones Socket.IO.
- Dos sesiones de navegador pueden autenticarse y entrar a una misma sala.
- Ambas ven movimiento, presencia, chat y salida de sala sin exponer credenciales.
- Inventario, islas y Golden Ring se revisan después de confirmar lo anterior.

## Limitaciones actuales
El archivo `docker-compose.yml` principal utiliza una red externa `proxy-network` y nombres de dominio virtuales. No es el camino recomendado para esta primera prueba local. `compose.local.yml` solo levanta MariaDB, no instala ni ejecuta los otros servicios. La existencia del código no garantiza que el juego ya sea funcional.
