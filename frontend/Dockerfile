# syntax=docker/dockerfile:1

# Build the static site.
FROM node:24.21.0-alpine3.24 AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build


# Serve it with nginx, as a non-root user on port 8080.
FROM nginxinc/nginx-unprivileged:1.31.6-alpine3.24

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 8080

# 127.0.0.1, not localhost: localhost resolves to ::1, and nginx listens on IPv4.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8080/"]
