# ECI-MyCampus — Microservicio de Infraestructura & Campus (Campus Service)

Microservicio responsable de catalogar los edificios (Bloques A, B, C, D, E, F), auditorios, facultades con sus paletas de colores, canchas deportivas (Coliseo El Otoño, fútbol, tenis) y servicios/comercios de la Escuela Colombiana de Ingeniería Julio Garavito.

## Tecnologías
* **Runtime:** Node.js 20+ / TypeScript (strict)
* **Framework HTTP:** Fastify 5 + `fastify-type-provider-zod`
* **Validación y contratos:** Zod (entrada, salida y OpenAPI)
* **ORM:** Prisma ORM — PostgreSQL (`campus_schema`)
* **Pruebas:** Vitest + cobertura v8 (umbral 85 %)

## Arquitectura

Implementa la guía de arquitectura backend (`DTO <-> Domain <-> Entity`, controladores delgados, manejo centralizado de excepciones con `ErrorResponseDTO` e inyección de dependencias por constructor).

```text
src/
├── config/              # Variables de entorno validadas con Zod (fail-fast)
├── controllers/         # Controladores delgados (sin try/catch ni lógica de negocio)
│   └── docs/            # Contratos CampusApi: schemas de entrada/salida + OpenAPI
├── exceptions/          # Jerarquía única de excepciones + GlobalErrorHandler
├── lib/                 # PrismaClient
├── mappers/             # CampusMapper (DTO <-> Domain) y CampusEntityMapper (Domain <-> Prisma)
├── models/
│   ├── domain/          # Entidades puras Building, CampusPlace, CampusService, Faculty, SportsFacility
│   └── dto/
│       ├── request/     # Esquemas Zod de parámetros de consulta
│       └── response/    # Contratos de salida + ErrorResponseDTO
├── repositories/        # Interfaces ICampusRepository
│   └── prisma/          # Implementación Prisma
├── routes/              # Endpoint + contrato + handler
├── services/            # ICampusService
│   └── impl/            # CampusServiceImpl (orquestación del caso de uso)
├── app.ts               # buildApp(): ensambla Fastify (testeable sin abrir puerto)
├── container.ts         # Composition root
└── server.ts            # Arranque y apagado ordenado (SIGINT/SIGTERM)
```

## Endpoints (`/api/v1/campus`)

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| GET | `/health` | Público | Comprobación de salud del servicio |
| GET | `/docs` | Público | Documentación interactiva Swagger UI / OpenAPI |
| GET | `/buildings` | Público | Catálogo de edificios activos con salones y comercios |
| GET | `/buildings/:id` | Público | Detalle de edificio por UUID, código (BLQ-A) o ID SVG |
| GET | `/faculties` | Público | Lista de facultades con su paleta de color institucional |
| GET | `/sports` | Público | Catálogo de escenarios deportivos y canchas |

## Ejecución local

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev            # http://localhost:4002  ·  docs en /docs
```

## Calidad

```bash
npm run typecheck      # tsc estricto (src + tests)
npm test               # pruebas unitarias y de integración web (AAA)
npm run test:coverage  # verificación con umbrales de cobertura
```
