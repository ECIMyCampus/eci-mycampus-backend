# ECI-MyCampus — Microservicio de Identidad & Autenticación (Auth Service)

Microservicio responsable de la autenticación de usuarios, emisión y verificación de tokens JWT, registro con validación de dominio institucional (`@escuelaing.edu.co` o `@mail.escuelaing.edu.co`), hash seguro mediante Argon2id y gestión de roles RBAC.

## Tecnologías
* **Runtime:** Node.js 20+ / TypeScript (strict)
* **Framework HTTP:** Fastify 5 + `fastify-type-provider-zod`
* **Validación y contratos:** Zod (entrada, salida y OpenAPI)
* **ORM:** Prisma ORM — PostgreSQL (`auth_schema`)
* **Cifrado de contraseñas:** Argon2id (RFC 9106)
* **Tokens:** JWT criptográfico firmado con clave secreta (7 días de vigencia)
* **Pruebas:** Vitest + cobertura v8 (umbral 85 %)

## Arquitectura

Implementa la guía de arquitectura backend (`DTO <-> Domain <-> Entity`, controladores delgados, validación en dos niveles, manejo centralizado de excepciones con `ErrorResponseDTO` e inyección de dependencias por constructor).

```text
src/
├── config/              # Variables de entorno validadas con Zod (fail-fast)
├── controllers/         # Controladores delgados (sin try/catch ni lógica de negocio)
│   └── docs/            # Contratos AuthApi: schemas de entrada/salida + OpenAPI
├── exceptions/          # Jerarquía única de excepciones + GlobalErrorHandler
├── lib/                 # PrismaClient y Argon2PasswordHasher
├── mappers/             # AuthMapper (DTO <-> Domain) y UserEntityMapper (Domain <-> Prisma)
├── models/
│   ├── domain/          # Entidad pura User, UserProfile, enums y tipos
│   └── dto/
│       ├── request/     # Esquemas Zod de entrada (.strict() contra mass assignment)
│       └── response/    # Contratos de salida + ErrorResponseDTO
├── repositories/        # Interfaces IUserRepository
│   └── prisma/          # Implementación Prisma con trazabilidad de auditoría
├── routes/              # Endpoint + contrato + handler
├── services/            # IAuthService
│   └── impl/            # AuthServiceImpl (orquestación del caso de uso)
├── validators/          # IAuthValidator + impl (reglas de negocio e invariantes)
├── app.ts               # buildApp(): ensambla Fastify (testeable sin abrir puerto)
├── container.ts         # Composition root
└── server.ts            # Arranque y apagado ordenado (SIGINT/SIGTERM)
```

## Endpoints (`/api/v1/auth`)

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| GET | `/health` | Público | Comprobación de salud del servicio |
| GET | `/docs` | Público | Documentación interactiva Swagger UI / OpenAPI |
| POST | `/register` | Público | Registro de estudiante con correo institucional y Habeas Data |
| POST | `/login` | Público | Autenticación con contraseña y emisión de JWT |
| GET | `/me` | Autenticado | Perfil del usuario autenticado (requiere Bearer JWT) |

### Formato estándar de error

```json
{
  "status": 409,
  "error": "Conflict",
  "mensaje": "Ya existe una cuenta registrada con este correo electrónico institucional.",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-11-04T00:00:00.000Z"
}
```

## Ejecución local

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev            # http://localhost:4001  ·  docs en /docs
```

## Calidad

```bash
npm run typecheck      # tsc estricto (src + tests)
npm test               # pruebas unitarias y de integración web (AAA)
npm run test:coverage  # verificación con umbrales de cobertura
```
