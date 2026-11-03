# BoomBangCL — integración segura de reparaciones con la Mac

Rama de revisión: `fix/client-api-seguridad-20261103`  
Base: `main` (3 de noviembre de 2026). Este cambio no migra bases de datos ni publica servicios.

## Incluye

- Corrección de la ruta de iconos Line Awesome en el cliente HTML5.
- Ejemplo de variables de conexión locales para Laravel, Socket.IO y portal.
- Eliminación de la referencia a `api.boombang.com` que no se usa en el panel de correo, el cual funciona por Socket.IO.
- Desactivación de pagos Stripe por defecto; eliminación del reenvío de JWT por `postMessage`.
- Mensajes de la ventana de pago limitados al origen configurado y a la ventana abierta; un aviso de éxito **no acredita saldo**.
- Prueba automatizada `client/tests/deployment-safety.test.mjs` integrada en GitHub Actions.
- Corrección del texto del botón de acceso del portal; la página pública sigue siendo informativa.

## Lo que NO habilita

El cliente público aún requiere una URL real para Laravel (HTTPS), Node/Socket.IO (WSS), configuración de CORS, credenciales protegidas y una base de datos privada. El checkout real exige webhooks verificados en Laravel, validación transaccional e idempotencia. No habilitar `VITE_ENABLE_STRIPE_CHECKOUT=true` antes de verificar ese flujo de extremo a extremo; el flag del cliente no sustituye controles del servidor.

## Revisión y sincronización local — solo cuando se tenga acceso autorizado a la Mac

**Antes de hacer un merge:**

```bash
cd ~/Desktop/Alejandro/proyecto/boombangCL || exit 1
git branch --show-current
git status -sb
ls -lh ../boombangCL-respaldos/ 2>/dev/null
git fetch origin --prune
git log --oneline origin/main..origin/fix/client-api-seguridad-20261103
git diff --stat origin/main..origin/fix/client-api-seguridad-20261103
```

Si hay cambios rastreados sin confirmar, guardarlos con un commit selectivo o respaldo revisado **antes** de continuar. Preservar todos los archivos marcados `??`, SQL y `.env`. La rama local `respaldo/reparaciones-locales-20261103` contiene reparaciones que no forman parte de esta rama remota.

En la rama de respaldo local, tras comprobar que no habrá sobrescrituras:

```bash
git merge --no-commit --no-ff origin/fix/client-api-seguridad-20261103
# Si hay conflictos, no forzar: inspeccionar con git status y resolver.
node --test client/tests/deployment-safety.test.mjs
(cd client && npm run build)
git diff --cached --check
# Confirmar manualmente el merge SOLO después de validar.
```

En caso de conflictos no resueltos, usar `git merge --abort` (no ejecutar `git reset --hard`). No hacer `git clean -fd`, `git add .` ni `docker compose down -v`. No es necesario restaurar ni migrar MariaDB como parte de este cambio.

## Variables de desarrollo

`client/.env.example` describe `VITE_SERVER_URL`, `VITE_API_URL`, `VITE_API_BASE_URL` y `VITE_WEB_BASE_URL`. Hacer copia de seguridad del `client/.env` real y añadir únicamente las claves que falten. Ningún `VITE_*` puede contener secretos, ya que Vite los incluye en el navegador. Las URL `127.0.0.1` son **exclusivamente locales**: para usuarios externos se necesitan endpoints públicos seguros antes de habilitar el botón Jugar.
