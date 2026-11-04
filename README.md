# ECI-MyCampus Backend

Monolito modular de ECI-MyCampus: identidad, catálogo del campus y eventos, en un solo proceso y una sola API para los clientes web y móvil.

- **Stack:** Node.js 22, TypeScript estricto, Fastify 5, Zod 4, Prisma 6, PostgreSQL 16.
- **Arquitectura:** [`docs/architecture/MODULAR_MONOLITH.md`](docs/architecture/MODULAR_MONOLITH.md)
- **Decisiones:** [`docs/architecture/ARCHITECTURE_DECISIONS.md`](docs/architecture/ARCHITECTURE_DECISIONS.md)
- **Cumplimiento de la guía de backend:** [`docs/architecture/GUIDE_COMPLIANCE.md`](docs/architecture/GUIDE_COMPLIANCE.md)
- **Despliegue en Azure:** [`docs/deployment/AZURE.md`](docs/deployment/AZURE.md)
- **Auditoría inicial:** [`docs/audit/PROJECT_AUDIT.md`](docs/audit/PROJECT_AUDIT.md)
- **Cliente web:** repo `eci-mycampus-web`.

## Ejecución local

Requiere Node.js 22 o superior y PostgreSQL 16 (o Docker para levantarlo).

```bash
cp .env.example .env
npm install
npx prisma generate
docker compose up -d db
npx prisma migrate deploy
npm run dev
```

La API queda en `http://localhost:4000`, y la documentación interactiva en `/docs`.

Si ya tienes PostgreSQL, omite el comando de Docker y ajusta `DATABASE_URL` en `.env`.

Para cargar el catálogo de demostración, ejecuta `npm run prisma:seed`. Es idempotente. Si defines `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`, también crea un usuario `ADMIN`, porque aún no hay endpoint para gestionar roles. Otros roles se asignan en la base de datos.

## Variables de entorno

Solo `src/config/env.ts` las lee, y las valida al arrancar: si algo es inválido, el proceso no inicia.

| Variable | Obligatoria | Por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Sí | | Conexión a PostgreSQL. Los esquemas están en `prisma/schema` |
| `JWT_SECRET` | Sí | | Mínimo 16 caracteres. El valor de `.env.example` solo se acepta con `NODE_ENV=development` o `test` |
| `NODE_ENV` | No | `development` | `development`, `test` o `production` |
| `PORT` | No | `4000` | Puerto HTTP |
| `CORS_ORIGIN` | No | Ver abajo | Orígenes separados por coma |
| `TRUST_PROXY` | No | `false` | `true` solo detrás de un proxy que controle `X-Forwarded-For`, como el ingress de Azure |
| `RESEND_API_KEY` | No | | Sin clave, los correos solo se escriben en el log |
| `EMAIL_FROM` | No | `ECI-MyCampus <no-reply@ecimycampus.dev>` | Remitente de correos |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | No | | Solo para el seed. Las lee `prisma/seed.ts`, que no forma parte de la aplicación |

Sin `CORS_ORIGIN`, `NODE_ENV=development` o `test` reflejan el origen de la petición; cualquier otro caso no habilita CORS. La web llega por rewrites del mismo origen y las apps móviles nativas no están sujetas a CORS, así que solo hace falta definirla si un navegador llama a la API desde otro dominio.

## API

| Módulo | Método y ruta | Acceso |
| :--- | :--- | :--- |
| Sistema | `GET /health` (proceso vivo), `GET /health/ready` (base de datos disponible), `GET /docs` | Público |
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | Público |
| Auth | `GET /api/v1/auth/me` | Autenticado |
| Campus | `GET /api/v1/campus/buildings`, `/buildings/:id`, `/faculties`, `/sports` | Público |
| Events | `GET /api/v1/events/radar` | Público |
| Events | `GET /api/v1/events/:id` | Público; los no publicados, solo organizador y moderación |
| Events | `POST /api/v1/events` | `ESTUDIANTE`, `DOCENTE`, `ENTRENADOR`, `MODERADOR`, `ADMIN` |
| Events | `PATCH /api/v1/events/:id/approve`, `/reject` | `MODERADOR`, `ADMIN` |
| Events | `PATCH /api/v1/events/:id/cancel` | Organizador o moderación |
| Events | `POST /api/v1/events/:id/register`, `/reports` | Autenticado |

En Azure, usa `/health` para la sonda de liveness y `/health/ready` para la de readiness.

La autenticación usa `Authorization: Bearer <token>`, con el token que devuelve `/login` (vigencia de 7 días).

Todo error responde con el mismo formato:

