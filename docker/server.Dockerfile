# Se construye con contexto = raíz del repo (npm workspaces):
#   docker build -f docker/server.Dockerfile -t yerbatapp-server .

FROM node:20-alpine AS base
WORKDIR /app
# openssl: requerido por los engines de Prisma.
# postgresql16-client: provee pg_dump/psql, usados por el módulo de Backups
# (debe matchear la versión mayor de la imagen "postgres:16-alpine" del compose).
RUN apk add --no-cache openssl postgresql16-client

# ── deps: instala dependencias de todo el monorepo (necesario por workspaces) ──
FROM base AS deps
COPY package.json package-lock.json* ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci

# ── build: genera Prisma Client y compila TypeScript ──
FROM deps AS build
COPY database ./database
COPY server ./server
RUN npm run prisma:generate --workspace=server
RUN npm run build --workspace=server

# ── runtime: imagen final, solo lo necesario para correr ──
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev --workspace=server --ignore-scripts

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY database ./database

EXPOSE 4000
CMD ["node", "server/dist/server.js"]
