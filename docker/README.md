# Despliegue en VPS (Hostinger) con Docker Compose + Nginx + Let's Encrypt

> Estos archivos están preparados pero **no se ejecutan automáticamente**. Seguir esta guía manualmente cuando se decida desplegar.

## 1. Preparar el VPS

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

Apuntar el DNS del dominio (`tudominio.com` y `www.tudominio.com`) a la IP del VPS antes de continuar.

## 2. Clonar el repo y configurar variables

```bash
git clone <repo-url> yerbatapp && cd yerbatapp
cp .env.example .env
```

Editar `.env` con valores reales de producción:
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: strings aleatorios largos (`openssl rand -hex 32`)
- `POSTGRES_PASSWORD`: contraseña fuerte para Postgres
- `CLIENT_URL` / `VITE_API_URL`: `https://tudominio.com` y `https://tudominio.com/api/v1`
- Credenciales SMTP reales para recuperación de contraseña

## 3. Editar el dominio en la config de Nginx

Reemplazar `tudominio.com` en [`nginx/default.conf`](nginx/default.conf) por el dominio real.

## 4. Primer arranque (sin HTTPS todavía)

Comentar temporalmente el bloque `server { listen 443 ... }` en `default.conf` (Nginx no puede arrancar sin certificados existentes) y levantar el stack:

```bash
docker compose -f docker/docker-compose.prod.yml up -d --build postgres server client nginx
```

## 5. Emitir el certificado Let's Encrypt

```bash
docker compose -f docker/docker-compose.prod.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d tudominio.com -d www.tudominio.com \
  --email tu-email@dominio.com --agree-tos --no-eff-email
```

## 6. Activar HTTPS

Descomentar el bloque `443` en `default.conf`, y reiniciar Nginx:

```bash
docker compose -f docker/docker-compose.prod.yml restart nginx
docker compose -f docker/docker-compose.prod.yml up -d certbot   # renovación automática cada 12h
```

## 7. Migraciones y seed inicial

La imagen de `server` incluye `prisma` y `tsx` como dependencias de producción
(no solo de build) específicamente para poder correr estos comandos vía `exec`:

```bash
docker compose -f docker/docker-compose.prod.yml exec server \
  npx prisma migrate deploy --schema=/app/database/prisma/schema.prisma
```

El `seed.ts` crea un tenant y usuario ADMIN de **demo** — repasar/editar su
contenido antes de correrlo contra una base real de la empresa, o saltear este
paso y crear el primer ADMIN a mano:

```bash
docker compose -f docker/docker-compose.prod.yml exec server \
  npx tsx /app/database/prisma/seed.ts
```

## 8. Backups

Los backups (manuales o automáticos por cron) se generan desde la propia app
(módulo **Configuración → Backups**, sección "Configuración avanzada" del
roadmap) usando `pg_dump`/`psql`, ya instalados en la imagen de `server`
(paquete `postgresql16-client`) y persistidos en el volumen `backups_data`
(montado en `/app/backups`, fuera de `/uploads` para no quedar expuestos
públicamente — solo se descargan vía `GET /api/v1/backups/:id/descargar`,
autenticado y solo ADMIN).

El volumen `postgres_data` persiste los datos "en caliente" del propio Postgres.
Para un backup manual fuera de la app (por ejemplo antes de una migración riesgosa):

```bash
docker compose -f docker/docker-compose.prod.yml exec postgres \
  pg_dump -U yerbatapp yerbatapp > yerbatapp_$(date +%Y%m%d_%H%M%S).sql
```

## Actualizar una nueva versión

```bash
git pull
docker compose -f docker/docker-compose.prod.yml up -d --build server client
docker compose -f docker/docker-compose.prod.yml exec server \
  npx prisma migrate deploy --schema=/app/database/prisma/schema.prisma
```
