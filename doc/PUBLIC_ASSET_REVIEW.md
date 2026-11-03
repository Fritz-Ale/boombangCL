# Auditoría preliminar de recursos gráficos públicos — BoomBang CL

**Estado:** pendiente de revisión de derechos y autorización de publicación. Este documento es un inventario técnico; **no** certifica que se puedan reutilizar o redistribuir legalmente los recursos.

## Alcance y origen

La web pública estática de `gh-pages` usa capturas procedentes de `doc/screenshots/`, que ya estaban en el repositorio de referencia. El sitio no extrae imágenes de BoomBang.tv ni de otras páginas durante su compilación.

El archivo `LICENSE.txt` del repositorio declara **«Todos los derechos reservados»** y atribuye el software a **Evgeny Lyubeznyy (2025)**. Esa declaración **no** concede por sí sola autorización para redistribuir cada imagen, marca o recurso asociado. Debe verificarse además si existen derechos de terceros sobre la propiedad intelectual original de BoomBang.

## Capturas publicadas por el generador estático

| Captura | Uso de referencia | Estado de derechos |
| --- | --- | --- |
| `portada.png` | Portada principal y Noticias | Por verificar |
| `lobby.png` | Sección social y Galería | Por verificar |
| `sala-publica.png` | Tarjetas y explorador | Por verificar |
| `sala-privada.png` | Galería | Por verificar |
| `islas.png` | Tarjetas y explorador | Por verificar |
| `golden-ring.png` | Minijuegos y explorador | Por verificar |
| `personalizacion.png` | Avatares y Galería | Por verificar |
| `ranking.png` | Galería y rankings ilustrativos | Por verificar |
| `catalogo.png` | Objetos y Galería | Por verificar |

Otros recursos que existen en la carpeta de origen, como `admin.png` e `inventario.png`, no forman parte de la lista de nueve capturas publicada automáticamente.

## Comprobaciones técnicas incluidas

- La versión pública usa una lista cerrada de nueve capturas en `web/scripts/build-public-site.mjs` y `web/scripts/build-gallery.mjs`.
- Los tests verifican que las imágenes referenciadas existan y que todas las rutas locales sean resolubles.
- El centrado de imágenes se resuelve por CSS (`web/site-image-center.css`), sin modificar ni reexportar las imágenes originales.
- Las capturas se señalan como **referencia del código fuente** y no como juego conectado en tiempo real.
- El sitio mantiene un aviso de no afiliación oficial.

## Bloqueadores para aprobar la tarea de licencias

1. Identificar al autor y la titularidad real de **cada** imagen, avatar, audio, tipografía de terceros, marca y fuente de código; una captura puede contener varios elementos protegidos.
2. Solicitar autorización escrita cuando no exista una licencia explícita compatible con el uso previsto.
3. Confirmar alcance de permisos para publicar en GitHub Pages, distribuir el cliente y permitir uso público.
4. Registrar en un inventario firmado: recurso, titular, prueba del permiso, condiciones, atribución y fecha de revisión.
5. Sustituir o retirar del sitio cualquier recurso sin permiso verificable antes de difundir o lanzar el proyecto de forma más amplia.
6. Revisar el texto de privacidad y las condiciones de uso antes de habilitar cuentas y moderación pública.

**Decisión:** mantener pendiente la tarea `Revisión de activos, licencias y publicación`; esta auditoría solo prepara la revisión y no equivale a su aprobación.
