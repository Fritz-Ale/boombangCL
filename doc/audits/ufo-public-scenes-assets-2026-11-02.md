# Diagnóstico verificable de UFO y áreas públicas — BoomBangCL

Fecha: 2026-11-02. Estado: **corrección de carga en rama de trabajo**, no prueba de navegador en vivo.

## Hallazgos

- `boombang_api.sql` contiene **12 áreas públicas**, incluidas UFO (ID 1), Ring (ID 2) y Area 51 (ID 67).
- La estructura `assets_data.assets_data_repeatable` de UFO tiene 3 recursos, entre ellos un fondo WebP.
- La auditoría de CI compara las referencias SQL con los nombres reales del ZIP histórico sin extraerlo: **12 de 12 fondos encontrados** en `api/public/uploads.zip`.
- `api/database/seeders/PublicScenesTableSeeder.php` contiene únicamente los registros básicos de UFO y Ring, sin sus `assets_data`. Un seed básico no equivale a restaurar el respaldo SQL.
- `docker-compose.yml` monta el volumen nombrado `api_uploads` en `/var/www/html/public/uploads`. El volumen puede estar vacío aunque `api/public/uploads.zip` exista o aunque se extraigan imágenes en una carpeta distinta del host.
- Encontrar archivos en el ZIP **no demuestra** que el navegador reciba un HTTP 200. Debe comprobarse el filesystem realmente servido, el valor de `APP_URL` y la URL de cada asset.

## Qué se corrige en el cliente

`PublicSceneLoader` ya no envía URLs vacías a Phaser ni intenta dibujar fondos, NPC u objetos cuando la textura no se cargó. Los vídeos con `?rev=...` son reconocidos correctamente. Si no hay un fondo utilizable, se emplea temporalmente un color neutro y se emite `public-scene-asset-warning` con ID de sala y clave del recurso. **El fondo neutro no sustituye la ilustración original.**

## Auditar recursos locales sin copiarlos

Desde la raíz del repositorio en macOS:

```bash
python3 scripts/audit_public_scene_assets.py --require-ufo
python3 scripts/install_public_scene_assets_local.py
```

Se genera `public-scene-assets-report.json` con metadatos y rutas. El primer comando verifica la presencia del fondo de UFO; el segundo solo muestra el alcance potencial de una instalación local. Ninguno modifica MySQL ni extrae imágenes.

## Preparar assets autorizados para desarrollo local (opcional)

**Solo cuando tengas autorización para usar estos gráficos.** El hecho de que una imagen esté dentro de un ZIP público no concede derechos de redistribución.

```bash
python3 scripts/install_public_scene_assets_local.py --install --acknowledge-rights
```

Esta operación copia únicamente recursos de área pública declarados en el SQL, valida rutas y extensiones, nunca sobrescribe archivos existentes, se bloquea si el entorno está configurado como producción y no despliega nada.

Si el servicio API se ejecuta con el volumen nombrado de Docker Compose, copiar archivos al host no basta: es necesario trasladarlos también al volumen **solo si se cuenta con autorización** y el contenedor está iniciado.

```bash
docker compose cp api/public/uploads/. api:/var/www/html/public/uploads/
```

No ejecutes este comando contra producción ni lo automatices sin resolver antes los permisos de uso de los assets.

## La causa de las URL incorrectas en Docker/Nginx

El Dockerfile del cliente compila Vue/Phaser y sirve `dist/` mediante Nginx, que no expone `/uploads` ni tiene reglas de proxy. Cuando el cliente se compilaba con `VITE_APP_ENV=local`, `PublicSceneLoader` solicitaba recursos relativos a ese Nginx, aunque las texturas existieran únicamente en el host Laravel. La corrección ahora usa `base_api_url`, enviado por Laravel, para fondos, NPC, flechas y objetos, y respeta rutas absolutas entregadas por la API.

**Requisito de despliegue:** configurar `APP_URL` de Laravel con la URL pública real de la API accesible desde el navegador (HTTPS en sitios HTTPS), y permitir los orígenes del cliente mediante las políticas CORS correspondientes. No basta una URL interna de Docker como `http://api`. La compilación del frontend por sí sola no verifica la conectividad con Laravel.

## Diagnóstico real del volumen Docker (sin modificar datos)

El nuevo comando Artisan inspecciona los archivos reales que Laravel sirve desde `public/uploads`, también cuando Docker monta el volumen `api_uploads`:

```bash
docker compose exec api php artisan game:audit-public-scene-assets --scene=1
docker compose exec api php artisan game:audit-public-scene-assets
```

También funciona fuera de Docker desde la carpeta `api`:

```bash
php artisan game:audit-public-scene-assets --scene=1
```

El comando muestra `APP_URL`, la ruta `public/` y el estado de los fondos. Devuelve error si faltan, están vacíos o existe una ruta no verificable. **No escribe ni extrae recursos ni modifica MySQL**. Aunque todos aparezcan como `OK`, falta verificar HTTP 200, HTTPS, CORS y la representación real de Phaser.

## Comprobación real antes de declarar solucionada UFO

1. Confirmar que la base de datos utilizada por el juego contiene `public_scenes.id=1` con `assets_data` y la referencia al fondo.
2. Verificar que el archivo está en el volumen o directorio que sirve Laravel, por ejemplo `/var/www/html/public/uploads/public-scene/ufo/assets/`.
3. Comprobar desde el navegador que la URL efectiva responde HTTP 200 y un tipo `image/webp` válido, sin bloqueos CORS o HTTPS.
4. Revisar la consola y Network: `public-scene-asset-warning`, errores `404`, de decodificación o de Phaser.
5. Entrar a UFO con dos jugadores y confirmar escenario, avatares, movimiento y eventos tras reingreso.

No se modificaron las imágenes originales, los datos de producción ni el contenido de la Mac.

## Historial y fuentes internas

- Script reproducible: `scripts/audit_public_scene_assets.py`
- Instalador opcional local: `scripts/install_public_scene_assets_local.py`
- Pruebas: `client/tests/public-scene-assets.test.cjs` y `scripts/tests/test_install_public_scene_assets_local.py`
- CI: `.github/workflows/public-scene-asset-loading.yml`
- PR independiente: https://github.com/Fritz-Ale/boombangCL/pull/17

**Nota de seguridad:** El SQL histórico del repositorio también contiene tablas ajenas a escenas, incluidos registros de claves de API cifradas. Antes de publicar o replicar respaldos, auditar datos sensibles y rotar credenciales reales cuando corresponda. No exponer el SQL directamente desde el hosting.
