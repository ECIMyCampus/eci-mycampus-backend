import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { AppConfig } from '../../src/config/env';
import { AuthMapper } from '../../src/modules/auth/mappers/auth.mapper';
import { authHttpModule } from '../../src/modules/auth/module';
import { AuthServiceImpl } from '../../src/modules/auth/services/impl/auth.service.impl';
import { AuthValidatorImpl } from '../../src/modules/auth/validators/impl/auth.validator.impl';
import { eventsHttpModule } from '../../src/modules/events/module';
import { EventsServiceImpl } from '../../src/modules/events/services/impl/events.service.impl';
import { EventValidatorImpl } from '../../src/modules/events/validators/impl/event.validator.impl';
import { InMemoryUserRepository, MockPasswordHasher } from '../auth/support/fixtures';
import {
  InMemoryEventRepository,
  InMemoryRegistrationRepository,
  InMemoryReportRepository,
  RecordingPublisher,
} from '../events/support/fixtures';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  jwtSecret: 'test_secret_with_more_than_16_chars',
  corsOrigin: false,
  emailFrom: 'test@ecimycampus.dev',
};

/** Antes, un cambio en los claims de auth podía romper events sin que ninguna prueba lo detectara. */
describe('Contrato de identidad entre auth y events', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    const hasher = new MockPasswordHasher();
    const registrations = new InMemoryRegistrationRepository();
    const reports = new InMemoryReportRepository();

    app = await buildApp(config, () => ({
      modules: [
        authHttpModule({
          authService: new AuthServiceImpl(users, new AuthValidatorImpl(users), hasher),
          authMapper: new AuthMapper(),
        }),
        eventsHttpModule(
          new EventsServiceImpl(
            new InMemoryEventRepository(),
            registrations,
            reports,
            new EventValidatorImpl(registrations, reports),
            new RecordingPublisher(),
          ),
        ),
      ],
      dispose: async () => {},
    }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('un token emitido por auth es aceptado por events con la identidad correcta', async () => {
    const email = 'ana.perez@mail.escuelaing.edu.co';
    const password = 'Password123';
    const registered = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password, fullName: 'Ana Pérez', habeasDataAccepted: true },
    });
    expect(registered.statusCode).toBe(201);

    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } });
    expect(login.statusCode).toBe(200);
    const authorization = `Bearer ${login.json().token}`;

    const start = new Date(Date.now() + 3_600_000);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      headers: { authorization },
      payload: {
        title: 'Taller de Docker',
        description: 'Introducción práctica a contenedores',
        category: 'ACADEMICO',
        buildingId: 'BLQ-B',
        specificLocation: 'Sala B-201',
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 3_600_000).toISOString(),
      },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json().organizerName).toBe('Ana Pérez');
    expect(created.json().status).toBe('PENDIENTE_APROBACION');
  });

  it('auth y events conservan su propio mensaje 401', async () => {
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    const report = await app.inject({
      method: 'POST',
      url: '/api/v1/events/11111111-1111-4111-8111-111111111111/register',
    });

    expect(me.statusCode).toBe(401);
    expect(me.json().mensaje).toBe('Token de autenticación inválido o ausente.');
    expect(report.statusCode).toBe(401);
    expect(report.json().mensaje).toBe('Debes iniciar sesión para realizar esta acción.');
  });
});
