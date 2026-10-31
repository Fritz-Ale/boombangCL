FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/index.html web/comunidad.html web/noticias.html web/ayuda.html web/styles.css web/portal.css web/script.js web/portal.js /usr/share/nginx/html/
COPY doc/screenshots/ /usr/share/nginx/html/screenshots/
EXPOSE 80
