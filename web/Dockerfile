FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/index.html web/styles.css web/script.js /usr/share/nginx/html/
COPY doc/screenshots/ /usr/share/nginx/html/screenshots/
EXPOSE 80
