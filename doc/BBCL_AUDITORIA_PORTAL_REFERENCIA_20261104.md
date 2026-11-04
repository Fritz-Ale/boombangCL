# Integración de la auditoría de jerarquía pública de BoomBang.tv

Fuente: archivo `BBCL_AUDITORIA_BOOMBANG_COMPLETA.json` entregado por el responsable del proyecto, con fecha de captura `2026-11-04T02:45:15.713Z`.

La auditoría informa **17 respuestas HTML de estado 200** y **0 errores HTTP**. Los recursos documentados se utilizan como referencia de jerarquía; no se copia el HTML original, su CSS de producción, sus logotipos, imágenes, scripts, fichas ajenas ni datos de sus usuarios.

## Mapa de secciones capturadas

| Sitio auditado | Jerarquía documentada | Destino existente en BBCL |
|---|---|---|
| `/es/` | Navegación global, Hero, Tu isla, Chat, Acciones, Minijuegos, actividad y VIP | `web/index.html` |
| `/es/community` | Ranking de logros/medallas/minijuegos/clanes | `web/comunidad.html` y `web/ranking.html` |
| `/es/community?ver=ranking` | Ranking | `web/ranking.html` |
| `/es/community?ver=amigos` | Amigos | `web/social.html` |
| `/es/community?ver=clanes` | Clanes | `web/social.html` |
| `/es/community?ver=salas` | Salas públicas y ocupación | `web/comunidad.html` |
| `/es/community?ver=galeria` | Galería | Solo referencia; no publicar imágenes sin revisión |
| `/es/community?ver=concursos` | Concursos | Requiere datos propios reales |
| `/es/community?ver=catalogo` | Rarezas y catálogo | `web/catalogo.html`; precios sin inventar |
| `/es/foro` | Categorías, temas y respuestas | `web/foro.html` |
| `/es/about` | Información del juego, seguridad, equipo, VIP y Club | `web/ayuda.html` |
| `/es/news` | Noticias y categorías editoriales | `web/noticias.html` |
| `/es/login` | Acceso | `web/cuenta.html`, no autenticación simulada |
| `/es/register` | Registro | `web/cuenta.html`, no formulario sin backend |
| `/es/vip` | VIP y comandos | Referencia documental; requiere lógica y autorización reales |
| `/es/descargas` | Acceso mediante plataformas | No anunciar aplicaciones de BBCL inexistentes |
| `/es/help` | Preguntas y soporte | `web/ayuda.html` |

## Criterios de implementación

1. Mantener la navegación observada: Inicio, Comunidad, Foro, Acerca de, Noticias, Acceso y Registrarte. Los enlaces de BBCL apuntan a páginas del propio proyecto, nunca al registro de BoomBang.tv.
2. Preservar las ocho capturas ya incluidas en la portada, sin generar sprites, kekos, escenarios ni imágenes promocionales nuevas.
3. Reutilizar la secuencia funcional: portada → características → salas/personajes/catálogo → comunidad/actividad → estado del acceso.
4. Los valores de ocupación, avatares, usuarios registrados, noticias y rankings del JSON son **una fotografía de BoomBang.tv**, no datos del servidor BBCL. No reutilizarlos como datos de producción.
5. No incorporar páginas HTML completas, estilos, fuentes o recursos gráficos externos sin revisar su licencia y permisos de publicación.
6. Diferenciar claramente interfaz de referencia y funcionalidades operativas: el JSON no prueba el funcionamiento de APIs, sockets, cuentas, inventario o pagos de BBCL.
7. La web pública estática continúa siendo informativa hasta que el backend esté desplegado y probado.

## Próximos hitos

- Conectar los módulos del portal a servicios reales de BBCL, con pruebas automáticas y permisos correctos.
- Mapear imágenes y recursos de la auditoría contra los assets existentes en el repositorio y revisar licencias.
- Validar diseño responsive, accesibilidad y navegación antes de integrar cambios en `main`.
