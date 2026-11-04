import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { AppConfig } from '../../src/config/env';
import type { UserRole } from '../../src/models/domain/enums';
import { EventsServiceImpl } from '../../src/services/impl/events.service.impl';
import { EventValidatorImpl } from '../../src/validators/impl/event.validator.impl';
import {
  buildEvent,
  EVENT_ID,
  InMemoryEventRepository,
  InMemoryRegistrationRepository,
  InMemoryReportRepository,
  NOW,
  RecordingPublisher,
} from '../support/fixtures';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  jwtSecret: 'test_secret_with_more_than_16_chars',
  corsOrigin: true,
  emailFrom: 'test@ecimycampus.dev',
};

const validBody = {
  title: 'Taller de Docker',
  description: 'Introducción práctica a contenedores',
  category: 'ACADEMICO',
  buildingId: 'BLQ-B',
  specificLocation: 'Sala B-201',
  startTime: '2026-11-20T14:00:00.000Z',
  endTime: '2026-11-20T16:00:00.000Z',
  requiresRegistration: true,
  maxCapacity: 30,
};

describe('Events API (rutas + guards + GlobalErrorHandler)', () => {
  let app: FastifyInstance;
  let events: InMemoryEventRepository;
  let registrations: InMemoryRegistrationRepository;

  const tokenFor = (role: UserRole, id = 'student-1') =>
    `Bearer ${app.jwt.sign({ id, email: `${id}@mail.escuelaing.edu.co`, fullName: 'Usuario Test', role })}`;

  beforeEach(async () => {
    events = new InMemoryEventRepository();
    registrations = new InMemoryRegistrationRepository();
    const reports = new InMemoryReportRepository();
    const service = new EventsServiceImpl(
      events,
      registrations,
      reports,
      new EventValidatorImpl(registrations, reports),
      new RecordingPublisher(),
      () => NOW,
    );
    app = await buildApp(config, () => ({ eventsService: service, dispose: async () => {} }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /radar responde 200 sin autenticación', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    // Act
    const res = await app.inject({ method: 'GET', url: '/api/v1/events/radar' });
    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.json()[0]).toMatchObject({ id: EVENT_ID, registrationsCount: 0, price: '0.00' });
  });

  it('GET /radar con categoría inválida responde 400 con ErrorResponseDTO', async () => {
    // Act
    const res = await app.inject({ method: 'GET', url: '/api/v1/events/radar?category=FIESTA' });
    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 400, error: 'Bad Request', path: '/api/v1/events/radar?category=FIESTA' });
    expect(res.json().detalles[0].campo).toContain('category');
  });

  it('POST / sin token responde 401', async () => {
    // Act
    const res = await app.inject({ method: 'POST', url: '/api/v1/events', payload: validBody });
    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.json().mensaje).toBeDefined();
  });

  it('POST / con rol INVITADO responde 403', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      payload: validBody,
      headers: { authorization: tokenFor('INVITADO') },
    });
    // Assert
    expect(res.statusCode).toBe(403);
  });

  it('POST / con campos no permitidos (mass assignment) responde 400', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      payload: { ...validBody, status: 'PUBLICADO' },
      headers: { authorization: tokenFor('ESTUDIANTE') },
    });
    // Assert
    expect(res.statusCode).toBe(400);
  });

  it('POST / válido responde 201 y queda PENDIENTE_APROBACION', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      payload: validBody,
      headers: { authorization: tokenFor('ESTUDIANTE') },
    });
    // Assert
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ status: 'PENDIENTE_APROBACION', organizerName: 'Usuario Test' });
  });

  it('POST / con fin anterior al inicio responde 422', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      payload: { ...validBody, endTime: '2026-11-20T13:00:00.000Z' },
      headers: { authorization: tokenFor('ESTUDIANTE') },
    });
    // Assert
    expect(res.statusCode).toBe(422);
  });

  it('PATCH /:id/approve exige rol MODERADOR o ADMIN (403)', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'PENDIENTE_APROBACION' }));
    // Act
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${EVENT_ID}/approve`,
      headers: { authorization: tokenFor('ESTUDIANTE') },
    });
    // Assert
    expect(res.statusCode).toBe(403);
  });

  it('PATCH /:id/approve por un moderador responde 200', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'PENDIENTE_APROBACION' }));
    // Act
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${EVENT_ID}/approve`,
      headers: { authorization: tokenFor('MODERADOR', 'mod-1') },
    });
    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('PUBLICADO');
  });

  it('PATCH /:id/approve sobre un evento inexistente responde 404', async () => {
    // Act
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${EVENT_ID}/approve`,
      headers: { authorization: tokenFor('ADMIN', 'admin-1') },
    });
    // Assert
    expect(res.statusCode).toBe(404);
  });

  it('POST /:id/register responde 201 y luego 409 al repetir', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    const request = {
      method: 'POST' as const,
      url: `/api/v1/events/${EVENT_ID}/register`,
      headers: { authorization: tokenFor('ESTUDIANTE') },
    };
    // Act
    const first = await app.inject(request);
    const second = await app.inject(request);
    // Assert
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
  });

  it('POST /:id/register con id no UUID responde 400', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events/abc/register',
      headers: { authorization: tokenFor('ESTUDIANTE') },
    });
    // Assert
    expect(res.statusCode).toBe(400);
  });

  it('GET /:id responde 200 para un evento publicado', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    // Act
    const res = await app.inject({ method: 'GET', url: `/api/v1/events/${EVENT_ID}` });
    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: EVENT_ID, temporalStatus: 'PROXIMO', isLive: false });
  });

  it('PATCH /:id/reject por un moderador guarda el motivo', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'PENDIENTE_APROBACION' }));
    // Act
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${EVENT_ID}/reject`,
      payload: { reason: 'Información incompleta del lugar' },
      headers: { authorization: tokenFor('MODERADOR', 'mod-1') },
    });
    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'RECHAZADO', rejectionReason: 'Información incompleta del lugar' });
  });

  it('PATCH /:id/cancel sobre un evento ya cancelado responde 422', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'CANCELADO' }));
    // Act
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${EVENT_ID}/cancel`,
      headers: { authorization: tokenFor('ESTUDIANTE', 'organizer-1') },
    });
    // Assert
    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe('Unprocessable Entity');
  });

  it('POST /:id/reports responde 201', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    // Act
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/events/${EVENT_ID}/reports`,
      payload: { reason: 'Evento falso', description: 'El salón no existe' },
      headers: { authorization: tokenFor('ESTUDIANTE') },
    });
    // Assert
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ status: 'RECIBIDO', reason: 'Evento falso' });
  });

  it('JSON malformado responde 400', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      payload: '{"title":',
      headers: { authorization: tokenFor('ESTUDIANTE'), 'content-type': 'application/json' },
    });
    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.json().status).toBe(400);
  });

  it('un token inválido se trata como visitante (401 en rutas protegidas)', async () => {
    // Act
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/events/${EVENT_ID}/register`,
      headers: { authorization: 'Bearer token.invalido.x' },
    });
    // Assert
    expect(res.statusCode).toBe(401);
  });

  it('rutas inexistentes responden 404 con el formato estándar', async () => {
    // Act
    const res = await app.inject({ method: 'GET', url: '/api/v1/nada' });
    // Assert
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ status: 404, error: 'Not Found' });
  });
});
