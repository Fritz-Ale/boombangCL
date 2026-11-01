# Estado de integración del juego HTML5

Revisión del código de BoomBangCL — 2026-11-01.

## Componentes existentes

- **Cliente:** `client/src/App.vue` monta la interfaz Vue y el contenedor Phaser. `client/src/main.js` inicializa Pinia y configura los listeners Socket.IO.
- **Transporte:** `client/src/sockets/socket.js` usa `VITE_SERVER_URL`, transporte WebSocket, reconexión limitada y actualiza `socketStore` al conectar/desconectar.
- **Servidor:** `server/src/sockets/index.js` registra manejadores para autenticación, escenas públicas y privadas, islas, lobby, usuarios, objetos, minijuegos, inventario, tienda y otros módulos.
- **Eventos:** `client/src/enums/RequestSocketsEnum.js` y `server/src/enums/RequestSocketsEnum.js` declaran los identificadores de solicitudes.
- **Prueba de transporte:** `server/tests/transport.test.cjs` verifica una conexión WebSocket real y protección de endpoints internos, pero no inicia partidas ni autenticación real.
- **Prueba nueva:** `web/tests/game-event-contract.test.mjs` detecta diferencias en los eventos esenciales de cuentas, salas, islas, avatares, chat y minijuegos.

## Límites de la verificación

La existencia de manejadores y coincidencia de nombres de eventos **no prueba** persistencia, permisos, sincronización de jugadores ni funcionalidad de producción. GitHub Pages solo aloja la web estática.

## Validaciones siguientes

1. Prueba integrada con Laravel, MariaDB y Socket.IO para registrar y autenticar una cuenta de prueba.
2. Entrar en una sala pública con dos clientes y comprobar presencia, movimiento y chat.
3. Crear y recuperar una isla y verificar persistencia tras reconexión.
4. Cambiar apariencia y confirmar su actualización en ambos clientes.
5. Iniciar y terminar un minijuego y comprobar el resultado real almacenado.
6. Revisar autorización de cada evento antes de permitir acciones de usuario.

No reutilizar credenciales reales ni habilitar pruebas destructivas en producción.
