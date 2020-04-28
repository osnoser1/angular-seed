FROM nginx:1.17.10-alpine

ARG NGINX_HOST
ARG PROJECT_NAME

RUN adduser -u 82 -D -S -G www-data www-data

ADD nginx /etc/nginx
RUN mkdir /etc/nginx/sites-enabled

RUN envsubst '$$NGINX_HOST'< /etc/nginx/sites-available/example.com.conf > /etc/nginx/sites-available/$NGINX_HOST.conf
RUN ln -s /etc/nginx/sites-available/$NGINX_HOST.conf /etc/nginx/sites-enabled/
RUN rm /etc/nginx/sites-available/example.com.conf

RUN mkdir -p /var/www/$NGINX_HOST
ADD $PROJECT_NAME /var/www/$NGINX_HOST

EXPOSE 443
