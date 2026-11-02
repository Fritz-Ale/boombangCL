# Auditoría incremental de calidad — BoomBangCL
**Fecha:** 2026-11-02  
**Estado:** revisión de código y tests automatizados. No es certificación de producción.

## Alcance y límites
El árbol del repositorio contiene más de 31.000 entradas incluyendo sprites, recursos y dependencias.
La revisión detectó y corrigió problemas concretos en el portal, el cliente, el emulador y la configuración de API,
pero **no significa que todos los archivos se hayan ejecutado o auditado uno por uno**. No se dispone aquí de
un navegador conectado al juego, una base de datos operativa ni acceso al directorio local de la Mac.

## Cambios aislados y seguimiento
| Sistema | Evidencia / PR | Verificación |
| --- | --- | --- |
| Portal, header y footer; enfoque responsive, navegación y estados honestos | #6 | Tests de páginas y navegación |
| Avatares de salas públicas y 630 ms/casilla | #7 | Tests de texturas, fallback y temporización |
| Integridad de salas, mutex FIFO, puertas y límites del mapa | #9 | Tests de concurrencia y rutas |
| API: token del emulador, ruta de desarrollo, PDO 8.5 | #11 | PHPUnit aislado/sintaxis en matriz PHP (ver CI) |
| Cliente Vue: CSS, lobby accesible, reintentos y limpieza Socket.IO | #12 | Tests y compilación Vite/Phaser |

Los PRs se mantienen en borrador; primero revisar los resultados de CI y después las pruebas de integración.

## Matriz de pruebas manuales antes de fusionar
- [ ] **Entrada:** iniciar sesión en Laravel, entrar al lobby, abrir UFO y otras áreas, comprobar avatar propio y de terceros.
- [ ] **Avatares:** seleccionar cada avatar, alternar salas pequeñas/grandes, recargar texturas y comprobar que no se vuelve invisible.
- [ ] **Movimiento:** caminar con 2 o más usuarios durante 50 pasos, incluidas diagonales, y validar la cadencia de 630 ms y colisiones.
- [ ] **Concurrencia:** conectar 10 usuarios simultáneos, cambiar de sala por puertas válidas/inválidas, salir y reconectar sin duplicados.
- [ ] **Lobby:** probar búsqueda con/sin tildes, respuesta denegada del servidor, timeout, volver a intentar y desconexión.
- [ ] **Minijuegos e inventario:** Golden Ring, tiendas, NPC, inventario, isla propia/privada, compras y eventos Socket.IO.
- [ ] **UI responsive:** 320, 375, 768, 1024 y 1440 px; revisar header, menú, tarjetas, formularios y footer sin scroll horizontal accidental.
- [ ] **Accesibilidad:** teclado Tab/Shift+Tab/Escape/Enter, foco visible, lector de pantalla, zoom 200 %, movimiento reducido.
- [ ] **Base de datos:** restaurar un entorno de pruebas sin datos personales, migrar Laravel, validar FKs/índices y flujos de registro/inventario.
- [ ] **Seguridad:** validar token del emulador, roles del panel de administración, CORS, CSRF, rate limiting, HTTPS y sesiones expiradas.
- [ ] **Despliegue:** probar web estática en Pages y backend/API/Socket.IO/BD en hosting separado, con variables seguras y backups.
- [ ] **Comunidad:** establecer canal privado de denuncias, normativa de privacidad, protección de menores y licencia de recursos antes de abrir funciones sociales.

## Riesgos pendientes conocidos
1. **No hay despliegue integrado validado.** Que exista código o pase un test no implica que el juego funcione en un dominio público.
2. **Advertencias de vendor PHP 8.5.** El PR #11 corrige configuración propia; los avisos internos de Laravel requieren revisión y actualización compatible de dependencias.
3. **Autenticación y datos.** Hacer revisión de permisos/roles y pruebas contra MariaDB real; no subir ni exponer secretos o información personal en archivos SQL.
4. **UI dentro del juego.** Compilar Vue/Phaser no demuestra que todas las pantallas escalen bien ni que los sprites se dibujen en dispositivos reales.
5. **PRs dependientes.** El #12 parte de la rama del #6. Integrar primero #6 o actualizar la base antes de fusionar #12.
6. **Pruebas de carga.** No ejecutadas contra un servidor Socket.IO real; la concurrencia se validó con tests unitarios.

## Comandos de comprobación en macOS
Desde la carpeta del proyecto:

```sh
cd ~/Desktop/Alejandro/proyecto/boombangCL
git status
node --test web/tests/*.test.cjs
node --test client/tests/*.test.cjs
node --test server/tests/*.test.cjs
cd client && npm ci && npm run build
```

En una copia de pruebas, usando las variables de entorno adecuadas:

```sh
docker compose config
docker compose up --build
docker compose ps
docker compose logs --tail=200
```

No ejecutar migraciones destructivas ni `migrate:fresh` contra la base de datos de producción.
