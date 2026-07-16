# Arquitectura — YerbatApp

## Visión general

```
Cliente (React SPA / futura app Android)
        │ HTTPS (JSON REST)
        ▼
   Nginx (proxy inverso, TLS, gzip, static client)
        │
        ▼
  Express API (Node + TS)
   ├─ routes        → declaran endpoints + swagger jsdoc
   ├─ middlewares    → auth (JWT), rbac (roles), tenant, validate (zod), rateLimit, errorHandler
   ├─ controllers    → parsean req/res, delegan a services, sin lógica de negocio
   ├─ services       → lógica de negocio, orquestan repositories
   ├─ repositories    → único punto de acceso a Prisma (patrón Repository)
   ├─ dtos/validation → zod schemas (request/response shape)
   └─ shared/errors   → AppError tipado, mapeado a códigos HTTP
        │
        ▼
   Prisma ORM → PostgreSQL
```

Cada módulo de negocio (`server/src/modules/<modulo>/`) sigue Clean Architecture con capas separadas:
`*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.repository.ts`, más `*.dto.ts` (mapeo de entidades Prisma a respuestas seguras) y `*.validation.ts` (schemas Zod). Los repositorios son el único lugar que importa `@prisma/client`.

## Multi-tenant

Estrategia *shared schema* con columna `tenantId` en cada entidad raíz (`Campo`, `User`, `Cliente`, `Proveedor`, `Factura`, `CuentaFinanciera`, `Tarea`, `Notificacion`, `EmpresaConfig`, `BackupLog`). Las entidades hijas (`Cultivo`, `CampoNota`, `AplicacionInsumo`, etc.) heredan el alcance del tenant a través de su relación con la entidad raíz, evitando duplicar la columna donde no aporta.

Hoy existe un único `Tenant` sembrado (la empresa yerbatera). `tenantMiddleware` resuelve el tenant activo desde el JWT (`req.auth.tenantId`) e inyecta `req.tenantId`; todos los repositorios filtran por ese valor. Para activar SaaS multi-cliente en el futuro, solo hace falta abrir el alta de tenants y decidir cómo se resuelve el tenant en el login (hoy: 1 email = 1 tenant fijo) — no se toca la capa de repositorios ni las rutas.

## Autenticación y autorización

- **JWT de acceso**: 15 minutos, payload `{ sub, tenantId, rol }`.
- **Refresh token**: 7 días, se persiste **hasheado** (sha256) en `RefreshToken`, con rotación en cada uso (`POST /auth/refresh` revoca el token usado y emite uno nuevo).
- **Passwords**: bcrypt, 12 rounds (configurable por `BCRYPT_SALT_ROUNDS`).
- **Recuperación de contraseña**: token de un solo uso (`PasswordResetToken`, hasheado, expira en 1h), enviado por email vía `IMailer` (nodemailer si hay SMTP configurado; si no, se loguea en consola para desarrollo).
- **Roles**: `ADMIN | SUPERVISOR | EMPLEADO`, aplicados con el middleware `rbac(...roles)` por ruta.
- **Auditoría**: `ActivityLog` (cambios en entidades) y `LoginHistory` (accesos, exitosos y fallidos, con IP/user-agent) — expuesto en `GET /auth/login-history`.

## Seguridad

`helmet`, `cors` restringido a `CLIENT_URL`, `express-rate-limit` (global + límite estricto en `/auth/*`), validación estricta de todo input con Zod (`validate` middleware sanitiza y reemplaza `req.body/params/query`), manejo centralizado de errores (`error.middleware.ts`, incluye mapeo de errores conocidos de Prisma como `P2002`/`P2025`), logs estructurados con `pino`.

## Documentación de la API

Swagger se genera automáticamente desde anotaciones `@openapi` en cada `*.routes.ts` (swagger-jsdoc + swagger-ui-express), servido en `/api/docs`. Al agregar un endpoint nuevo, la documentación se actualiza sola con el próximo build — no hay un doc manual separado que se pueda desincronizar.

## Frontend

- **TanStack Query** para todo el estado de servidor (cache, invalidación, refetch); **Zustand** solo para estado de cliente puro (`auth.store` con persistencia de sesión, `ui.store` para tema claro/oscuro).
- **Axios** con interceptor que adjunta el `accessToken` y renueva automáticamente vía `/auth/refresh` ante un 401, reintentando la request original.
- **React Hook Form + Zod** en todos los formularios, con los mismos criterios de validación que el backend.
- **TailwindCSS** con paleta de marca (`brand` = verde oscuro/yerba mate, ver `tailwind.config.ts`), modo claro/oscuro por clase (`dark:`) sincronizado con `ui.store`.
- **PWA**: `vite-plugin-pwa` configurado (manifest + service worker con auto-update); el modo offline-first se profundiza en una fase posterior.

## Testing

- **Server**: Vitest, tests unitarios de `service` con repositorios mockeados (sin dependencia de una base de datos real para correr en CI).
- **Client**: Vitest + Testing Library para componentes y utilidades.

## Almacenamiento de archivos

