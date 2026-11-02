# Investigación web y plan de mejoras para BoomBangCL Chile

**Fecha de revisión:** 2 de noviembre de 2026. Documento de trabajo para una comunidad independiente. Los sistemas de otras plataformas se observan como ideas, **no** como archivos o código a extraer.

## 1. Origen y experiencia clásica

- Existen referencias públicas a `boombang.tv` desde al menos julio de 2004, y fuentes de directorios empresariales señalan 2004 como año de lanzamiento; debe evitarse afirmar sin matiz que empezó en 2005.
- Las capturas de 2010–2011 permiten documentar áreas como Beluga Beach, U.F.O., MiniKong, BaoBab, Ring y Camino Ninja, así como el lobby, la lista de islas, la personalización, el chat y las fichas.
- Elementos distintivos del diseño: escenario isométrico, isla propia, puertas entre zonas, avatars animados, burbujas de chat, objetos decorativos, minijuegos y economía virtual.

**Implicación:** dar prioridad a movimiento, animaciones y colisiones consistentes; salas de acceso sencillo; navegación rápida; chat sin pérdida de mensajes; y una estética propia que recuerde el mundo social sin reproducir archivos ajenos.

Fuentes históricas: [Foro de 2004](https://programacion.net/foros/general/una-comunidad-grafica-en-director_129669), [referencia de negocio](https://app.dealroom.co/companies/boombang), [capturas y descripción retrospectivas](https://jade-blogdejade.blogspot.com/2011/06/boombang.html).

## 2. Funciones observadas en el sitio BoomBang.tv (2026)

| Tema | Evidencia y fecha | Oportunidad para BoomBangCL | Precauciones |
| --- | --- | --- | --- |
| Descubrimiento social | [Portal y comunidad](https://www.boombang.tv/es/community) — secciones de ranking, amigos, clanes, salas, galería, concursos, catálogo | Directorio de salas, buscador, favoritos, presencia validada por servidor | Evitar números falsos o scraping de perfiles |
| Editor avanzado | [Editor de zonas, 11 oct 2026](https://www.boombang.tv/es/news/actualizacion-%C2%A1editor-de-zonas-y-nuevos-ajustes-de-isla-943) | Subida de capas propias, preview, matriz de caminabilidad, permisos por isla | Antivirus y límites de tamaño; revisión de contenido, validación servidor |
| Mecanismos para islas | [Circuits, oct 2026](https://www.boombang.tv/es/circuits) | Editor de reglas, disparadores, condiciones y efectos | Evitar scripts arbitrarios, ciclos infinitos y abusos |
| Multijugador competitivo | [Aviso HTML5, 29 jul 2026](https://www.boombang.tv/es/news/oficial-aviso-importante-cambios-en-los-minijuegos-a-partir-del-1-de-agosto-860) | Expandir Ring a otros modos mediante servidores autoritativos | Anti-trampas, latencia, matchmaking |
| Clanes y torneos | [Castillo, 12 oct 2026](https://www.boombang.tv/es/news/actualizacion-%C2%A1llega-el-castillo-de-los-clanes-945) | Clanes locales, calendario y ranking de comunidades | Balance, sanciones, verificación de resultados |
| Mensajería y comunidad | [BPad y galería, 25 oct 2026](https://www.boombang.tv/es/news/actualizacion-%C2%A1llegan-el-bpad-celular-boomgram-el-escondite-y-las-nuevas-rarezas-959) | Lista de amigos, preferencias de avisos y perfiles con privacidad por defecto | Consentimiento, reportes, protección menores |
| Economía y recompensas | [Regalos y logros, 23 oct 2026](https://www.boombang.tv/es/news/actualizacion-%C2%A1llegan-los-regalos-del-catalogo-y-los-logros-del-pase-de-temporada-957) | Regalos con confirmación segura, logros, eventos | Fraudes, auditoría de transacciones, límites |
| Pases y eventos | [Pase de temporada, 22 oct 2026](https://www.boombang.tv/es/news/evento-%C2%A1llega-el-nuevo-pase-de-temporada-fiestas-boombang-955) | Misiones diarias/semanales; recompensas por jugar, no por horas conectadas | Diseño ético, no generar presión ni gastar para ganar |
| Moderación | [Denuncia segura, 2025](https://www.boombang.tv/es/news/oficial-denuncia-segura-595) | Canal privado de reportes, bloqueo, silenciar, historial de sanciones | Evidencia minimizada, acceso restringido |
| Seguridad | [Consejos contra robos, 2025](https://www.boombang.tv/es/news/avisomedidas-de-proteccion-de-datos-631) | Educación sobre contraseñas, MFA, recuperación y anti-phishing | No publicar contraseñas ni IPs en tickets |

Estas referencias describen funciones documentadas de **BoomBang.tv**, no promesas de funcionamiento en BoomBangCL. Las secciones de comunidad y foro requieren cuentas y servicios propios si algún día se reconstruyen.

## 3. Análisis del proyecto independiente BoomBang.cc

[Presentación del proyecto](https://boombang.cc/es/): enfoque en comunidad, personajes, Ring, Cocos Locos y Camino Ninja, con una beta para PC Windows en 2026. BoomBangCL debe diferenciarse por su identidad chilena, la compatibilidad de navegador cuando sea posible y por no presentar como terminados sistemas todavía incompletos.

No importar automáticamente textos, código, bases de datos, imágenes, avatares o identidad comercial de sitios terceros. Revisar `LICENSE.txt`, licencias de dependencias, autorización de uso de assets y riesgos de confusión de marca antes de cualquier apertura pública.

## 4. Inventario confirmado en el código de Fritz-Ale/boombangCL

- **Ya en el repositorio, pendiente de QA según entorno:** cliente Phaser/Vue, servidor Socket.IO, API Laravel, lobby, áreas públicas, islas privadas, chat, catálogo, mochila, personalización, Golden Ring, clasificaciones, correo, gachapón y panel de administración.
- **En ramas en revisión (no fusionadas):** mejora de cadencia de movimiento 630 ms y correcciones de avatares invisibles en salas públicas.
- **No confundir con implementado:** foro persistente, clanes completos, editor de capas seguro, circuitos, feed social con imágenes, comercio entre cuentas y reportes privados moderados. Requieren nuevo backend, tests y autorización.

## 5. Orden de implementación sugerido para BoomBangCL

### P0 — Seguridad y base jugable

1. Resolver problemas de sprites, carga, navegación, colisiones y temporizadores; pruebas multijugador con latencia real.
2. Instrumentar métricas **anónimas agregadas** de fallos del juego, sin datos sensibles en el portal público.
3. Asegurar autenticación, recuperación de contraseñas, control de abusos y capacidad de desactivar funciones dañinas.
4. Antes de abrir chat público: flujo privado de denuncias, moderación, suspensión y auditoría.

### P1 — Comunidad chilena

1. Portal con identidad original, `es-CL`, referencias a horario de Santiago y dominio .cl *solo al registrarse*.
2. Reglas de convivencia, orientación para reportar problemas y formulario de ideas sin recolectar datos en la portada.
3. Directorio accesible de salas públicas, buscador, conteos auténticos enviados por Socket.IO.
4. Agenda de eventos revisados por administración, torneos de islas, concursos de creatividad y calendario chileno.
5. Un panel seguro para que moderadores publiquen noticias, eventos y decisiones sin editar JSON manualmente.

### P2 — Retención y creación

1. Lista de amigos y ajustes de privacidad, filtros de chat y solicitudes.
2. Misiones y logros con progreso verificado por el servidor; sin pago obligatorio.
3. Permisos de islas, controles de acceso, registros de objetos y herramientas de moderación para dueños.
4. Editor visual de capas y suelos que genere **assets originales**.
5. Herramientas de guía para nuevos jugadores, compatible con móvil en la web.

### P3 — Sistemas avanzados

1. Clanes y temporadas competitivas.
2. Nuevos minijuegos originales inspirados en mecánicas genéricas, con servidores autoritativos.
3. Circuitos de islas controlados y con cuotas por ejecución.
4. Intercambios de objetos, solo tras diseñar sistema transaccional antifraude y recuperación.

## 6. Lo añadido en la rama `feature/comunidad-chilena-portal-2026`

- `web/comunidad.html`: comunidad, normas iniciales, agenda sin eventos ficticios y formulario de propuestas.
- `web/mejoras.html`: filtro de 12 capacidades e ideas por estado.
- `web/eventos.json`: fuente de calendario inicialmente vacía, solo admite actividades confirmadas.
- `web/comunidad.js`: formato de fechas `America/Santiago`, filtros, creación de borradores GitHub sin backend.
- `web/comunidad.css`: estilos responsivos originales.
- `client/src/views/components/game/lobby/AreasTabComponent.vue`: búsqueda y ordenación de áreas públicas, usando datos reales del servidor.
- `web/README.md`: instrucciones de operación y despliegue.

**La creación de una propuesta abre GitHub Issues.** El repositorio tenía las incidencias habilitadas en la revisión; el usuario debe estar autenticado. No usar ese canal para denuncias sensibles o documentos privados.

## 7. Publicación futura con identidad .cl

- Registrar un nombre disponible en [NIC Chile](https://www.nic.cl/dominios/); su tabla indicaba $9.990 CLP por un año, exento de IVA, al consultar el 2 de noviembre de 2026. Volver a comprobar al comprar.
- Alojar el portal estático en Cloudflare Pages, definir el dominio personalizado y delegar DNS desde NIC Chile (consultar [instrucciones oficiales](https://developers.cloudflare.com/pages/configuration/custom-domains/)).
- En producción distinguir `www` / dominio raíz para portal, `play.` para el juego si se decide, `api.` para Laravel y `ws.` o `server.` para Socket.IO; habilitar HTTPS/WSS y configuración CORS. **Estos son nombres ilustrativos, no servicios activados.**
- Cloudflare Pages por sí solo no ejecuta MySQL/MariaDB, Laravel o un servidor Socket.IO persistente. Requieren infraestructura propia y manejo de secretos.
- Antes de abrir al público: términos y política de privacidad redactados para el servicio real, seguridad de usuarios, derechos de autor/licencias, backups, monitorización, anti-spam y gestión de incidentes.

## 8. Criterios de aceptación para lanzar

- Inicio de sesión y conexiones concurrentes funcionan sin pérdida de personajes.
- Las salas son navegables y la interfaz funciona con teclado y en móvil donde aplique.
- No hay enlaces falsos a compras, soporte o eventos.
- Reportes de abuso por canal privado, moderadores con roles controlados, registros y eliminación de datos.
- Tiempos y fechas mostrados en Santiago, con pruebas de DST.
- Enlace del dominio .cl con certificado TLS válido.
- Cumplimiento de licencias y aclaración visible de independencia de BoomBang.tv.

*Documento de investigación y planificación: no certifica que los servicios propuestos estén desplegados, registrados o en funcionamiento.*
