# Informe de cierre: migración a monolito modular

**Fecha:** 2026-11-04. Todo el trabajo es local: no se hizo push ni se abrieron PR. Las ramas `main` de todos los repos siguen sin cambios funcionales respecto al estado auditado.

## Estado inicial

Cuatro repos independientes: tres servicios Fastify + Prisma que no se comunicaban entre sí y compartían PostgreSQL y secreto JWT, y una web Next.js que no compilaba. Sin migraciones, CI ni compose. Detalle en [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md).

## Arquitectura anterior y nueva

| Aspecto | Antes | Ahora |
| :--- | :--- | :--- |
| Procesos de backend | 3 (puertos 4001, 4002, 4003) | 1 (puerto 4000) |
| Repositorios | 4 | 2: `eci-mycampus-backend` y `eci-mycampus-web`. App móvil prevista en un tercero |
| Dependencias de backend | 3 `package.json` | 1 |
| Excepciones, errores, Prisma, configuración | Copiados 3 veces | Uno solo en `shared` y `config` |
| Contrato JWT | Copia en cada lado, sin prueba | Tipo compartido y prueba entre módulos |
| Límites entre módulos | Por separación física | Prueba automática |
| Base de datos | 1 base, 3 esquemas, sin migraciones | Igual, con migración inicial verificada |

## Módulos consolidados

`auth`, `campus` y `events`, movidos con `git mv` conservando sus capas e historial. Una sola API, con 15 rutas en OpenAPI bajo `/api/v1`.

## Fortalezas conservadas

Capas `DTO <-> Domain <-> Entity`, patrón State, reserva atómica de cupos, Argon2id, contrato de error único, configuración validada al arrancar y todas las pruebas de comportamiento originales.

## Hallazgos resueltos

| ID | Resolución |
| :--- | :--- |
| C-02, H-11 | Dependencias actualizadas; `npm audit --omit=dev` da 0 |
| C-03 | Next 15.5.29 y PostCSS 8.5.32; `npm audit --omit=dev` da 0 |
| H-01, M-01 | `JWT_SECRET` obligatorio; secreto de ejemplo y CORS solo con `NODE_ENV` local explícito |
| H-04, H-05, H-06, M-10 | La web compila, tiene lockfile, Dockerfile corregido y 4 pruebas |
| H-07 | Migración inicial; sin deriva respecto al esquema (seeds pendientes) |
| H-08 | 6 pruebas de integración con PostgreSQL |
| H-10 | CI en ambos repos; no se ha ejecutado en GitHub |
| M-04, L-03 | `actorId` opcional; preview `multiSchema` retirado |
| A-01, A-03 | Monolito modular y contrato compartido |
| D-01 a D-11 | READMEs reescritos y código desactualizado corregido |

## Resultados de pruebas reales

| Verificación | Backend | Web |
| :--- | :--- | :--- |
| Typecheck | OK | OK |
| Pruebas | 162 de 162, incluidas 6 con PostgreSQL embebido | 4 de 4 |
| Cobertura (líneas) | 96,96 % (ramas 92 %) | No medida |
| Build | OK | OK |
| `npm audit --omit=dev` | 0 | 0 |

- **Sin `TEST_DATABASE_URL`** se omiten las 6 de integración y pasan las otras 156.
- **Concurrencia:** 20 inscripciones simultáneas sobre 5 cupos dieron 5 aceptadas, 15 rechazadas y 0 cupos restantes. 5 inscripciones duplicadas simultáneas dieron 1 aceptada y el cupo devuelto.
- **E2E en modo producción:** backend compilado y web con `next start` sobre PostgreSQL, a través del proxy: registro, login, perfil, creación de evento, permisos, errores de validación y rechazo del secreto de ejemplo.
- **Regresión:** comparación de 139 peticiones entre los servicios originales y el monolito, hecha por la revisión QA independiente. Los hallazgos se corrigieron o se documentaron como excepción, y después no se repitió la comparación completa: se cubrieron con pruebas nuevas.

## No verificado

- **Imágenes Docker y `docker compose`:** no hay Docker en la máquina. Revisados por lectura y simulando `npm prune`. Sin ejecutar.
- **GitHub Actions:** los comandos pasan en local con Node 24 y Windows; el flujo usa Node 22 y Linux.
- **Base existente:** se desconoce si hay alguna base real. El procedimiento está en el README.
- **Correo real con Resend:** no se envió ninguno; Resend subió de la versión 4 a la 6.

## Cambios de contrato

Están justificados en [`MODULAR_MONOLITH.md`](../architecture/MODULAR_MONOLITH.md): `/health` y `/docs` únicos, textos por defecto de Zod en `detalles[].mensaje`, y `/auth/me` exige el contrato `JwtClaims`. Además, `JWT_SECRET` ahora es obligatorio y sin `CORS_ORIGIN` no hay CORS fuera de local.

