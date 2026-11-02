# Catálogo de objetos y rarezas — BoomBangCL

Este proyecto de comunidad independiente no replica ni redistribuye automáticamente
los gráficos de BoomBang.tv. La lista en
`api/database/reference/boombang_tv_2026_11.json` contiene 47 fichas de
**investigación, no inventario de objetos comprables**. Los nombres y categorías
se contrastan con https://www.boombang.tv/catalog y sus datos pueden variar.

## Integración técnica disponible

- Las rarezas se guardan en `catalog_items.rarity_code`, separadas de `stars`.
  `reference_copy_count` es un dato de referencia externa, no cuenta unidades en BoomBangCL.
- La tienda Vue permite buscar y filtrar por rareza.
- El servidor entrega la compra al inventario de la sesión sin recargar la isla.
- El motor Phaser admite una textura PNG/WebP, dimensiones originales `width/height`,
  escala, huella `map_size` y colisiones. Imágenes animadas/atlas requieren
  integración y comprobación específica antes de activarlas.
- La colocación, el movimiento y la retirada esperan confirmación de Laravel
  **antes** de cambiar el estado compartido del servidor.
- El administrador guarda clasificación, procedencia y evidencia de derechos.
  Las fichas de referencia tienen `is_reference_only = true` e `is_active = false`;
  **nunca se deben activar sin sprites completos y autorización de uso**.

## Aplicar y probar

```bash
cd api
php artisan migrate
php artisan db:seed --class=CatalogReferenceSeeder
```

El seeder es opcional, no forma parte de `DatabaseSeeder`. No publica
ni habilita compras y no altera entradas existentes con el mismo `sprite_name`.

### Importar dibujos originales o con licencia

Copia las imágenes propias o licenciadas a
`api/storage/app/catalog-import/assets/`; guarda allí el manifiesto,
por ejemplo `manifest.json`. El siguiente JSON es una **plantilla ficticia**;
los archivos mencionados no están incluidos:

```json
{
  "items": [{
    "name": "Palmera chilena",
    "sprite_name": "palmera_chilena",
    "image_file": "assets/palmera.png",
    "texture_file": "assets/palmera.png",
    "category_id": 1,
    "rarity_code": "comun",
    "price": 150,
    "price_type": "golden_coins",
    "map_size": [[0, 0]],
    "asset_rights_status": "original",
    "rights_evidence": "Obra creada para BoomBangCL; conservar autorización del autor."
  }]
}
```

```bash
cd api
php artisan catalog:import-authorized manifest.json --dry-run
php artisan catalog:import-authorized manifest.json
# Sólo cuando estén comprobadas la licencia, los sprites y las colisiones:
php artisan catalog:import-authorized NUEVO-manifest.json --activate
```

Los nombres de archivos deben permanecer dentro de
`storage/app/catalog-import`; no se permiten URLs externas,
rutas de escape de carpeta ni imágenes distintas de PNG/WebP. Las medidas
se extraen de los píxeles reales de cada textura, no se inventan.
El importador no sobrescribe `sprite_name` existentes. Si un artículo ya
fue importado desactivado, se habilita desde el administrador tras verificarlo;
no se vuelve a importar el mismo nombre.

**Nota:** esta primera versión valida dimensiones de imagen. Antes de publicar
objetos nuevos deben comprobarse también el centro de anclaje, la huella
de ocupación, superposición y orden de profundidad de Phaser, además de
pruebas multijugador reales y revisión de permisos.

## Pendientes

- Derechos de uso para gráficos originales del juego antiguo; sin ellos no se
  copiarán ni se servirán las imágenes de terceros.
- No existe un inventario completo y fiable de *todos* los objetos ni un atlas
  autorizado de BoomBang.tv dentro del proyecto.
- Prueba de compra en una base real con usuarios concurrentes.
- Prueba de colocación de objetos grandes, muebles animados y ediciones LTD.
- Unificar el trabajo de esta rama con los PR de seguridad y movimiento antes de fusionar.


