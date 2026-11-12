# Integración Laravel y catálogo público — BoomBangCL

La portada aprobada se mantiene. El explorador publica capturas PNG originales del repositorio bajo `/screenshots/`, sin generación con IA ni dependencia de `raw.githubusercontent.com`.

## Catálogo público
La ruta `GET /portal/catalog` está implementada mediante Cloudflare Pages Functions (solo lectura). Para habilitar la consulta real, configure la variable **BBCL_API_ORIGIN** en Cloudflare Pages (Production) con la raíz HTTPS de su servidor Laravel, por ejemplo `https://api.ejemplo.cl` (no incluir rutas ni credenciales). El backend debe tener su endpoint público `/portal/catalog` accesible y operativo.

No use la URL de BoomBang.tv ni enlaces externos de terceros como origen. No configure secretos de compras o del emulador en el navegador. El proxy elimina campos no necesarios, no reenvía cookies ni tokens del usuario, deshabilita el caché e informa 503 cuando falta el servicio.

## Funciones no habilitadas
La página de exploración no permite comprar objetos, modificar monedas, ver inventarios personales ni autenticar jugadores. Estas operaciones requieren una arquitectura de sesión y seguridad verificada, el backend MariaDB y el servidor de juego. No se incluye un login falso.

## Comprobaciones
- Despliegue Pages de la rama `site/boombangcl-prototipo-20261112`.
- Verificar `/explorar.html` y los tres recursos `/screenshots/*.png`.
- `GET /portal/catalog`: 503 JSON mientras falte `BBCL_API_ORIGIN`; 200 JSON `{available:true,items:[...]}` cuando el servidor real responda.
- No modificar `main` ni el despliegue `bbcl.pages.dev`.
