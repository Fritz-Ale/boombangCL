# BoomBangCL — auditoría de repositorios y plan de integración (2026-11-02)

> **Alcance:** lectura de metadatos y árboles GitHub de proyectos candidatos, lectura selectiva de archivos fuente, comparación de ramas de BoomBangCL y revisión de CI. Este documento NO certifica que los sistemas sean funcionales en producción, ni concede derechos sobre gráficos o código de terceros.

## Estado del proyecto base

- [BoomBangCL](https://github.com/Fritz-Ale/boombangCL) usa **Vue 3 + Phaser 3.87 + Vite**, **Node.js + Socket.IO 4.8**, y **Laravel/PHP + MariaDB**. Son tecnologías compatibles con el requisito HTML5; no debe sustituirse el motor por moda.
- La comparación de árboles entre `main` y [GenRubiio/boombang-html5](https://github.com/GenRubiio/boombang-html5) detectó **31.556 rutas originales presentes en BoomBangCL y 11 adicionales**. Comparación **solo de rutas**, no SHA ni funciones.
- `boombang_api.sql`, `api/public/uploads.zip` y `api/.rnd` existen en `main`. No se puede inferir de ello que las texturas se hayan extraído en el volumen de despliegue ni que MySQL esté importado.
- El catálogo de la rama [PR #13](https://github.com/Fritz-Ale/boombangCL/pull/13) registra 47 referencias históricas no comprables y una auditoría documentada de 183 registros SQL con texturas encontradas dentro del ZIP. El nuevo JSON `api/database/reference/boombang_tv_gashapon_autumn_2026.json` añade 25 referencias oficiales (18 objetos y 7 medallas), **sin imágenes, IDs históricos ni tamaños inventados**.
- Las categorías actuales del catálogo ajeno se describen oficialmente en https://www.boombang.tv/es/news/actualizacion-%C2%A1llegan-el-bpad-celular-boomgram-el-escondite-y-las-nuevas-rarezas-959. La rareza por copias ajenas nunca debe confundirse con la escasez interna del servidor CL.

## Repositorios externos analizados

Se deduplicaron las opciones solicitadas y se leyeron los árboles de archivos, salvo donde se indica una limitación. La ausencia de licencia explícita verificable implica **no copiar código, contenido ni sprites**.

| Repositorio | Evidencia leída | Utilidad para HTML5/CL | Decisión |
| --- | --- | --- | --- |
| [GenRubiio/boombang-html5](https://github.com/GenRubiio/boombang-html5) | Árbol de 31.556 rutas; misma organización API, servidor y cliente que CL | Principal referencia técnica para regresiones y comparar comportamiento | **CONSERVAR como referencia**, no reimportar a ciegas |
| [Jairo34/BoomBang-Server](https://github.com/Jairo34/BoomBang-Server) | Árbol del repositorio con un único archivo `README` | No se observó implementación de servidor reutilizable | **DESCARTAR integración** |
| [pedrodnc/BoombangServer](https://github.com/pedrodnc/BoombangServer) | Árbol con fuentes ActionScript, SWF, PNG, C#, JS; README describe Flash, Ruffle, Laravel y emulador C# | Comparación de protocolos/recorridos históricos; Ruffle ejecuta Flash y no cumple cliente nativo HTML5 | **INVESTIGAR conceptos**, no adoptar Ruffle ni assets |
| [boombangtk/boombang](https://github.com/boombangtk/boombang) | Árbol histórico extenso con miles de SWF, PNG, HTML y XML | Referencia arqueológica de estructura de UI y medios, sin licencia reutilizable confirmada | **INVESTIGAR sin redistribuir** |
| [TheEfox/boombang](https://github.com/TheEfox/boombang) | Árbol de 10 rutas; README es plantilla Electron Quick Start; licencia CC0-1.0 | No ofrece motor social ni protocolo multijugador; launcher opcional no es objetivo | **NO AÑADIR** |
| [francspro/boombang](https://github.com/francspro/boombang) | Metadatos del repositorio disponibles; consulta al árbol `master` devolvió 404 | No se inspeccionó código; no permite afirmar funcionalidades | **PENDIENTE DE VERIFICACIÓN** |
| [FussNight/BoombangServer](https://github.com/FussNight/BoombangServer) | 38 rutas; `Networking/SocketSystem.cs` usa sockets TCP y pools asíncronos; MySQL C# | Principios de red antiguos, no sustituto directo de Socket.IO HTML5 | **SOLO COMPARAR DISEÑO** |
| [cucalondev/Boombang-API](https://github.com/cucalondev/Boombang-API) | `server/controllers/auth.js` usa bcrypt/JWT; árbol incluye `node_modules` versionado; licencia no verificada | Ejemplo de API que requeriría auditoría y reescritura; ya existe Laravel Passport en CL | **NO COPIAR** |
| [Dton1s/boombang-launcher](https://github.com/Dton1s/boombang-launcher) | Árbol con numerosos SWF/PNG y algunos PHP/JS | Referencia de lanzador/archivos Flash; incompatible con la exigencia de ejecución HTML5 sin Flash | **NO INTEGRAR EN CLIENTE** |

Ninguna de estas observaciones equivale a una auditoría de seguridad integral de los repositorios externos. No se han descargado ni modificado recursos originales de terceros.

## Dependencias reales entre PR abiertos

| PR | Funcionalidad | Evidencia CI observada | Recomendación |
| --- | --- | --- | --- |
| [#11](https://github.com/Fritz-Ale/boombangCL/pull/11) | Token del emulador y PHP 8.5 | Workflow API security and PHP compatibility: **success** | Revisar y fusionar primero |
| [#9](https://github.com/Fritz-Ale/boombangCL/pull/9) | Exclusión de carreras y navegación de escenas | Server scene integrity: **success** | Integrar antes de avatares, revalidar conflictos |
| [#7](https://github.com/Fritz-Ale/boombangCL/pull/7) | Avatares visibles y pasos de 630 ms | Avatar and movement regressions: **success** | Priorizar sobre #4 y #5; probar visualmente |
| [#13](https://github.com/Fritz-Ale/boombangCL/pull/13) | Rarezas, catálogo, compras, islas y assets | Jobs CI de la última revisión en ejecución cuando se redactó este informe | Integrar tras comprobaciones de compra/colocación |
| [#12](https://github.com/Fritz-Ale/boombangCL/pull/12) | UI y navegación del lobby | No se confirmó prueba final en esta auditoría | Rebase/base correcto: apunta a `feature/comunidad-chilena-portal-2026`, no a main |

**Rutas compartidas detectadas por comparación de PR:**
- #7 y #5: `AddUserController.js`, `CreateSceneController.js`, `BackgroundAvatarLoader.js`, `SmartAvatarSystem.js`.
- #7 y #4: `AnimationsTimerEnum.js`, `AnimationBlockTimerEnum.js`, `MovementProcessorInstance.js`.
- #7 y #9: `server/src/controllers/game/scenes/UserJoinPublicSceneController.js`.

No fusionar #4/#5/#7 de forma independiente: revisar la implementación común y mantener un único comportamiento de avatar/movimiento. Un CI verde prueba escenarios automatizados **no** el funcionamiento multijugador en navegador.

## Diagnóstico pendiente de salas y escenario UFO

Observaciones directamente sustentadas por archivos de `main`:

- `api/database/seeders/PublicScenesTableSeeder.php` define **UFO** con `id=1`, mapa de 30×30 y punto de entrada, pero no demuestra que la escena real disponga de todos sus fondos/objetos.
- `client/src/phaser/loaders/PublicSceneLoader.js` carga fondos, vídeos, NPC y objetos desde `scenery.assets_data`, URL de la API y sprites de escena.
- `client/src/phaser/PublicScene.js` inicia sockets, precarga assets y difiere eventos hasta marcar la escena como lista; `CreateSceneController.js` y `AddUserController.js` coordinan la creación de jugadores.
- Las fallas de assets, el volumen `api_uploads`, las carreras de avatares, el tipo de fondo (imagen/vídeo) y la forma real de la respuesta del servidor son **hipótesis a comprobar con logs**, no causas raíz confirmadas.

**Pruebas de aceptación antes de cerrar #7 / UFO:** dos usuarios reales en la misma área; uno entra/sale mientras el otro camina; escena UFO con red lenta; registrar fallos de carga y URLs en DevTools; vídeo bloqueado/autoplay; objetos y mapa completos; cambio entre área pública/isla; reconexión; sin errores no controlados en Phaser ni Socket.IO.

## Decisiones de arquitectura y legales

- **CONSERVAR:** Vue, Phaser, Socket.IO, Laravel, MySQL/MariaDB, inventario y escenarios existentes.
- **MEJORAR:** cadencia cliente-servidor, recuperación de avatares, precarga/observabilidad de UFO, integridad de compras y posicionamiento de objetos.
- **AGREGAR:** importadores de arte autorizado, tests E2E de dos clientes, reportes de cobertura de imágenes, inventario completo con metadatos verificables, accesibilidad sin cambiar el diseño del juego.
- **NO AÑADIR:** Ruffle/Flash en ejecución, segundo backend de autenticación, Electron como dependencia web, `node_modules` de terceros, duplicación de sistemas existentes.
- **PROPONER ELIMINAR:** nada todavía; auditar dependencias y cobertura antes de cualquier borrado.
- La web pública de https://boombang.cc/es/ publicita una experiencia centrada en launcher Windows; es referencia visual/contextual, **no** arquitectura HTML5 que debamos imitar.
- Los sprites históricos y su presencia en ZIP no conceden autorización de redistribución. Las fichas de investigación deben mantenerse inactivas hasta validar derechos, dimensiones, colisiones y compras.

## Estado de ejecución y siguientes puertas de calidad

**Investigado:** metadatos/árboles de los repositorios de la tabla, archivos seleccionados, comparaciones de PR, referencias oficiales.  
**Implementado en PR #13:** ficha referencial otoñal de Gashapon y validador PHP; sin activos comprables nuevos.  
**Probado:** consistencia estructural del JSON y porcentajes verificada por lectura; CI completo de los nuevos commits pendiente de resultado final.  
**No probado:** cliente Vue+Phaser con dos sesiones, MySQL real, escenario UFO, colocación de islas real, despliegue de producción.  
**No modificado:** rama `main`, Mac del usuario, servidores activos, objetos de terceros.

Orden operativo: revisar PR #11, revisar #9, conciliar #7/#4/#5, terminar CI de #13 y pruebas E2E, confirmar UFO en entorno local, integrar después UI/portal y preparar despliegue .cl independiente.
