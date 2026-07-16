# Guía de integración — app Android

La API REST (`/api/v1`) es la misma que consume el cliente web: no existe (ni
se planea) un backend separado para mobile. Este documento resume las
convenciones que un cliente nativo (Kotlin + Retrofit/OkHttp, o similar) debe
respetar, y qué se endureció específicamente pensando en ese consumidor.

## 1. Base URL y versionado

- Base: `https://<dominio>/api/v1`.
- El prefijo `/v1` es el contrato estable: cambios incompatibles se publican
  como `/v2` en paralelo, nunca rompiendo `/v1` in-place.
- `GET /health` (sin prefijo `/v1`, sin auth) devuelve `{ status, timestamp }`
  — útil para el chequeo de conectividad de la app antes de mostrar pantallas
  que dependen de red.
- `GET /api/docs` (Swagger UI) y `GET /api/docs.json` (spec OpenAPI cruda) —
  el equipo Android puede generar código cliente desde el JSON si lo prefiere
  a mano.

## 2. Autenticación

Igual que el cliente web, no hay flujo especial para mobile:

1. `POST /auth/login { email, password }` → `{ accessToken, refreshToken, user }`.
2. Enviar `Authorization: Bearer <accessToken>` en cada request.
3. El `accessToken` expira en `JWT_ACCESS_EXPIRES_IN` (15 min por defecto). Al
   recibir `401` con `error.code === 'UNAUTHORIZED'`, llamar
   `POST /auth/refresh { refreshToken }` → nuevo par de tokens, y reintentar la
   request original una sola vez (igual que el interceptor de Axios del
   cliente web en `client/src/lib/axios.ts`).
4. **El refresh token rota en cada uso**: la respuesta de `/auth/refresh`
   incluye un `refreshToken` nuevo que reemplaza al anterior (el viejo queda
   revocado). Si la app guarda el refresh token en `EncryptedSharedPreferences`
   / Keystore, debe sobrescribirlo en cada rotación — reusar uno viejo
   devuelve `401`.
5. `POST /auth/logout { refreshToken }` revoca el token del lado servidor;
   llamarlo antes de borrar la sesión local.

No hay endpoint separado de "login mobile" ni un token de vida más larga:
usar el mismo flujo de rotación evita mantener dos políticas de expiración.

## 3. CORS y clientes nativos

`server/src/config/cors.ts` valida el header `Origin` contra `CLIENT_URL`. Un
cliente Android nativo (OkHttp/Retrofit) **no envía `Origin`** en sus
requests — CORS es un mecanismo que el navegador aplica, no el servidor a
requests sin navegador de por medio — así que esas llamadas ya pasan sin
tocar nada (`!origin` está permitido explícitamente). Esto solo importa si en
algún momento se empaqueta la app como WebView apuntando directo a la API
desde JS embebido: en ese caso hay que sumar el esquema/origen que use ese
WebView a `CLIENT_URL` (acepta una lista separada por comas).

## 4. Formato de errores

Todas las respuestas de error siguen el mismo sobre (`server/src/middlewares/error.middleware.ts`):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { } } }
```

Códigos más comunes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401),
`FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR`
(500). Parsear siempre por `error.code`, no por el texto de `message` (ese es
para mostrar al usuario, no para lógica condicional).

## 5. Paginación

Todos los listados usan el mismo shape:

```json
{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 } }
```

Query params: `?page=1&pageSize=20` (`pageSize` tope 100).

## 6. Archivos (fotos, documentos, backups)

- Subida: `multipart/form-data`, campo `archivo` (ver cada endpoint en
  Swagger para el nombre exacto de campo por módulo). Límite `MAX_UPLOAD_MB`
  (10MB por defecto).
- Descarga de adjuntos públicos (fotos de campo, documentos): URLs bajo
  `/uploads/...`, sin autenticación (pensado para `<img src>` directo).
- Descarga de backups de base de datos: `GET /backups/:id/descargar`, **sí**
  requiere `Authorization` y rol ADMIN — deliberadamente fuera de
  `/uploads` para no quedar expuesta como estática pública.

## 7. Rate limiting

- Global: `RATE_LIMIT_MAX` requests / `RATE_LIMIT_WINDOW_MS` (300 / 15 min
  por defecto) por IP, vía `RateLimit-*` headers estándar.
- `/auth/*`: límite más estricto (`AUTH_RATE_LIMIT_MAX`, 20 / 15 min) para
  frenar fuerza bruta de login. Un flujo de refresh automático agresivo (p.
  ej. reintentar sin backoff ante cualquier error de red) puede agotarlo —
  implementar backoff exponencial ante `429`.

## 8. Notificaciones push (pendiente)

El módulo de Notificaciones (in-app, `GET /notificaciones`) ya genera alertas
automáticas (tareas vencidas, facturas vencidas). Push real a dispositivos
(Firebase Cloud Messaging) **no está implementado**: requiere credenciales de
un proyecto Firebase que no existen en este entorno. Cuando se sume, el punto
de enganche natural es `alertas.service.ts` (ya centraliza la creación de
`Notificacion`) sumando un side-effect de envío FCM ahí mismo, más un
endpoint `POST /notificaciones/dispositivos` para que la app registre su
token. Documentado acá para no perderlo, no como trabajo ya hecho.

## 9. PWA como referencia de comportamiento offline

El cliente web (`client/`) es una PWA con cacheo de lecturas (`NetworkFirst`
para `GET /api/*`, persistencia de TanStack Query en `localStorage`). La app
Android nativa debería replicar la misma filosofía con su propia capa de
cache local (Room/DataStore) en vez de intentar compartir el `localStorage`
del navegador — son dos runtimes distintos — pero el criterio de "qué mostrar
sin conexión" (última respuesta 2xx conocida, con indicador visual de que
puede estar desactualizada) es el mismo que ya implementa el cliente web y
sirve como referencia de UX.
