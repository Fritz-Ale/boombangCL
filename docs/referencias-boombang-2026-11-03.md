# Auditoría de referencias BoomBang para BoomBangCL — 2026-11-03

## Procedencia y alcance
Este documento resume **dos capturas JSON de inspección visual y un HAR de red** aportados por el responsable de BoomBangCL. Es un inventario de referencia para planificar la integración, **no** una transferencia de derechos, una implementación completa ni una copia de los recursos originales.

- Portada: `https://www.boombang.tv/es/` (captura 2026-11-03T03:56:10.560Z): 47 entradas de imágenes, 19 fondos, 45 enlaces/botones, 89 recursos y 12 registros de fuentes.
- Cliente: `https://www.boombang.tv/es/game` (captura 2026-11-03T04:00:29.640Z): viewport 1012×656 con DPR 2; 40 estilos inspeccionados, 21 recursos, 4 assets, **0 imágenes en DOM, 0 canvas detectados** en el instante de inspección. Los datos **no** acreditan que se haya cargado una partida o sus escenas.
- HAR: 543 transacciones, 482 pares host/ruta distintos, 531 respuestas HTTP 200, 5 respuestas 204, 2 respuestas 304, 2 redirecciones 302, 2 upgrades 101 y 1 respuesta 401. Son observaciones de esa sesión, no pruebas automáticas del proyecto.

## Inventario de subsistemas observado en HAR
Se citan **rutas de ejemplo sin dominio, consultas ni credenciales**. No descargues ni distribuyas automáticamente estos assets; verifica titularidad, licencia y permisos antes de su uso.

| Subsistema | Ejemplo de ruta capturada | Decisión técnica |
| --- | --- | --- |
| Brújula y HUD | `/betahtml5/images/baseChat/brujula.png` | Revisar equivalencia visual, ubicación y comportamiento de salida/navegación. |
| B-Pad | `/html_static_prod/images/bpad/bpad.png` | Diseñar flujos dentro del cliente actual (no copiar recursos sin permiso). |
| Tienda y menús | `/html_static_prod/images/baseChat/menubuttons/shop.png` | Conectar apertura de catálogo al estado de UI y al catálogo autorizado por API. |
| Fichas/emociones de kekos | `/html_static_prod/images/ficha/...` | Auditar estados, animaciones y atlas usados por avatares. |
| Minijuegos | `/html_static_prod/images/games/...` | Verificar escena, sprites, sonidos, sincronización y colisiones. |
| Objetos del catálogo | `/12052026_prod/dswmedia/objetos/catalog/small/angelitoCatalog.png` | Comparar modelo de datos, tamaños, vista previa y colocación en islas. |
| Objetos empaquetados | `/html_static_prod/dswmedia/objetos/calabaza_house.boombang` | Investigar formato antes de intentar importación. |
| Personajes empaquetados | `/html_static_prod/dswmedia/personajes/rasta.layers.boombang` | Investigar soporte y licencias de sprites/layers. |
| Interfaz de juego | `/html_static_prod/images/hud/intercambios.webp` | Comparar el HUD existente, no reemplazarlo sin pruebas. |
| Islas | `/html_static_prod/dswmedia/isla/isla2.webp` | Comparar escala, coordenadas y orden de capas. |
| Sonidos | `/html_static_prod/sounds/games/GongCorto.mp3` | Auditar reproducción sin redistribuir audio no autorizado. |
| Datos del cliente | `/betahtml5/boombang/data/assets/baseChat.json` | Investigar schema antes de diseñar adaptador. |

## Hallazgos de integración prioritaria

1. **Apertura del cliente**: no confundir el sitio web público con el cliente del juego local; la URL `play.boombang.com` usada en la guía de desarrollo no garantiza acceso público. Corregir el flujo solo con una dirección propia verificada.
2. **Entrada y salida de jugadores**: rastrear `socket.id -> usuario`, autenticación, reconexión, eventos de limpieza y señales de desconexión; no tratar conexiones anónimas como usuarios.
3. **Kekos y escenas**: validar carga de recursos, capas, fotogramas, coordenadas y renderizado real en escenas públicas antes de declarar compatibilidad.
4. **Inventario en tiempo real**: conciliar cambios de estado de catálogo, inventario y objetos de isla mediante confirmaciones del servidor y eventos de difusión.
5. **B-Pad, brújula, mochila, monedas y catálogo**: mapear estado UI/UX y endpoints actuales; respetar autenticación, permisos, validación de transacciones y estado de inventario.
6. **Catálogo**: no deducir rarezas, precios, dimensiones ni identificadores solo de URLs; estas capturas no prueban el catálogo completo.
7. **Pruebas**: añadir casos de desconexión/reconexión, reingreso en salas, colocación/retiro, duplicados y arranque de servicios antes de publicar cambios.

## Seguridad y derechos

El HAR original contiene referencias de sesión/SSO en URLs, cabeceras potencialmente sensibles y respuestas de servidor. **No se incorpora al repositorio**, ni tampoco se copian cookies, tickets, tokens, datos de usuarios, contenido binario, hojas CSS/JS originales ni fuentes. Si esos tickets siguieran activos, revócalos/cierra sesión. Este documento almacena exclusivamente una síntesis sanitizada. Los recursos visuales y sonidos de terceros exigen revisar permisos de uso; mientras tanto, sirven como referencia de funcionalidades, no como assets redistribuibles.

## Criterio de aceptación

Cada integración futura debe indicar archivo(s) del proyecto modificados, tests ejecutados, comportamiento observable en BoomBangCL y si el recurso empleado es original, compatible bajo licencia o autorizado. La captura de red por sí sola no demuestra que una característica ya funcione.
