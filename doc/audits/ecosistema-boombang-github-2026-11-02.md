# Auditoría de fuentes BoomBang para BoomBangCL — 2026-11-02

## Estado verificable

La consulta de árboles GitHub de `Fritz-Ale/boombangCL` (`main`) y
`GenRubiio/boombang-html5` (`main`) devolvió 31.567 y 31.556 entradas,
respectivamente. **Todas las 31.556 rutas del segundo existen en el primero**:
31.530 entradas con el mismo SHA, 26 entradas con SHA diferente
(incluyendo directorios), y 11 rutas adicionales. Los **9 archivos** con SHA
diferente son `README.md`, `api/app/Http/Controllers/Admin/UserCrudController.php`,
`api/app/Http/Controllers/Internal/BotController.php`,
`api/app/Services/SocketNotificationService.php`,
`client/src/phaser/loaders/PublicSceneLoader.js`, `docker-compose.yml`,
`server/src/config/server.js`, `server/src/models/NpcModel.js` y
`server/src/routes/apiRoutes.js`. Esto compara los árboles remotos, no
comprueba ejecución ni que el contenido original sea seguro.

### Repositorios contrastados (lectura de metadatos y archivos indicados)

| Repositorio | Evidencia revisada | Uso recomendado | Riesgo |
| --- | --- | --- | --- |
| [GenRubiio/boombang-html5](https://github.com/GenRubiio/boombang-html5) | Árbol `main`; mismos módulos Laravel/cliente/servidor en BoomBangCL | Base estructural; preservar motor HTML5 existente | Licencia NOASSERTION; verificar derechos de assets |
| [GenRubiio/boombang-2009-emulator](https://github.com/GenRubiio/boombang-2009-emulator) | Raíz C#, `game/`, `server/`, `database/` | Comparar protocolo y lógica de desplazamiento | No copiar binarios ni código sin licencia |
| [GenRubiio/boombang-2022-app](https://github.com/GenRubiio/boombang-2022-app) | Raíz Laravel `app/`, `node/`, `electron/` | Investigar herramientas y flujo social | No es sustituto directo del cliente HTML5 |
| [GenRubiio/boombang-2022-emulator](https://github.com/GenRubiio/boombang-2022-emulator) | Raíz solución C# | Referencia de mensajes y minijuegos | Stack distinto, licencia no declarada |
| [GenRubiio/boombang-api](https://github.com/GenRubiio/boombang-api) | Raíz `app/`, `database/`, `routes/` | Comparación de modelos/migraciones, sin incorporar a ciegas | Código histórico sin licencia declarada |
| [GenRubiio/phaser-spreadsheet](https://github.com/GenRubiio/phaser-spreadsheet) | `CreateSpreadsheetTask.js`, `index.js` | Evaluar herramientas de spritesheets para desarrollo | Requiere revisión de licencia |
| [Jairo34/BoomBang-Server](https://github.com/Jairo34/BoomBang-Server) | Raíz únicamente `README` | Referencia histórica limitada | Sin código fuente verificado |
| [pedrodnc/BoombangServer](https://github.com/pedrodnc/BoombangServer) | README y raíz Laravel/Node/C#/Ruffle | Comparar arquitectura y protocolo | Su cliente usa SWF/Ruffle, no cumple objetivo sin Flash |
| [boombangtk/boombang](https://github.com/boombangtk/boombang) | `index.html` XHTML, JS legado y carpetas web | Estudiar geometría histórica del portal | No incorporar jQuery/Flash heredado |
| [TheEfox/boombang](https://github.com/TheEfox/boombang) | README y raíz de Electron | No priorizar para cliente navegador | Esqueleto Electron, no motor de juego |
| [FussNight/BoombangServer](https://github.com/FussNight/BoombangServer) | C# `Networking/SocketSystem.cs`, `Session.cs` por ruta y estructura | Investigar framing histórico | Proyecto 2014 y licencia no declarada |
| [cucalondev/Boombang-API](https://github.com/cucalondev/Boombang-API) | `server/app.js`, `controllers/`, `routes/`, `models/` por estructura | Comparar endpoints y middleware | `node_modules` incluido; no copiar dependencias |
| [Dton1s/boombang-launcher](https://github.com/Dton1s/boombang-launcher) | Raíz `flash/`, instalador JS | Solo referencia de arranque histórico | Dependencia del cliente Flash |

La inspección de raíces **no equivale** a haber leído cada archivo; la revisión
algorítmica y de licencias de cada candidato sigue pendiente. GitHub arroja otros
resultados que solo comparten el nombre `BoomBang`; filtrar por funcionalidad
antes de incorporarlos. `francspro/boombang`: la consulta de su raíz no devolvió
archivos, por lo que no se asigna funcionalidad sin evidencia.

## Catálogo y derechos

- [Anuncio oficial de rarezas del 25-10-2026](https://www.boombang.tv/es/news/actualizacion-%C2%A1llegan-el-bpad-celular-boomgram-el-escondite-y-las-nuevas-rarezas-959):
  Singular 1; Dúo 2; Tríada 3; Casi único 4-10; Excepcional 11-25;
  Legendario 26-50; Reliquia 51-100; Muy rare 101-250; Rare >250; LTD y Evento.
- La rama `feature/catalog-rarity-research-and-island-safety` incluye 47
  fichas de investigación no comprables. No constituyen un catálogo completo.
- El informe `doc/research/catalogo-rares-boombangcl-2026.md` documenta
  183 registros del SQL histórico, 183 miniaturas y 183 texturas referenciadas
  en el ZIP, pero solo 19 objetos con ancho y alto definidos en SQL.
- No activar arte externo sin permiso verificable, dimensiones reales,
  colisiones, atlas y pruebas en isla.

## Cambios defensivos añadidos en esta continuación

- `api/app/Support/CatalogPurchasePricing.php`: precios, descuentos y monedas
  de compras internas se validan en el servidor, independientemente de Backpack.
- `ShopController.php`: rechaza tipos de moneda no compatibles, totales
  negativos/no finitos, descuentos fuera de rango y cantidades >1000 por solicitud.
  Preserva el bloqueo transaccional de saldo preexistente.
- `api/tests/Standalone/catalog-purchase-pricing.php`: 6 casos válidos y
  12 inválidos, agregados a los workflows de catálogo para PHP.
- Ningún objeto de investigación fue habilitado ni se aplicaron migraciones
  en bases reales. Se requiere prueba de compra concurrente en MySQL antes
  de integrar al despliegue.

## Orden de trabajo recomendado

1. Revisar primero autenticación y permisos de `PR #11`, sin mezclar credenciales.
2. Unificar `PR #7` con la protección de concurrencia de `PR #9`; `PR #4`
   y `PR #5` tienen objetivos superpuestos y requieren comparación de cambios.
3. Verificar visibilidad, creación de escenas y carga de UFO contra registros
   de cliente/servidor, en dos sesiones reales.
4. Integrar `PR #13` tras CI y prueba MySQL: compra → inventario → isla →
   retiro → reconexión, sin copias duplicadas.
5. Después revisar UI/lobby (`PR #12`) y alojamiento; mantener el estilo
   visual clásico y acceso mediante HTML5.
6. Tratar la seguridad de derechos de imágenes, backups, variables de entorno,
   escalado de Socket.IO y publicación `.cl` como puertas de lanzamiento.

**Estados:** archivos, commits y rutas auditados = verificados en GitHub;
casos de prueba PHP = ejercitados aisladamente; integración MySQL, sprites
autorizados y escenarios multijugador = pendientes. No se ha modificado `main`.
