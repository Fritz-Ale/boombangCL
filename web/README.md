# Sitio público BoomBangCL · comunidad chilena

Sitio estático **original** en español de Chile, desarrollado de manera independiente. No está afiliado a BoomBang.tv ni Boombang.cc y no reutiliza el código de Yocomania Web. Los recursos existentes del juego conservan sus créditos y términos de licencia.

## Secciones disponibles

- `index.html`: portada, experiencias, acceso local y enlaces a la comunidad.
- `comunidad.html`: reglas de convivencia, privacidad, propuestas públicas y agenda chilena.
- `mejoras.html`: hoja de ruta filtrable por funcionalidades presentes en el repositorio, prioridades y futuras ideas. «En el código» no equivale a «funcionando en producción».
- `eventos.json`: agenda editorial de actividades **confirmadas** (vacía hasta recibir confirmación).
- `comunidad.js`: horario `America/Santiago`, agenda, propuesta mediante GitHub y filtros sin backend.
- `comunidad.css`: componentes adaptables a escritorio y móvil.
- `styles.css` / `script.js`: diseño y navegación ya existentes.

## Publicar una actividad en la agenda

Añade a `eventos.json` un elemento por evento confirmado:

```json
[
  {
    "titulo": "Nombre del evento confirmado",
    "descripcion": "Qué ocurrirá y cómo participar.",
    "fecha_utc": "2027-01-15T22:00:00Z"
  }
]
```

**El ejemplo no es un evento real.** Guarda fechas en ISO 8601 UTC con `Z`; el frontend las convierte al horario de Chile continental con cambios de horario de verano incluidos. Los eventos pasados desaparecen de la agenda automáticamente. No añadas datos personales, invitaciones privadas ni enlaces sin revisión. No se almacenan inscripciones.

## Propuestas de la comunidad

El formulario **no envía datos a la web ni los guarda**: abre un borrador de `Issues → New` en GitHub. El usuario necesita una cuenta GitHub, y el repositorio debe tener habilitadas las incidencias. Las incidencias son públicas: nunca publicar allí denuncias sensibles, datos personales o documentos privados. Hace falta un canal privado seguro antes de abrir reportes de abuso dentro del juego.

## Desarrollo local

Desde la raíz del repositorio:

```bash
docker compose up --build web
# Portal: http://localhost:8001
# Comprobaciones: node --test web/tests/*.test.cjs
```

El enlace del juego `http://play.boombang.com` apunta al **cliente de desarrollo local**, no a un servidor público. No se anuncia un lanzamiento activo, un chat web conectado ni cifras de jugadores en línea.

## Preparación del futuro dominio .cl

1. Comprobar la disponibilidad y, si se desea, registrar el dominio elegido mediante [NIC Chile](https://www.nic.cl/dominios/). **La presencia de BoomBangCL en este repositorio no significa que un dominio .cl esté registrado.**
2. Publicar la carpeta `web/` como sitio estático en un proyecto de **Cloudflare Pages** (directorio de salida `web` según el método de despliegue; si la raíz del proyecto es `web/`, usar `.`).
3. En **Workers & Pages → proyecto → Custom domains** agregar el nombre de dominio adquirido. Para un dominio raíz, agregar su zona en Cloudflare y delegar los servidores DNS desde el registrador. Ver [documentación oficial de Cloudflare](https://developers.cloudflare.com/pages/configuration/custom-domains/).
4. Verificar HTTPS, enlaces, `/comunidad.html`, `/mejoras.html` y `/eventos.json` antes de anunciar el dominio.
5. Alojamiento del juego, Socket.IO, API Laravel y base de datos requieren despliegue separado: Cloudflare Pages no los ejecuta por sí solo. Configurar en producción URLs, CORS, autenticación, correo y medidas antiabuso.

No se añaden credenciales ni URL de producción ficticias. **No publicar direcciones IP locales en el sitio de producción** ni afirmar que existen cuentas/eventos activos hasta conectarlos.

## Siguientes integraciones sugeridas

Priorizar informes privados de abuso y moderación, sesión única entre web y juego, directorio seguro de salas, novedades con editor administrativo, y calendario con revisión previa. Antes de implementar intercambio, comercio o perfiles públicos, diseñar autorización, límites de uso, auditoría, seguridad para menores y recuperación de cuentas.

Consulta `../LICENSE.txt` y la [investigación de funcionalidades](../doc/research/boombang-cl-comunidad-chile-2026.md).