## Completar las fichas de referencia con sprites autorizados

El comando anterior (`catalog:import-authorized`) es para **crear objetos nuevos**. Las
fichas del seeder (por ejemplo `research_bbtv_eggzilla`) ya existen; para ellas
se usa otro comando, `catalog:import-art`, que no crea duplicados y siempre
deja desactivadas las ventas:

```json
{
  "items": [{
    "sprite_name": "research_bbtv_eggzilla",
    "rights_status": "licensed",
    "rights_evidence": "Contrato o permiso identificable conservado por la administración",
    "image": "imagen-autorizada.png",
    "width": 120,
    "height": 140,
    "scale": 1,
    "map_size": [[0, 0], [1, 0]]
  }]
}
```

Las medidas de este JSON son **ficticias** y solo explican el formato. No se han
verificado medidas ni derechos de Eggzilla. El manifiesto debe estar en la misma
carpeta local que las imágenes o usar rutas relativas internas. Para atlas
animados se indican además `spreadsheet` (PNG/WebP) y `atlas` (JSON).

```bash
cd api
php artisan catalog:import-art /ruta/privada/manifest.json --dry-run
php artisan catalog:import-art /ruta/privada/manifest.json
```

Para un sprite PNG/WebP estático puedes indicar solamente `image`, o agregar `spreadsheet` sin `atlas` para conservar una textura de mayor resolución. Si incluyes `atlas` JSON, también debes incluir `spreadsheet` PNG/WebP. Para importar un atlas, indica **obligatoriamente** `width` y `height` del objeto o fotograma. La imagen de vista previa no define el tamaño del sprite; si no hay atlas, el importador toma los píxeles de `spreadsheet` antes de `image`. `scale` admite números entre 0.05 y 8, incluidos decimales. Phaser carga el primer fotograma disponible del atlas; una animación completa exige configuración adicional.

Las copias se guardan en `public/uploads/catalog/approved/` identificadas con SHA-256;
deben quedar respaldadas por documentación de licencia real. Este importador no
descarga recursos remotos ni publica objetos: tras verificar las imágenes,
la escala, las colisiones y la autorización en el administrador, se habilitan
`is_active` e `is_purchasable` individualmente. Un atlas puede dibujar su
primer fotograma; **no implica** animación completa del objeto original.

Ambos importadores funcionan sobre la base de datos de desarrollo después de
ejecutar las migraciones de esta rama. No se debe ejecutar ninguno sobre un
servidor público sin realizar una copia de seguridad y las pruebas de aceptación.


## Imágenes ya incluidas en el ZIP histórico (solo desarrollo local)

El proyecto tiene `api/public/uploads.zip`, pero no contiene la carpeta
`api/public/uploads/` descomprimida en GitHub. Además, Docker Compose utiliza
un volumen independiente `api_uploads` que puede estar vacío. Esto explica
miniaturas o texturas ausentes aun cuando estén presentes en el ZIP.

Antes de empezar, **verifica qué recursos tienes derecho a usar**. El ZIP
histórico no implica autorización para distribuirlos públicamente.

En tu clon **local** de Mac, sin desplegar:

```bash
# Inspeccionar qué archivos se podrían preparar (no crea archivos)
python3 scripts/install_catalog_assets_local.py

# Opcional, únicamente para revisar sprites en una copia local
python3 scripts/install_catalog_assets_local.py --install
```

La herramienta utiliza los archivos del ZIP que ya está en tu repositorio,
restringe tipos admitidos, comprueba rutas para evitar escapes, no sobrescribe
ficheros existentes y no modifica MySQL ni activa compras. No se ejecuta
automáticamente durante el build ni en Cloudflare. La instalación se bloquea
cuando `APP_ENV=production`.

Para pruebas Docker, el volumen `api_uploads` no recibe automáticamente lo
que haya en la carpeta de la Mac: hay que preparar y respaldar el contenido
local de manera controlada. Antes de una publicación, sustituye los gráficos
cuya licencia no esté acreditada por recursos propios o autorizados.