```json
{ "status": 422, "error": "Unprocessable Entity", "mensaje": "...", "path": "/api/v1/events/..", "timestamp": "..." }
```

Los errores 400 de validación incluyen además `detalles` con `campo` y `mensaje`.

### Ciclo de vida de un evento

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> PUBLICADO: submit (organizador autorizado)
    BORRADOR --> PENDIENTE_APROBACION: submit
    PENDIENTE_APROBACION --> PUBLICADO: approve
    PENDIENTE_APROBACION --> RECHAZADO: reject
    BORRADOR --> CANCELADO: cancel
    PENDIENTE_APROBACION --> CANCELADO: cancel
    PUBLICADO --> CANCELADO: cancel
    REUBICACION_LOGISTICA_PENDIENTE --> CANCELADO: cancel
```

Cualquier otra transición responde `422`. `REUBICACION_LOGISTICA_PENDIENTE` y `ARCHIVADO` existen en el modelo, pero hoy ningún endpoint lleva a esos estados.

## Estructura

```text
├── .github/workflows/ci.yml
├── docs/                  # Auditoría, arquitectura y decisiones
├── prisma/seed.ts         # Datos de arranque idempotentes
├── prisma/schema/         # base.prisma, un archivo por módulo y migrations/
├── src/
│   ├── app.ts             # Plugins transversales y registro de módulos
│   ├── container.ts       # Composition root
│   ├── server.ts          # Arranque y apagado ordenado
│   ├── config/env.ts      # Variables de entorno
│   ├── shared/            # Errores, seguridad, base de datos y contrato de módulo
│   └── modules/           # auth, campus y events, con su index.ts como API pública
├── tests/
│   ├── architecture/      # Límites entre módulos y contrato de identidad
│   ├── integration/       # PostgreSQL real
│   ├── shared/
│   └── auth/, campus/, events/
├── Dockerfile
└── docker-compose.yml
```

## Base de datos

- Una base PostgreSQL con tres esquemas: `auth_schema`, `campus_schema` y `events_schema`.
- Crear una migración tras cambiar un `.prisma`: `npm run prisma:migrate`.
- Aplicar migraciones en un entorno: `npm run prisma:deploy`.
- **Base creada antes de existir las migraciones:** no apliques la inicial a ciegas. Revisa las diferencias y márcala como aplicada con `npx prisma migrate resolve --applied 20261104000000_init`. Esa migración hace opcional `audit_logs.actor_id`, un cambio que una base anterior aún no tendría.

## Pruebas

```bash
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Las pruebas de integración se omiten sin `TEST_DATABASE_URL`. Para correrlas, usa una base desechable con las migraciones aplicadas. Su nombre debe contener `test`, porque estas pruebas borran datos:

```bash
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/ecimycampus_test npx prisma migrate deploy
TEST_DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/ecimycampus_test npm test
```

## Despliegue

```bash
JWT_SECRET=<secreto-de-produccion> docker compose up --build
```

Compose levanta PostgreSQL, aplica migraciones y arranca el backend en el puerto 4000. PostgreSQL solo escucha en `127.0.0.1`. Fuera de tu máquina, define también `POSTGRES_PASSWORD`. Si falta `JWT_SECRET`, el backend no arranca.

## Historial

Este repo consolida los servicios de autenticación, campus y eventos, cuyos repos ya se retiraron. Para consultar su historial original:

```bash
git log -- services/auth-service
```

Usa `campus-service` o `events-service` para los otros dos.

## Flujo Git

| Rama | Uso |
| :--- | :--- |
| `main` | Versión estable |
| `develop` | Integración |
| `feature/*`, `refactor/*`, `fix/*`, `docs/*` | Un objetivo por rama, con PR hacia `develop` |

Los commits son atómicos y siguen Conventional Commits, por ejemplo `fix: require JWT secret`. Nada experimental entra directamente a `main`.

## Convenciones

- **Límites:** un módulo solo importa `shared` y el `index.ts` de otro módulo. `tests/architecture/module-boundaries.test.ts` lo verifica.
- **Módulo nuevo:** crea `src/modules/<nombre>` con su `index.ts`, conéctalo en `container.ts` y añade su archivo Prisma con su propio esquema.
- **Capas:** `DTO <-> Domain <-> Entity` con mappers explícitos. El dominio no importa Fastify, Prisma ni Zod.
- **Controladores:** delgados y sin `try/catch`. Las excepciones de `shared/errors` se traducen en un solo punto.
- **Dependencias:** por constructor, conectadas solo en `module.ts` y `container.ts`.
- **Entorno:** nunca leas `process.env` fuera de `config/env.ts`, ni versiones secretos.
