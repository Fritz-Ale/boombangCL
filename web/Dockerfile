FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
# Mantener el contenedor alineado con la salida estática de Cloudflare Pages.
COPY web/index.html web/comunidad.html web/mejoras.html \
     web/styles.css web/comunidad.css web/ui-improvements.css \
     web/script.js web/comunidad.js web/eventos.json /usr/share/nginx/html/
COPY doc/screenshots/ /usr/share/nginx/html/screenshots/
EXPOSE 80
