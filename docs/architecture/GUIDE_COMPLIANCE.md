# Cumplimiento de la guía de backend

Contraste del backend con `GUIA_BACKEND.md` y `BUENAS_PRACTICAS.md`, los documentos de referencia del equipo. Esas guías nacen de un proyecto Java y Spring Boot, y separan expresamente los principios universales de los específicos de su tecnología. Aquí se aplican los universales, con el equivalente en TypeScript y Fastify.

## Estructura

Cada módulo sigue la estructura de la sección 2 de la guía, en plural como es habitual en TypeScript:

| Guía | Backend |
| :--- | :--- |
| `adapter/`, `adapter/impl/` | `modules/*/adapters/` |
| `controller/`, `controller/docs/` | `modules/*/controllers/`, `controllers/docs/` |
| `exception/` | `shared/errors/`, una sola jerarquía para todo el backend |
| `listener/` | `modules/events/listeners/` |
| `mapper/` | `modules/*/mappers/` |
| `model/domain/`, `event/`, `state/` | `modules/*/models/domain/`, `events/`, `state/` |
| `model/dto/request/`, `response/` | `modules/*/models/dto/request/`, `response/` |
| `persistence/entity/` | No aplica: Prisma genera los tipos a partir de `prisma/schema/` |
| `repository/`, `repository/spec/` | `modules/*/repositories/`, `prisma/`, `spec/` |
| `security/` | `shared/security/` |
| `service/`, `impl/`, `notification/` | `modules/*/services/`, `impl/`, `notification/` |
| `util/`, `validator/impl/` | `shared/utils/`, `modules/*/validators/impl/` |

Un módulo solo tiene las capas que necesita. Por ejemplo, `campus` es de solo lectura y no tiene validadores de negocio.

## Prácticas verificadas

| Práctica | Implementación | Verificación |
| :--- | :--- | :--- |
| Contrato OpenAPI separado del controlador | `controllers/docs/*.api.ts` | `/docs/json` publica 15 rutas |
| `DTO <-> Domain <-> Entity` con doble mapper | `*.mapper.ts`, `*-entity.mapper.ts` | Prueba de límites: el dominio no importa Fastify, Prisma ni Zod |
| Validación en dos niveles | Zod en la frontera, `I*Validator` en negocio | Pruebas web (400) y de validadores (409, 422) |
| Controladores delgados | Sin lógica, repositorios ni `try/catch` | Revisión de los tres controladores |
| Inyección por constructor | `module.ts` y `container.ts` | Las pruebas inyectan dobles |
| State con denegación por defecto | `models/domain/state/` | `event-state.test.ts` |
| Specification | `repositories/spec/event.specs.ts`, sin filtrar en memoria | `specs-and-notifications.test.ts` e integración |
| Observer, Factory y Strategy | `listeners/`, `services/notification/` | Un fallo del proveedor no afecta la operación |
| Adapter para servicios externos | `adapters/` (Resend, Argon2) | Sustituible en pruebas |
| Matriz HTTP y error único | `shared/errors/` | `app.test.ts` y pruebas web |
| Dinero con precisión exacta | `Decimal(10, 2)`, `string` en dominio | `infrastructure.test.ts` |
| Pruebas AAA y umbral de 85 % | Vitest con umbrales | CI |
| Datos de arranque idempotentes | `prisma/seed.ts` | Prueba de integración |

## Corregido en esta revisión

| Regla de la guía | Situación anterior | Ahora |
| :--- | :--- | :--- |
| El controlador solo mapea y delega | `AuthController` hasheaba la contraseña | Lo hace `AuthServiceImpl`, y solo tras validar. Un correo duplicado ya no consume Argon2 |
| SDK externo detrás de un adapter | Hasher en `lib/` | `adapters/impl/argon2-password-hasher.ts` |
| Un fallo secundario no tumba la operación principal, pero se registra | `.catch(() => {})` descartaba el error | Se registra en el log |
| Sembrado de datos para arrancar | No existía | `npm run prisma:seed` |

## Adaptaciones deliberadas

| Regla de la guía | Decisión | Motivo |
| :--- | :--- | :--- |
| Una sola aplicación por capas | Capas dentro de cada módulo | Los módulos dan los límites del monolito modular (ADR-001) |
| `/api/v1/<recurso-en-plural>` | Se conservan `/auth`, `/campus` y `/events` | Son el contrato existente |
| Trazabilidad `RF-XX` en cada prueba | No se aplica | El repo no tiene un catálogo de requisitos al que apuntar |
| Colección Postman versionada | No se añade | `/docs/json` es OpenAPI y se puede importar en Postman, sin mantener dos contratos |
| H2 para integración | PostgreSQL real | La reserva de cupos depende del comportamiento real de PostgreSQL |
| Baja lógica con `DELETE` | Sin aplicar | Aún no hay endpoints de borrado |

## Pendiente frente a la guía

- **Comprobación de existencia:** al crear un evento no se valida que `buildingId` y `facultyId` existan. Se haría mediante una interfaz publicada por `campus`, pero rechazaría peticiones que hoy se aceptan.
- **Checklist de RBAC:** cada endpoint protegido tiene guard; conviene revisar que todos tengan su prueba negativa de 403.
- **Linter:** no hay ESLint configurado.
