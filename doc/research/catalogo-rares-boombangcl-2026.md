# Auditoría del catálogo de rares · BoomBangCL (02-11-2026)

## Origen y límites

- Catálogo oficial consultado: https://www.boombang.tv/catalog
- Clasificación actual anunciada por BoomBang: https://www.boombang.tv/es/news/actualizacion-%C2%A1llegan-el-bpad-celular-boomgram-el-escondite-y-las-nuevas-rarezas-959
- Subconjunto de fichas observadas en `api/database/reference/boombang_tv_2026_11.json`: 47 nombres con enlace a la categoría de origen.
- **No** es el catálogo completo; la web oficial contiene páginas dinámicas, ítems repetidos y datos de precio sujetos a cambios. Las denominaciones/rareza son información referencial que puede evolucionar.
- Una fotografía, sprite, atlas o animación de terceros **no queda autorizado para reutilización por el hecho de estar disponible en una URL**. No copiamos imágenes originales, no hacemos hotlink ni desplegamos una tienda clonada.
- Las fichas de referencia son **inactivas/no comprables**, tienen dimensiones nulas y no tienen sprites hasta que se comprueben derechos y medidas.

## Taxonomía

| Código | Etiqueta | Copias observadas |
| --- | --- | --- |
| singular | Singular (antiguo Único) | 1 |
| duo | Dúo | 2 |
| triada | Tríada | 3 |
| casi_unico | Casi único | 4-10 |
| excepcional | Excepcional | 11-25 |
| legendario | Legendario | 26-50 |
| reliquia | Reliquia | 51-100 |
| muy_rare | Muy rare | 101-250 |
| rare | Rare | más de 250 |
| ltd | LTD (limitado) | tirada limitada |
| evento | Evento | premios especiales |

`comun` es adicional y exclusivamente interno a BoomBangCL. **LTD, no LTC**, es el rótulo oficial para tiradas limitadas. Las rarezas basadas en copias en BoomBang.tv no equivalen a copias reales en BoomBangCL.

## Arquitectura de integración ya existente

`catalog_items` guarda `image` (miniatura), `spreadsheet` (textura), `atlas` (Phaser), `width`, `height`, `scale`, `map_size`, `price`, `price_type` y `is_purchasable`.
`user_catalog_items` lleva propiedad, colocación, rotación y datos asociados a las islas. La API usa `ShopController` para comprar y `PrivateSceneApiController` para colocar/retirar.

## Mejoras de esta rama

- Rarezas por código con etiqueta y cantidad de copias de referencia opcional, independientes de estrellas.
- Campo `is_reference_only`: se excluye de listados comprables y de checkout con monedas o Stripe.
- El panel administrativo permite registrar procedencia y estado de derechos de uso del arte.
- La tienda cliente puede filtrar artículos reales por nombre y rareza; evita inyectar HTML en descripciones.
- Compras simultáneas de la misma cuenta usan bloqueo transaccional del saldo.
- Colocación, retirada y modificación de posiciones verifican propiedad de la sala.
- Seeder optativo (NO añadido a `DatabaseSeeder`) para investigación con fichas inactivas.

Ejecutar únicamente después de una copia de seguridad y verificar migraciones en entorno de pruebas:

```bash
cd api
php artisan migrate --pretend
php artisan migrate
php artisan db:seed --class=CatalogReferenceSeeder
```

El seeder es opcional y no reemplaza arte ni altera precios de objetos comprables existentes.

## Para habilitar un nuevo objeto real

1. Obtener permiso/licencia del sprite, textura y atlas, o crear ilustración original.
2. Subir los archivos a un almacenamiento controlado por BoomBangCL (sin enlaces calientes).
3. Registrar medidas **reales** en píxeles (`width`, `height`), `scale` y celdas de colisión (`map_size`) derivadas del archivo.
4. Probar visualización Phaser en isla con cambios de zoom, orientación y colisiones.
5. Establecer precio interno legítimo, tipo de recompensa y límites de compra.
6. Cambiar de referencia a objeto real solo después de validar derechos y pruebas.
7. Verificar transacción compra → mochila → colocación → retiro → persistencia/reinicio.

## Trabajo pendiente y honestidad de validación

No se han inspeccionado ni importado todos los cientos de objetos del catálogo externo. No se han incorporado sus imágenes originales, ni se ha verificado su ancho o altura. No se ha migrado una base de datos real, ni se ha hecho una prueba multijugador real. Los precios externos son valores estimativos del mercado de otro servicio y no se sincronizan con el juego local.

## Auditoría reproducible de los recursos que YA están en la rama main

Se añadió `scripts/audit_catalog_assets.py`, que lee el SQL y el ZIP del propio repositorio sin descomprimir ni publicar imágenes. La auditoría GitHub Actions del 02-11-2026 (#41508823887) obtuvo:

- **183 registros** de `catalog_items` en `boombang_api.sql`: **161** de tipo `scene_item` (categoría de objeto) y **22** de tipo `user_decoration`; no todos son necesariamente mobiliario colocable.
- Las **183 miniaturas** y **183 texturas** referenciadas se localizaron dentro del ZIP existente. No se encontraron rutas de texturas faltantes.
- **0 atlas referenciados encontrados**: esto no demuestra que no exista ningún otro archivo de animación en el archivo ZIP, solo que los registros inspeccionados no tenían referencias resueltas a atlas.
- Solo **19 de los 183** registros ya tenían `width` y `height` simultáneamente configurados en el SQL, aunque el reporte midió dimensiones naturales de las imágenes localizadas mediante Pillow.
- En el SQL evaluado, **5** artículos están simultáneamente marcados como activos y comprables. Esto no prueba que se puedan comprar en un servidor vivo.

El resultado JSON (únicamente metadatos, rutas y tamaños, **sin imágenes**) queda como artefacto de GitHub Actions `existing-catalog-metadata` en https://github.com/Fritz-Ale/boombangCL/actions/runs/41508823887, disponible temporalmente según la retención del workflow.

**Aún no se copian dimensiones naturales a la BD**: para algunos objetos la imagen de catálogo y la textura Phaser son distintas, y `scale` y `map_size` deben verificarse sobre una isla real. La licencia del repositorio original contiene una reserva de derechos; la existencia local de recursos no sustituye un permiso de distribución pública.
