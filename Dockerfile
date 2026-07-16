# Build the static site
FROM node:20.16.0-bookworm AS build

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static output into /app/build
COPY . .
RUN npm run build

# Serve the static site with nginx
FROM nginx:1.27-alpine AS serve

# The app relies on SharedArrayBuffer (multithreaded WASM codecs), which
# requires cross-origin isolation. These headers mirror serve.json.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1