## Archivos eliminados y justificación

| Eliminado | Motivo |
| :--- | :--- |
| `services/*/{Dockerfile,.dockerignore,.gitignore,.env.example,package*.json,tsconfig*.json,vitest.config.ts}` | Reemplazados por sus equivalentes en la raíz |
| `services/*/README.md` | Contenido verificado y trasladado al README |
| `services/*/src/{app,server,container}.ts`, `config/env.ts`, `exceptions/*`, `lib/prisma.ts`, `error.response.dto.ts`, `events/src/security/auth.guard.ts`, `events/src/utils/logger.ts` | Consolidados en `src/` y `src/shared` |
| `services/*/prisma/schema.prisma` | Sustituidos por `prisma/schema/*.prisma` |
| `RecoverPasswordRequestSchema` | Sin ningún uso |
| Dependencia `zod` en web | Sin ningún import |

No se modificaron los tres repos de servicios, `main` de la web ni `eci-mycampus-starter`. Los repos de servicios se retiraron después (ADR-011), y todo el código original sigue en el historial de este repo.

## Archivos creados y modificados

- **Backend, nuevos:** `src/app.ts`, `src/container.ts`, `src/server.ts`, `src/config/env.ts`, `src/shared/**`, `src/modules/*/{index,module}.ts`, `prisma/schema/**`, `tests/architecture/**`, `tests/integration/**`, `tests/shared/**`, `tests/events/unit/request-contract.test.ts`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/ci.yml`, `README.md`, `docs/**`.
- **Backend, movidos:** el resto del código de servicios y sus pruebas, a `src/modules/*` y `tests/*`. Solo se ajustaron importaciones, identidad y arranque.
- **Web:** `src/app/page.tsx`, `src/lib/api.test.ts`, `next.config.ts`, `.env.example`, `Dockerfile`, `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `README.md`.

## Ramas y commits

Autoría verificada antes de cada tanda: `Oscar10lm <oscar.lasso-m@mail.escuelaing.edu.co>`, la identidad global ya configurada, sin modificarla. Ningún commit menciona a Claude. Se omitió a propósito la línea `Co-Authored-By` que el asistente añade normalmente.

| Repo | Commits en `develop` | Autores |
| :--- | :--- | :--- |
| `eci-mycampus-backend` | Ver `git log develop` | Oscar10lm; Jose Martinez en el historial importado |
| `eci-mycampus-web` | Ver `git log develop` | Oscar10lm; Jose Martinez en el historial previo |

- **Backend:** `main`, `develop`, `docs/project-audit`, `docs/architecture-documentation`, `refactor/modular-monolith-structure`, `refactor/consolidate-campus-module`, `refactor/consolidate-auth-module`, `refactor/consolidate-events-module`, `feature/module-boundaries`, `fix/environment-security`, `fix/dependency-security`, `feature/database-migrations`, `refactor/single-deployment`, `docs/final-documentation`, `refactor/remove-dead-code`, `fix/qa-review-findings`, `docs/closing-report`.
- **Web:** `main`, `develop`, `fix/web-build-and-proxy`, `refactor/single-deployment`, `docs/final-documentation`.

Cada rama se integró a `develop` localmente con `--no-ff` tras validarse, como pide el plan. Las ramas siguen disponibles, pero **al no haberse abierto PR, ya están integradas**: si el equipo quiere revisión por PR, debe hacerse sobre `develop` antes de pasar a `main`.

## Features

- **Completadas:** F1 a F11 del plan.
- **Pendientes, requieren decisión de producto:**
  - Verificación de correo (H-02) y límite de intentos (H-03).
  - Gestión de roles y seed de catálogos (H-07, H-09).
  - Revocación o renovación de tokens (M-02) y validación de `buildingId` y `facultyId` (M-03).
  - Cancelar inscripción, favoritos y resolución de denuncias (M-07).
  - Conexión real de la web a la API (M-08).
  - ESLint (M-09), helmet (M-05), registro de fallos de auditoría (M-06).
  - Migrar la configuración `package.json#prisma`, obsoleta de cara a Prisma 7.

## Riesgos vigentes

1. **C-01, sin resolver:** clave privada de Firebase en `eci-mycampus-starter`, dentro de OneDrive. Requiere que el equipo la revoque si sigue activa.
2. **H-02 y H-03:** cualquiera puede registrarse con un correo institucional ajeno, y no hay límite de intentos. Es prioritario antes de exponer la API a la app móvil.
3. **Docker y CI sin ejecutar.**
4. **Módulo a módulo:** el `PrismaClient` compartido permite técnicamente consultar tablas ajenas (ADR-005).
5. **Web de piloto:** muestra datos de demostración.

## Recomendaciones para el siguiente ciclo

1. Revocar la clave de Firebase.
2. Crear los remotos, hacer push y comprobar que el CI pase; correr `docker compose up --build` en una máquina con Docker.
3. Implementar verificación de correo y límite de intentos.
4. Crear el repo móvil a partir de la API, sin copiar la clave ni Firebase de `eci-mycampus-starter`.
5. Añadir seed y gestión de roles, para que la moderación sea alcanzable.
6. ~~Archivar los tres repos de servicios~~. Hecho de otra forma: se retiraron de la organización (ADR-011).

## Árbol final del backend

```text
eci-mycampus-backend/
├── .github/workflows/ci.yml
├── docs/
│   ├── architecture/{MODULAR_MONOLITH,ARCHITECTURE_DECISIONS}.md
│   └── audit/{PROJECT_AUDIT,CLOSING_REPORT}.md
├── prisma/schema/
│   ├── base.prisma, auth.prisma, campus.prisma, events.prisma
│   └── migrations/20261104000000_init/
├── src/
│   ├── app.ts, container.ts, server.ts
│   ├── config/env.ts
│   ├── shared/{database,errors,http,security,utils}/
│   └── modules/
│       ├── auth/{index,module}.ts + controllers, lib, mappers, models, repositories, routes, services, validators
│       ├── campus/{index,module}.ts + controllers, mappers, models, repositories, routes, services
│       └── events/{index,module}.ts + adapters, controllers, listeners, mappers, models, repositories, routes, services, validators
├── tests/{architecture,integration,shared,auth,campus,events}/
├── .dockerignore, .env.example, .gitattributes, .gitignore
├── Dockerfile, docker-compose.yml
├── package.json, package-lock.json, tsconfig.json, tsconfig.test.json, vitest.config.ts
└── README.md
```

## Actualización: revisión de consolidación

**Fecha:** 2026-11-04. Trabajo local, sin push.

**Inventario de ECIMyCampus en ese momento.** Los tres repos de servicios y `demo-repository` se retiraron después (ADR-011). No había seis microservicios: hay seis repositorios, de los cuales tres son servicios ya consolidados aquí.

| Repo | Qué es | Ramas remotas | Estado |
| :--- | :--- | :--- | :--- |
| `eci-mycampus-auth-service` | Servicio | `main` | Integrado con todo su historial |
| `eci-mycampus-campus-service` | Servicio | `main` | Integrado con todo su historial |
| `eci-mycampus-events-service` | Servicio | `main` | Integrado con todo su historial |
| `eci-mycampus-backend` | Monolito | `develop` | Repo vigente |
| `eci-mycampus-web` | Frontend | `main`, `develop` | Repo vigente |
| `demo-repository` | Plantilla de ejemplo de GitHub | `main`, `add-badges-to-readme` | Ajeno al proyecto; no se integra |

Ninguna rama local o remota de los repos vigentes queda sin integrar en `develop`, y no hay PR ni issues en la organización.

**Cambios:** ver `GUIDE_COMPLIANCE.md` y las decisiones ADR-009 y ADR-010. Además, H-07 y H-09 quedan cubiertos en parte: hay seed y administrador inicial, pero sigue sin haber gestión de roles por API.

**Pruebas tras esta revisión:**

- Backend: 172 de 172 con PostgreSQL embebido, cobertura de líneas de 97,42 %, build correcto y `npm audit --omit=dev` en 0.
- Web: 4 de 4, build `standalone` correcto.
- E2E con backend en producción y servidor `standalone`: catálogo sembrado, registro, login, creación de evento, 403 a estudiante, aprobación con el administrador del seed, inscripción y 409 sin cupo.

**Sin verificar en ese momento:** las imágenes Docker y la guía de Azure.

## Estado vigente

Esta sección prevalece sobre lo anterior donde difieran.

- **Repositorios:** ECIMyCampus tiene `eci-mycampus-backend` y `eci-mycampus-web`. Ambos están en GitHub, con `develop` como rama de trabajo.
- **CI:** se ejecutó en GitHub y pasó en ambos repos, con Node 22 y Linux, incluidas las pruebas con PostgreSQL.
- **Docker:** el CI construye las imágenes y las arranca. La del backend responde `/health/ready` contra PostgreSQL y la de la web responde en `/`. `docker compose up` completo solo se validó con `docker compose config`, sin ejecutarlo.
- **Sin verificar:** la guía de Azure y el envío real de correos con Resend.
- **`main`:** en la web sigue en el estado anterior a la migración. En el backend existe solo en local.

