# BoombangCL 🎮

**BoombangCL** es un proyecto de recuperación y continuidad de BoomBang HTML5, basado en el código de [GenRubiio/boombang-html5](https://github.com/GenRubiio/boombang-html5) y mantenido en este repositorio por [Fritz-Ale](https://github.com/Fritz-Ale). El proyecto reconstruye la experiencia multijugador con un cliente HTML5, un servidor en tiempo real, una API de gestión y un launcher de escritorio.

> Proyecto no oficial con fines de estudio, desarrollo y preservación. No está afiliado ni respaldado por los propietarios originales de BoomBang. Se reconocen los créditos y la licencia del proyecto de origen.

![BoomBang HTML5](doc/screenshots/portada.png)

## Sobre BoombangCL

Este repositorio reúne el código del cliente, servidor, API, recursos y herramientas del proyecto de referencia. Se preserva su estructura original como base para continuar trabajando en BoombangCL. La presencia del código no garantiza por sí sola que todos los servicios funcionen sin configuración adicional.

## Estado del proyecto

El código base de BoomBang HTML5 se conserva en este repositorio. Las funciones documentadas por el proyecto de origen permiten registrarse, entrar al lobby, explorar áreas públicas, crear islas con salas personalizables, interactuar con otros usuarios, comprar y coleccionar objetos y competir en el minijuego Golden Ring.

| Sistema | Estado |
| --- | --- |
| Autenticación y perfiles | Implementado |
| Lobby y navegación | Implementado |
| Salas públicas multijugador | Implementado |
| Islas y salas privadas | Implementado |
| Catálogo, compras e inventario | Implementado |
| Personalización de avatar | Implementado |
| Chat e interacciones sociales | Implementado |
| Golden Ring, matchmaking y ranking | Implementado |
| NPC, recompensas y eventos | Implementado |
| Gachapón y correo | Implementado |
| Bots conversacionales con IA | Implementado |
| Panel administrativo | Implementado |
| Launcher de escritorio | Implementado |

## Galería

### Salas públicas

Áreas multijugador en tiempo real con movimiento por casillas, chat, usuarios conectados, objetos coleccionables, NPC, sonidos ambientales, accesos entre escenas y eventos.

![Sala pública](doc/screenshots/sala-publica.png)

### Islas y salas privadas

Cada usuario puede crear sus propias islas, añadir salas privadas, elegir su distribución, cambiar colores y nombres y decorarlas con objetos de su inventario. También es posible buscar, visitar y eliminar islas.

![Islas](doc/screenshots/islas.png)

![Sala privada](doc/screenshots/sala-privada.png)

### Minijuegos

Golden Ring incluye inscripción mediante matchmaking, partida multijugador sincronizada, puntuaciones, clasificación semanal y recompensas.

![Golden Ring](doc/screenshots/golden-ring.png)

![Ranking](doc/screenshots/ranking.png)

### Catálogo e inventario

El catálogo permite organizar objetos por categorías, comprar artículos con distintos tipos de moneda, controlar cantidades y requisitos y gestionar los objetos adquiridos desde el inventario.

![Catálogo](doc/screenshots/catalogo.png)

![Inventario](doc/screenshots/inventario.png)

### Personalización y perfil

El cliente incluye 17 avatares con animaciones, selección de aspecto, ficha personal, descripción, color de nombre, sombra, chat y objetos arrojables. Las tarjetas de usuario muestran estadísticas, emojis e interacciones.

![Personalización](doc/screenshots/personalizacion.png)

### Lobby y sistemas adicionales

Desde el lobby se accede a las áreas, islas y juegos. También incluye tutorial, buscador, favoritos, ajustes de idioma, gráficos y sonido, gachapón, correo con recompensas y reloj de juego.

![Lobby](doc/screenshots/lobby.png)

### Administración

El panel de administración permite gestionar usuarios, roles, salas, islas, catálogo, inventarios, NPC, eventos, minijuegos, puntuaciones, recompensas, correo, claves de API y el estado del servidor.

![Panel de administración](doc/screenshots/admin.png)

## Funcionalidades desarrolladas

### Mundo multijugador

- Comunicación en tiempo real mediante Socket.IO.
- Movimiento sincronizado y navegación entre escenas.
- Salas públicas, salas privadas, islas y escenas de minijuegos.
- Chat sobre el avatar, menciones, lista de usuarios y emojis.
- Interacciones entre jugadores, uppercuts y 10 tipos de objetos arrojables.
- Fichas de usuario, estadísticas y personalización visual.
- Objetos que aparecen y pueden recogerse en salas públicas.
- NPC con catálogos, requisitos y entrega de objetos.

### Economía y progresión

- Catálogo organizado por categorías.
- Compra de objetos, inventario y límites de cantidad.
- Decoración y colocación de objetos en salas privadas.
- Créditos, recompensas, eventos y puntuaciones.
- Gachapón con premios.
- Correo interno con recompensas reclamables.
- Integración preparada para pagos mediante Stripe.

### Minijuegos

- Golden Ring como primer minijuego jugable.
- Sistema de inscripción y matchmaking.
- Instancias de partida independientes.
- Ranking semanal, puntuaciones y recompensas.

### Plataforma

- Registro, inicio de sesión y acceso con Google.
- Autenticación con Laravel Passport.
- Interfaz multidioma.
- Caché y versionado de recursos del cliente.
- Bots conversacionales con contexto, memoria, cuotas y proveedores de IA.
- Panel administrativo construido con Backpack for Laravel.
- Launcher de Windows construido con Electron.

## Arquitectura

```text
┌──────────────────────┐       Socket.IO       ┌──────────────────────┐
│ Cliente Vue + Phaser │ ◄───────────────────► │ Servidor Node.js     │
└──────────┬───────────┘                       └──────────┬───────────┘
           │ HTTP                                         │ HTTP
           ▼                                              ▼
┌──────────────────────┐                       ┌──────────────────────┐
│ API Laravel          │ ◄───────────────────► │ MariaDB              │
│ + Panel Backpack     │                       │ boombang_api         │
└──────────────────────┘                       └──────────────────────┘
```

| Directorio | Tecnología | Responsabilidad |
| --- | --- | --- |
| `client/` | Vue 3, Phaser 3, Vite, Pinia | Interfaz y renderizado del juego |
| `web/` | HTML, CSS, JavaScript, Nginx | Portal social, panel de avances y páginas conectadas a Laravel |
| `server/` | Node.js, Express, Socket.IO | Lógica multijugador en tiempo real |
| `api/` | Laravel 12, Passport, Backpack | Datos, autenticación y administración |
| `launcher/` | Electron | Launcher de escritorio para Windows |
| `docker/` | Docker, MariaDB, nginx-proxy | Entorno e infraestructura local |

> [📊 **Ver avances del proyecto en GitHub**](AVANCES.md) · [Hoja de ruta con tareas](https://github.com/Fritz-Ale/boombangCL/issues/2) · [PR de desarrollo](https://github.com/Fritz-Ale/boombangCL/pull/1).

> El servicio `web/` presenta un portal con cuentas, recuperación de contraseñas, amistades, clanes, foro, chat, moderación, noticias, catálogo y rankings conectables a Laravel. Las funciones dinámicas necesitan migraciones, sesiones web y servicios activos; el contador del juego requiere además un secreto privado compartido con Node.js. Los pagos web siguen desactivados. La recuperación por correo requiere un proveedor de correo saliente y un origen HTTPS configurado antes de publicar. Consulta [`web/README.md`](web/README.md).

## Tecnologías principales

- **Cliente:** Vue 3, Phaser 3.87, Pinia, Vite, GSAP y Vue I18n.
- **Servidor:** Node.js, Express, Socket.IO y MariaDB.
- **API:** PHP 8.2+, Laravel 12, Passport, Backpack y Stripe.
- **Infraestructura:** Docker Compose, MariaDB, nginx-proxy y phpMyAdmin.
- **Escritorio:** Electron y electron-builder.

## Puesta en marcha local

### Requisitos

- Docker Desktop
- Docker Compose v2
- Git

### Configuración

1. Clona el repositorio y entra en él:

   ```bash
   git clone https://github.com/Fritz-Ale/boombangCL.git
   cd boombangCL
   ```

2. Crea la red externa utilizada por el proxy:

   ```bash
   docker network create proxy-network
   ```

3. Crea los archivos de entorno a partir de los ejemplos y configura sus valores:

   ```bash
   cp .env.example .env
   cp api/.env.example api/.env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. En macOS, edita `/etc/hosts` (por ejemplo, con `sudo nano /etc/hosts`) y añade los dominios locales:

   ```text
   127.0.0.1 boombang.com
   127.0.0.1 api.boombang.com
   127.0.0.1 server.boombang.com
   127.0.0.1 play.boombang.com
   127.0.0.1 pma.boombang.com
   ```

5. Levanta los servicios disponibles:

   ```bash
   docker compose up db phpmyadmin api server client web --build
   ```

6. Ejecuta las migraciones y carga los datos iniciales:

   ```bash
   docker compose exec api php artisan migrate --force --no-interaction --seed
   docker compose exec api php artisan passport:install
   ```

7. Abre el cliente en [http://play.boombang.com](http://play.boombang.com).

> Los dominios locales requieren una instancia de `nginx-proxy` conectada a `proxy-network`. También puedes abrir la portada directamente desde [http://localhost:8001](http://localhost:8001) cuando el servicio `web` esté ejecutándose.

## Servicios locales

| Servicio | URL |
| --- | --- |
| Portal BoombangCL | [http://localhost:8001](http://localhost:8001) |
| Cliente del juego | [http://play.boombang.com](http://play.boombang.com) |
| API y panel administrativo | [http://api.boombang.com](http://api.boombang.com) |
| Servidor Socket.IO | [http://server.boombang.com:3000](http://server.boombang.com:3000) |
| phpMyAdmin | [http://pma.boombang.com](http://pma.boombang.com) |

## Comandos útiles

```bash
docker compose up -d
docker compose logs -f
docker compose build server
docker compose exec api php artisan migrate --force --no-interaction --seed
docker compose exec api ./vendor/bin/phpunit
docker compose exec api ./vendor/bin/pint
docker compose down
```

En macOS puedes detener y eliminar los contenedores de este entorno con `docker compose down`. El script `docker-clean.ps1` incluido en el proyecto está orientado a Windows.

## Documentación técnica

La carpeta [`doc/`](doc/) contiene documentación adicional sobre el sistema de avatares, bots conversacionales, caché, optimización y control de versiones del cliente.

El mapa técnico y estructural del repositorio (directorios, stacks, comandos y comunicación entre servicios) está en [`CLAUDE.md`](CLAUDE.md).

## Licencia

Se mantiene el archivo de licencia original y sus condiciones: Copyright © 2025 Evgeny Lyubeznyy. Todos los derechos reservados.

**Origen del código:** [GenRubiio/boombang-html5](https://github.com/GenRubiio/boombang-html5). **Repositorio BoombangCL:** [Fritz-Ale/boombangCL](https://github.com/Fritz-Ale/boombangCL).

Consulta [`LICENSE.txt`](LICENSE.txt) para conocer las condiciones y restricciones de uso.
