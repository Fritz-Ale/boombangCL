FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/index.html web/comunidad.html web/noticias.html web/ayuda.html web/cuenta.html web/foro.html web/chat.html web/catalogo.html web/ranking.html web/social.html web/moderacion.html web/normas.html web/privacidad.html web/restablecer.html web/avance.html web/reference-design.css web/styles.css web/portal.css web/live.css web/avance.css web/script.js web/portal.js web/portal-app.js web/social-app.js web/moderacion.js web/password-reset.js web/avance.js web/avance-data.json /usr/share/nginx/html/
COPY doc/screenshots/ /usr/share/nginx/html/screenshots/
EXPOSE 80
