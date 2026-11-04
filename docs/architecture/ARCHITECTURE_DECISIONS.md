# Decisiones de arquitectura

Registro de decisiones importantes. Para cambiar una, se agrega una entrada nueva que la reemplace.

## ADR-001: de microservicios a monolito modular

- **Estado:** aceptada.
- **Contexto:** dos desarrolladores mantienen tres servicios que no se comunican entre sí, comparten PostgreSQL y secreto JWT, y se despliegan juntos en la práctica.
- **Decisión:** un solo proceso Fastify con módulos `auth`, `campus` y `events`.
- **Alternativas:**
  - *Mantener microservicios:* tres pipelines y dependencias sin ningún beneficio real hoy.
  - *Monolito sin módulos:* más simple al inicio, pero pierde los límites que ya existen y dificulta extraer algo en el futuro.
- **Consecuencias:** un solo despliegue y un solo conjunto de dependencias. Un fallo grave afecta a todo el backend y no se puede escalar por módulo. Es un costo aceptable a esta escala.

## ADR-002: dos repositorios, backend y frontend

- **Estado:** aceptada por el equipo.
- **Contexto:** había cuatro repos. Los tres servicios ya forman un solo sistema, mientras que el frontend tiene otro ciclo de trabajo y otra persona responsable de buena parte de su historial.
- **Decisión:** `eci-mycampus-backend` es un repo nuevo con el monolito, que importa el historial de los tres servicios mediante `git subtree` sin squash. `eci-mycampus-web` se conserva como repo del frontend. Cada repo tiene sus ramas `main` y `develop`.
- **Alternativas:**
  - *Monorepo con API y web:* permite cambios atómicos entre ambos, pero el equipo prefirió mantener los repos separados.
  - *Reutilizar `eci-mycampus-auth-service`:* conserva un remoto, pero el nombre deja de describir el contenido.
- **Consecuencias:** un cambio de contrato requiere dos commits coordinados, con `/docs` como referencia común. Los repos de servicios quedan como referencia hasta que el equipo decida archivarlos, y el remoto de `eci-mycampus-backend` aún debe crearse.

## ADR-003: el frontend es un despliegue separado

- **Estado:** aceptada.
- **Contexto:** se busca un único despliegue del backend; Next.js necesita su propio servidor.
- **Decisión:** el frontend se despliega por separado y llega al backend mediante rewrites.
- **Alternativas:** servir Next dentro de Fastify con un servidor personalizado. Acopla dos ciclos de vida y pierde optimizaciones de Next a cambio de ahorrar un proceso.
- **Consecuencias:** se despliegan dos procesos y una base, frente a los cuatro procesos anteriores.

## ADR-004: mover código en lugar de reescribirlo

- **Estado:** aceptada.
- **Contexto:** las capas internas de cada servicio ya son limpias y están cubiertas por pruebas.
- **Decisión:** cada servicio se mueve con `git mv` a `modules/<nombre>` conservando sus capas. Solo se extrae a `shared/` lo que estaba duplicado.
- **Alternativas:** rediseñar con arquitectura hexagonal estricta o por feature. Es un costo alto sin un problema concreto que resolver.
- **Consecuencias:** `git log --follow` sigue funcionando, y las pruebas originales sirven como verificación de la migración.

## ADR-005: una base, un esquema por módulo, sin claves foráneas entre módulos

- **Estado:** aceptada.
- **Contexto:** los servicios ya usaban un esquema por servicio en la misma base.
- **Decisión:** se conserva. Un `PrismaClient` compartido y un archivo Prisma por módulo.
- **Alternativas:**
  - *Unificar en un esquema:* elimina el aislamiento y exige mover datos.
  - *Un cliente Prisma por módulo:* mejor aislamiento en compilación, pero multiplica pasos de generación y conexiones.
- **Consecuencias:** el cliente compartido permite técnicamente consultar tablas ajenas. La convención y la revisión lo cubren, no el compilador. Las referencias entre módulos no tienen integridad en la base (hallazgo M-03 de la auditoría).

## ADR-006: un manejador de errores con mensajes por módulo

- **Estado:** aceptada.
- **Contexto:** la lógica estaba triplicada, pero los textos difieren entre servicios y forman parte del contrato con el cliente.
- **Decisión:** una sola implementación en `shared/errors` que recibe los textos de cada módulo y se registra en el ámbito encapsulado de Fastify de ese módulo.
- **Alternativas:** unificar los textos. Es más simple, pero cambia respuestas sin ninguna necesidad.
- **Consecuencias:** un pequeño objeto de configuración por módulo, a cambio de respuestas exactamente iguales.

## ADR-007: límites verificados con una prueba propia

- **Estado:** aceptada.
- **Contexto:** sin verificación, los límites de un monolito modular se erosionan.
- **Decisión:** una prueba de Vitest que analiza las importaciones de `src/` y falla ante una ilegal.
- **Alternativas:** `dependency-cruiser` o reglas de ESLint. Más potentes, pero añaden una dependencia y configuración que este caso simple no requiere.
- **Consecuencias:** análisis por expresión regular, suficiente para importaciones estáticas. No detecta `require` dinámico, que el proyecto no usa.
