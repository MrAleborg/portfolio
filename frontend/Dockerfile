# syntax=docker/dockerfile:1

# Build the static site.
FROM node:24-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Base URL of the backend API, baked into the bundle at build time.
ARG VITE_API_URL
RUN npm run build


# Serve it with nginx, as a non-root user on port 8080.
FROM nginxinc/nginx-unprivileged:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 8080

# 127.0.0.1, not localhost: localhost resolves to ::1, and nginx listens on IPv4.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8080/"]
