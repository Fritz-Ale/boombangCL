# Análisis funcional público de BoomBang.tv para BoomBangCL

Fecha: 2026-11-01. Análisis de páginas públicamente accesibles; **no es una auditoría del código fuente privado**.

## Referencias consultadas

- https://www.boombang.tv/es/ — portada y propuesta de juego
- https://www.boombang.tv/es/login — formulario de acceso
- https://www.boombang.tv/es/register — registro y elección de personaje
- https://www.boombang.tv/es/about — características de la comunidad
- https://www.boombang.tv/es/news/boombang-html5-enters-public-beta-820 — anuncio HTML5

## Componentes observables y equivalentes propios

| Experiencia observada | Implementación en BoomBangCL | Estado / condición |
| --- | --- | --- |
| Islas y salas | Cliente Phaser/Vue, capturas y selector de escenarios `web/site-game.js` | Selector informativo; juego real requiere servidor |
| Chat y amigos | Portal Laravel y funciones sociales existentes | Probar despliegue y autenticación real |
| Personalización de personaje | Cliente HTML5 y recursos del repositorio original | Verificar persistencia y sincronización |
| Minijuegos | Cliente y ranking del repositorio | Validar partidas y resultados con backend |
| Registro e inicio de sesión | Formularios y sesiones Laravel del portal | No habilitar en GitHub Pages estático |
| Entrada como invitado | Posible experiencia de exploración pública | No inventar sesiones ni identidades de jugador |
| Actividad y salas con usuarios | Posible consulta al servidor propio | No copiar ni simular conteos del sitio de referencia |

## Límites técnicos y de propiedad intelectual

La observación del navegador puede mostrar HTML, CSS y JavaScript enviados al cliente, pero no revela de manera confiable controladores internos, tablas privadas, claves, servicios o algoritmos de backend. No incorporar código propietario, recursos gráficos de terceros, textos extensos ni endpoints ajenos sin permiso o licencia compatible. Los componentes nuevos deben escribirse para BoomBangCL, documentarse y probarse.

## Cambio original incorporado

El explorador informativo de escenas de `web/site-game.js` ahora permite cambiar entre salas, islas y Golden Ring con flechas del teclado y teclas Inicio/Fin, además de clic o toque. La funcionalidad no solicita datos a BoomBang.tv y no presenta el juego como conectado.

## Próximos pasos verificables

1. Confirmar las pruebas automáticas del selector y la generación de la web estática.
2. Revisar la accesibilidad del registro y el inicio de sesión en el portal propio.
3. Comprobar autenticación, chat y presencia real con Laravel + Socket.IO.
4. Diseñar arte y componentes originales inspirados en la experiencia tropical, sin reutilizar recursos no autorizados.
