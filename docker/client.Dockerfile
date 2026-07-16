# Se construye con contexto = raíz del repo (npm workspaces):
#   docker build -f docker/client.Dockerfile --build-arg VITE_API_URL=https://tudominio.com/api/v1 -t yerbatapp-client .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci

FROM deps AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY client ./client
RUN npm run build --workspace=client

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY docker/nginx/client-internal.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
