# Sitio web de BoombangCL

Portada pública **original**, en español y adaptable a móviles, inspirada en la navegación temática y presentación de las páginas boombang.tv y boombang.cc. **No** reutiliza sus archivos ni el código de Yocomania Web.

## Contenido
- index.html: portada, navegación, secciones informativas, juego, comunidad y preguntas frecuentes.
- styles.css: diseño responsivo con temática tropical.
- script.js: menú móvil, revelado visual accesible y año automático.
- nginx.conf y Dockerfile: publicación estática con Nginx.
- Imágenes: se copian durante la construcción desde doc/screenshots/ del propio repositorio.

## Ejecutar
Desde la raíz del repositorio, con Docker y la red proxy-network configurada:

    docker compose up --build web

Abre **http://localhost:8001** para ver la portada.

El enlace «Abrir cliente local» utiliza http://play.boombang.com (la URL de desarrollo descrita en la documentación del proyecto). Para jugar, el cliente y sus servicios (API, servidor multijugador, base de datos) deben estar ejecutándose y tener los dominios locales configurados.

## Alcance actual
Es un **sitio informativo estático**: no incorpora aún inicio de sesión, registro, sistema de noticias dinámico ni conexión de jugadores en vivo. No afirma que existan usuarios conectados o que un lanzamiento esté activo. Esas integraciones requerirán una API segura y configuración de despliegue.

Se mantienen los créditos y restricciones del proyecto de origen; consulta ../LICENSE.txt.
