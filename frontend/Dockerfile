FROM node:20-alpine AS builder

ENV NODE_ENV=production

ARG VITE_API_URL=/api
ARG VITE_WS_URL=/ws
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm rebuild esbuild && \
    npm cache clean --force

COPY . .

RUN npm run build && \
    npm cache clean --force

FROM nginx:1.25-alpine

RUN apk add --no-cache curl ca-certificates tzdata

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY conf/nginx.conf /etc/nginx/nginx.conf 2>/dev/null || true

RUN mkdir -p /var/www/certbot && \
    chown -R nginx:nginx /usr/share/nginx/html /var/www

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
