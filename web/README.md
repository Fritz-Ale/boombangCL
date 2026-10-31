# Portal BoomBang CL

Portal original y responsivo basado en los recursos del repositorio BoomBang HTML5. No se han copiado código, imágenes, textos ni recursos ajenos de BoomBang.tv; es un proyecto independiente no oficial.

## Páginas

| Ruta | Función |
| --- | --- |
| `index.html` | Portada con accesos a la comunidad |
| `comunidad.html` | Salas ilustrativas y secciones sociales |
| `noticias.html` | Noticias propias, gestionadas por administradores y filtrado editorial de presentación |
| `cuenta.html` | Registro, inicio de sesión y cierre de sesión web |
| `foro.html` | Temas y respuestas guardados en la base de datos |
| `chat.html` | Mensajes persistentes para usuarios autenticados, con actualización cada 15 segundos |
| `catalogo.html` | Consulta de artículos activos y disponibles para compra en el catálogo del juego (solo lectura) |
| `ranking.html` | Clasificación de la última semana de minijuegos con respeto al ajuste de privacidad `show_username` |
| `social.html` | Solicitudes de amistad, aceptación y clanes por invitación |
| `moderacion.html` | Revisión de reportes desde una cuenta administradora |
| `normas.html` | Normas de convivencia y denuncias |
| `privacidad.html` | Resumen del tratamiento de datos en desarrollo (no política legal definitiva) |
| `ayuda.html` | Instrucciones para preparar el entorno y acceder al cliente HTML5 |

Las imágenes siguen procediendo de `doc/screenshots/` y no de sitios externos.

## Preparar el entorno en macOS

1. Instala Git y Docker Desktop y clona el repositorio.
2. Configura los cuatro archivos de entorno siguiendo el `README.md` raíz y crea la red externa `proxy-network`.
3. Configura `APP_KEY`, base de datos y credenciales en `api/.env`. Si quieres mostrar el número de jugadores del juego, genera un secreto aleatorio largo y configúralo como `PORTAL_STATS_TOKEN` tanto en `api/.env` como en `server/.env`; nunca debe estar en el HTML o JavaScript. Para probar con `http://localhost:8001`, mantén `SESSION_DOMAIN=null` (sin dominio de terceros) y `SESSION_DRIVER=database`.
4. Ejecuta el portal y sus dependencias:

```sh
docker compose up -d db api web --build
docker compose exec api php artisan migrate --force
```

5. Si aún no hay `APP_KEY` configurada, genera la clave dentro de `api/.env` antes de registrar usuarios:

```sh
docker compose exec api php artisan key:generate
```

6. Abre `http://localhost:8001` y entra a `cuenta.html`.

El contenido del catálogo y del ranking no se genera automáticamente: depende de los datos disponibles en MariaDB y de las migraciones/semillas existentes del proyecto. Para arrancar el juego necesitas además el servicio `server`, el `client` y la configuración de `play.boombang.com` descrita en el README raíz. **La sesión del portal no autoriza automáticamente al cliente HTML5**; el jugador inicia sesión en el cliente por separado.

## API del portal

Las páginas llaman a rutas **del mismo origen**: Nginx reenvía `/portal/*` a las rutas de `api/routes/web.php` en Laravel. Así se utiliza el middleware web con sesiones y tokens CSRF. No se expone al navegador el token interno `EMULATOR_API_TOKEN` ni tokens de Passport.

- Sesión: `GET /portal/session`, `POST /portal/register`, `POST /portal/login`, `POST /portal/logout`.
- Datos públicos: `GET /portal/news`, `/portal/catalog`, `/portal/ranking`, `/portal/status`, `/portal/forum/threads`.
- Amistades y clanes: solicitudes, aceptación, invitaciones privadas, salida y disolución por propietario usando `/portal/friends` y `/portal/clan`.
- Foro: lectura de un tema y creación/respuesta por usuarios autenticados.
- Chat: `GET/POST /portal/chat` para usuarios autenticados.
- Presencia: `POST /portal/presence` registra la actividad de una cuenta; `status` muestra el número de usuarios activos del portal en los últimos cinco minutos, **no** los jugadores en el juego.
- Noticias: un usuario con rol `Admin` o `Superadmin` puede publicar y eliminar noticias desde `noticias.html`.
- Moderación: los miembros autenticados pueden reportar temas, respuestas y mensajes; administradores revisan reportes en `moderacion.html`, cierran o eliminan temas y retiran contenido del chat.
- Las rutas de escritura están protegidas por sesiones, CSRF, validación de entradas, autorización y límites de solicitudes.

Se crean `portal_news`, `portal_threads`, `portal_replies`, `portal_chat_messages` y `portal_presence` mediante la migración `api/database/migrations/2026_10_31_220000_create_portal_tables.php`. La migración `2026_10_31_221000_create_portal_social_tables.php` incorpora `portal_friendships`, `portal_clans`, `portal_clan_members` e invitaciones. La migración `2026_10_31_222000_create_portal_reports_table.php` almacena los reportes de contenido.

## Pruebas

Comprobación sin dependencias adicionales, desde la raíz:

```sh
node --test web/tests/portal-static.test.mjs
node --check web/portal-app.js
php -l api/routes/web.php
```

El workflow de GitHub Actions `.github/workflows/portal-checks.yml` también verifica enlaces, archivos, sintaxis PHP/JS y configuración de Nginx. Estas comprobaciones **no** equivalen a una prueba funcional de API y base de datos. Antes de publicar, realiza pruebas integrales con Docker, Laravel, migraciones, sesiones, formularios, permisos, cookies y HTTPS.

## Pendientes para producción

- El portal registra usuarios en la misma tabla `users` del juego; requiere revisar protección contra bots, políticas de privacidad, verificación de correo, recuperación de contraseña y moderación continua antes de exponerlo a Internet.
- El foro y el chat almacenan mensajes; antes de un lanzamiento público conviene agregar políticas de retención, denuncias, moderación de contenido y protección antispam avanzada.
- No hay chat en tiempo real por WebSockets en este portal: se consulta periódicamente Laravel. El chat dentro de las salas pertenece al cliente y servidor HTML5.
- Existe un endpoint de **jugadores autenticados reales** en Node.js: `/internal/portal-stats`. Laravel lo consulta con el token privado `PORTAL_STATS_TOKEN` configurado en ambos servicios. Nunca se publica el token al navegador y los bots se excluyen. Sin token o con el juego apagado se muestra «no disponible».
- El catálogo es **solo lectura**. No hay pasarela de pago web ni compra de VIP; las operaciones económicas deben implementarse únicamente con verificación de servidor y credenciales privadas.
- Las amistades y los clanes están incorporados como funciones del **portal**; no sincronizan todavía listas de amigos dentro del cliente HTML5. Acceso al juego como invitado y publicaciones multimedia quedan pendientes.

## Derechos

La web se desarrolló como portal propio e independiente de BoomBang.tv y no está afiliada al sitio oficial. Las capturas y el código del proyecto base conservan sus condiciones indicadas en `../LICENSE.txt`; verifica los derechos antes de redistribuir o publicar.
