# YerbatApp

ERP agropecuario para una empresa yerbatera (Argentina). Monorepo con API REST (Node/Express/Prisma) y SPA (React 19/Vite), preparado para multi-tenant, despliegue en VPS vía Docker Compose + Nginx, y consumo desde una futura app Android.

Ver arquitectura completa, ERD y roadmap en [`docs/architecture.md`](docs/architecture.md) y [`docs/erd.md`](docs/erd.md).

## Requisitos

- Node.js ≥ 20
- Docker + Docker Compose (para Postgres local, o instalación nativa de PostgreSQL 15+)

## Puesta en marcha (desarrollo)

```bash
cp .env.example .env          # completar secrets de JWT, etc.
npm install                   # instala client + server (npm workspaces)

docker compose -f docker/docker-compose.yml up -d postgres

npm run prisma:migrate        # crea las tablas
npm run prisma:seed           # tenant demo + usuario admin + campos de ejemplo

npm run dev                   # levanta API (http://localhost:4000) y client (http://localhost:5173)
```

Usuario admin sembrado: ver `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` en `.env`.

Documentación interactiva de la API: `http://localhost:4000/api/docs`.

## Scripts útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Corre server + client en paralelo |
| `npm run build` | Build de producción de ambos workspaces |
| `npm test` | Corre los tests de server y client |
| `npm run prisma:studio` | Explorador visual de la base de datos |

## Estructura

```
client/     SPA React 19 + Vite + TypeScript
server/     API Express + TypeScript (Clean Architecture)
database/   schema.prisma, migraciones, seed
docker/     docker-compose (dev/prod), Nginx, Dockerfiles
docs/       arquitectura, ERD
uploads/    archivos subidos por usuarios (adjuntos, fotos, docs)
```

## Despliegue en VPS (Hostinger)

Ver guía en [`docker/README.md`](docker/README.md).