Los adjuntos (notas de campo, documentos, fotos) se guardan en `/uploads/<módulo>/<subcarpeta>/` vía Multer, con nombre de archivo aleatorio (UUID) para evitar colisiones y path traversal. Express sirve ese directorio como estático en `/uploads`. En producción el directorio se monta como volumen Docker (`uploads_data`) para persistir entre despliegues.

## Migración a Supabase

El schema y el código no referencian nada específico de un proveedor de Postgres. Migrar consiste en: crear el proyecto en Supabase, correr `prisma migrate deploy` contra su `DATABASE_URL`, y actualizar la variable de entorno (opcionalmente agregar `directUrl` en el datasource para usar el pooler de Supabase). No se toca ninguna línea de `schema.prisma` ni de los repositorios.

## Roadmap por fases

| Fase | Contenido | Estado |
|---|---|---|
| 0–3 | Monorepo, Docker, Prisma schema completo + seed, Auth/Users/Roles, Dashboard con KPIs reales, Campos + Cultivos + Notas/Documentos/Fotos (API + UI completos) | ✅ Entregado |
| 4 | Rendimientos: `Campania` (CRUD) + `Rendimiento` (CRUD, rendimiento/ha calculado automáticamente a partir de la superficie del campo) + comparativas históricas por campo/cultivo/campaña (`GET /rendimientos/comparativa`) | ✅ Entregado |
| 5 | Fertilizantes/Herbicidas (`AplicacionInsumo`, tipo tomado del producto elegido) + Proveedores de insumos (CRUD + catálogo de productos + historial de aplicaciones) + estadísticas automáticas (promedio/ha, promedio por cultivo, promedio anual, costo/ha, costo total) vía `GET /insumos/estadisticas` | ✅ Entregado |
| 6 | Tareas Agrícolas: CRUD + semáforo (🔴 vencida/alta prioridad, 🟡 próxima a vencer, 🟢 en tiempo) + vista calendario + filtros + adjuntos. Dashboard actualizado con KPIs de "Tareas pendientes" y "Alertas" | ✅ Entregado |
| 7 | Gestión Financiera: cuentas (caja/bancos, saldo actual calculado), categorías, centros de costo, movimientos (+ adjuntos) y reportes automáticos (`GET /finanzas/balance` por rango de fechas — sirve para mensual o anual —, `GET /finanzas/flujo-caja` con saldo acumulado por día/mes) | ✅ Entregado |
| 8 | Clientes (CRUD) + cuenta corriente comercial para Clientes y Proveedores (`GET/POST /clientes/:id/cuenta-corriente`, `GET/POST /proveedores/:id/cuenta-corriente`) con saldo calculado como ledger (VENTA/COMPRA suman deuda, COBRO/PAGO restan) | ✅ Entregado |
| 9 | Facturación (A/B/C, Venta/Compra, adjuntos PDF/imagen) — **genera automáticamente el movimiento de cuenta corriente** del cliente/proveedor al emitirse — + Panel IVA (`GET /facturas/iva`: débito/crédito fiscal y saldo técnico por mes) + exportación real a Excel (`exceljs`) y PDF (`pdfkit`) vía `GET /facturas/iva/exportar` | ✅ Entregado |
| 10 | Módulo Reportes transversal: 12 reportes (Producción, Costos, Rentabilidad, Cultivos, Campos, Químicos, Proveedores, Clientes, Facturación, IVA, Caja, Tareas) sobre un único endpoint parametrizado `GET /reportes/:tipo`, reutilizando los repositorios de cada módulo — sin duplicar lógica de negocio. Exportación real a PDF/Excel/CSV vía un exportador genérico compartido (`shared/utils/exporters.ts`) | ✅ Entregado |
| 11 | Notificaciones automáticas (cron de tareas con semáforo rojo/amarillo y de facturas vencidas, con deduplicación por ventana horaria) + Backups automáticos/manuales de PostgreSQL (`pg_dump`/`psql` vía `child_process`, descarga autenticada, restauración con confirmación explícita) + Configuración avanzada (datos de empresa/logo, parámetros del sistema por tenant) | ✅ Entregado |
| 12 | PWA completa: runtime caching de la API (`NetworkFirst`) y de adjuntos (`CacheFirst`), persistencia de TanStack Query en `localStorage`, iconos/manifest reales con variante maskable, página de fallback offline, prompt de actualización de versión + indicador de conexión. Hardening de API para app Android: documentado en [`docs/api-mobile.md`](api-mobile.md) (auth/refresh, formato de errores, paginación, CORS para clientes nativos). Docker de producción endurecido para el módulo de Backups (`postgresql16-client` + volumen dedicado) y `prisma`/`tsx` disponibles en runtime para `migrate deploy`/`seed` vía `exec` | ✅ Entregado (código listo — despliegue efectivo en el VPS pendiente de datos reales del usuario) |
| 13 | Activación multi-tenant real (alta de tenants, aislamiento reforzado con RLS de Postgres) | Futuro |

Todas las tablas de las fases futuras **ya existen** en `schema.prisma` (ver [`erd.md`](erd.md)); lo que falta en cada fase es la capa de API + UI correspondiente.
