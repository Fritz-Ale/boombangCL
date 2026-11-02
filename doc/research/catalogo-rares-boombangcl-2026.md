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
