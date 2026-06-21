FROM nginx:1.25-alpine

RUN apk add --no-cache ca-certificates tzdata

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/www/certbot /usr/share/nginx/html /etc/nginx/ssl /etc/nginx/conf.d

RUN chown -R nginx:nginx /var/www /var/log/nginx /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/nginx-health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
