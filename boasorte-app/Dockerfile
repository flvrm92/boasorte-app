# BoaSorte web (Angular) — build context: this folder (boasorte-app/boasorte-app).
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The build runs on the VPS next to live services. By default it peaks above 2.2 GB (esbuild + parallel workers
# + prerender) and gets OOM-killed; one worker and a capped heap keep it around 2 GB at a small time cost.
ENV NG_BUILD_MAX_WORKERS=1 NODE_OPTIONS=--max-old-space-size=1024
RUN npm run build:prod

FROM nginx:1.29-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/boasorte-app/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q --spider http://127.0.0.1/healthz || exit 1
